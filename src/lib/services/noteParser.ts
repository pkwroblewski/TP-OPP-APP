/**
 * LAYER 2: Controlled Note Parsing
 *
 * ANTI-HALLUCINATION RULES:
 * 1. Only parse notes that are explicitly referenced in balance sheet/P&L
 * 2. Only extract IC breakdowns that are explicitly stated with IC keywords
 * 3. If note is missing/unreadable, return noteAccessible: false
 * 4. Do NOT infer what a note "probably" contains
 * 5. Every extracted amount must have explicit IC language nearby
 */

import { ICIdentificationKeywords, NoteReferencePatterns } from './luxembourgPatterns';

/**
 * Result of parsing a specific note
 */
export interface NoteParsingResult {
  /** The note number/reference (e.g., "Note 15") */
  noteNumber: string;
  /** Whether the note was found and readable in the document */
  noteAccessible: boolean;
  /** The raw note content if accessible */
  noteContent: string | null;
  /** IC-specific breakdown if found in the note */
  icBreakdown: ICBreakdown | null;
  /** Any warnings or issues during parsing */
  parsingWarnings: string[];
  /** Page number where note was found */
  pageNumber: number | null;
}

/**
 * IC-specific items found within a note
 */
export interface ICBreakdown {
  /** Individual IC items extracted from the note */
  items: ICBreakdownItem[];
  /** Whether the total was verified against extracted items */
  totalVerified: boolean;
  /** The total if explicitly stated */
  explicitTotal: number | null;
  /** Sum of individual items */
  calculatedTotal: number;
}

/**
 * Individual IC item from a note
 */
export interface ICBreakdownItem {
  /** Description of the IC item */
  description: string;
  /** Amount in EUR */
  amount: number;
  /** Counterparty name if mentioned */
  counterparty: string | null;
  /** Exact source text containing this amount */
  source: string;
  /** Whether this is definitely IC (based on keyword match) */
  confirmedIC: boolean;
  /** The IC keyword that confirmed this */
  icKeywordMatched: string | null;
}

/**
 * Types of IC transactions that might be found in notes
 */
export type ICTransactionType =
  | 'interest_income'
  | 'interest_expense'
  | 'dividend_income'
  | 'management_fee_income'
  | 'management_fee_expense'
  | 'service_fee_income'
  | 'service_fee_expense'
  | 'loan_principal'
  | 'guarantee'
  | 'other';

/**
 * Layer 2 Note Parser
 * CRITICAL: This only extracts IC items EXPLICITLY stated in notes
 * It does NOT assume total amounts are IC-related
 */
export class NoteParser {
  private pdfText: string;
  private lines: string[];
  private noteSections: Map<string, { start: number; end: number; content: string }>;

  constructor(pdfText: string) {
    this.pdfText = pdfText;
    this.lines = pdfText.split('\n');
    this.noteSections = new Map();
    this.indexNoteSections();
  }

  /**
   * Index all note sections in the document for efficient lookup
   */
  private indexNoteSections(): void {
    const noteHeaderPattern = /^[\s]*(?:Note|NOTE)\s*(\d+)[\s\-:.]*/i;
    let currentNote: string | null = null;
    let currentStart = -1;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(noteHeaderPattern);

      if (match) {
        // Save previous note if exists
        if (currentNote !== null && currentStart >= 0) {
          this.noteSections.set(currentNote, {
            start: currentStart,
            end: i - 1,
            content: this.lines.slice(currentStart, i).join('\n'),
          });
        }

        // Start new note
        currentNote = `Note ${match[1]}`;
        currentStart = i;
      }
    }

    // Save last note
    if (currentNote !== null && currentStart >= 0) {
      this.noteSections.set(currentNote, {
        start: currentStart,
        end: this.lines.length - 1,
        content: this.lines.slice(currentStart).join('\n'),
      });
    }
  }

  /**
   * Parse a specific note by reference
   * CRITICAL: Only extracts IC items explicitly stated in notes
   */
  async parseNote(noteReference: string): Promise<NoteParsingResult> {
    const result: NoteParsingResult = {
      noteNumber: noteReference,
      noteAccessible: false,
      noteContent: null,
      icBreakdown: null,
      parsingWarnings: [],
      pageNumber: null,
    };

    // Normalize note reference
    const normalizedRef = this.normalizeNoteReference(noteReference);
    if (!normalizedRef) {
      result.parsingWarnings.push(`Invalid note reference format: ${noteReference}`);
      return result;
    }

    // Try to find the note content
    const noteSection = this.noteSections.get(normalizedRef);
    if (!noteSection) {
      // Try fuzzy search
      const fuzzyMatch = this.fuzzyFindNote(normalizedRef);
      if (!fuzzyMatch) {
        result.parsingWarnings.push(`Note ${normalizedRef} not found in document`);
        return result;
      }
      result.noteContent = fuzzyMatch.content;
      result.noteAccessible = true;
      result.pageNumber = this.estimatePageNumber(fuzzyMatch.start);
    } else {
      result.noteContent = noteSection.content;
      result.noteAccessible = true;
      result.pageNumber = this.estimatePageNumber(noteSection.start);
    }

    // Extract IC breakdown if note content found
    if (result.noteContent) {
      result.icBreakdown = this.extractICBreakdownFromNote(result.noteContent);

      if (result.icBreakdown === null) {
        result.parsingWarnings.push(
          `No explicit IC language found in ${normalizedRef}. ` +
          `Note may contain totals but IC nature not confirmed.`
        );
      }
    }

    return result;
  }

  /**
   * Parse multiple notes and return results
   */
  async parseNotes(noteReferences: string[]): Promise<Map<string, NoteParsingResult>> {
    const results = new Map<string, NoteParsingResult>();

    for (const ref of noteReferences) {
      if (ref) {
        const result = await this.parseNote(ref);
        results.set(ref, result);
      }
    }

    return results;
  }

  /**
   * Extract IC breakdown from note content
   * CRITICAL: Only extracts items that have EXPLICIT IC language
   */
  private extractICBreakdownFromNote(noteText: string): ICBreakdown | null {
    const items: ICBreakdownItem[] = [];
    const lines = noteText.split('\n');

    // Check if note contains any IC keywords at all
    const hasICKeywords = this.noteContainsICKeywords(noteText);
    if (!hasICKeywords) {
      return null; // No IC language found - do not extract anything
    }

    // Process each line looking for amounts with IC context
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const contextWindow = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join(' ');

      // Check if this line or context has IC keyword
      const icMatch = this.findICKeywordMatch(contextWindow);
      if (!icMatch) continue;

      // Try to extract amount from line
      const amounts = this.extractAmountsFromLine(line);
      if (amounts.length === 0) continue;

      // Extract counterparty name if present
      const counterparty = this.extractCounterpartyName(contextWindow);

      // Create IC item for each amount found
      for (const amount of amounts) {
        items.push({
          description: this.cleanDescription(line),
          amount: amount.value,
          counterparty,
          source: line.trim().substring(0, 200),
          confirmedIC: true,
          icKeywordMatched: icMatch.keyword,
        });
      }
    }

    if (items.length === 0) {
      return null;
    }

    // Calculate totals
    const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const explicitTotal = this.findExplicitTotal(noteText);

    return {
      items,
      totalVerified: explicitTotal !== null && Math.abs(explicitTotal - calculatedTotal) < 1,
      explicitTotal,
      calculatedTotal,
    };
  }

  /**
   * Check if note contains any IC identification keywords
   */
  private noteContainsICKeywords(noteText: string): boolean {
    const lowerText = noteText.toLowerCase();

    // Check primary French keywords
    for (const keyword of ICIdentificationKeywords.primary.french) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    // Check primary English keywords
    for (const keyword of ICIdentificationKeywords.primary.english) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find specific IC keyword match in text
   */
  private findICKeywordMatch(text: string): { keyword: string; position: number } | null {
    const lowerText = text.toLowerCase();

    // Check all IC keywords
    const allKeywords = [
      ...ICIdentificationKeywords.primary.french,
      ...ICIdentificationKeywords.primary.english,
      ...ICIdentificationKeywords.revenueIndicators.french,
      ...ICIdentificationKeywords.revenueIndicators.english,
      ...ICIdentificationKeywords.expenseIndicators.french,
      ...ICIdentificationKeywords.expenseIndicators.english,
    ];

    for (const keyword of allKeywords) {
      const position = lowerText.indexOf(keyword.toLowerCase());
      if (position >= 0) {
        return { keyword, position };
      }
    }

    return null;
  }

  /**
   * Extract all amounts from a line of text
   */
  private extractAmountsFromLine(line: string): Array<{ value: number; raw: string }> {
    const amounts: Array<{ value: number; raw: string }> = [];
    let match;

    // European format with decimals: 1.234.567,89 or 1 234 567,89
    const euroPattern = /(\d{1,3}(?:[\s.]?\d{3})*)[,](\d{2})(?!\d)/g;
    while ((match = euroPattern.exec(line)) !== null) {
      const intPart = match[1].replace(/[\s.]/g, '');
      const decPart = match[2];
      const value = parseFloat(`${intPart}.${decPart}`);
      if (value > 0) {
        amounts.push({ value, raw: match[0] });
      }
    }

    // US format with decimals: 1,234,567.89
    if (amounts.length === 0) {
      const usPatternWithDecimals = /(\d{1,3}(?:,\d{3})+)[.](\d{2})(?!\d)/g;
      while ((match = usPatternWithDecimals.exec(line)) !== null) {
        const intPart = match[1].replace(/,/g, '');
        const decPart = match[2];
        const value = parseFloat(`${intPart}.${decPart}`);
        if (value > 0) {
          amounts.push({ value, raw: match[0] });
        }
      }
    }

    // US format without decimals: 1,234,567 or 517,445,444
    if (amounts.length === 0) {
      const usPatternNoDecimals = /(\d{1,3}(?:,\d{3})+)(?![.,\d])/g;
      while ((match = usPatternNoDecimals.exec(line)) !== null) {
        const value = parseInt(match[1].replace(/,/g, ''), 10);
        if (value > 0) {
          amounts.push({ value, raw: match[0] });
        }
      }
    }

    // Simple integer format (for thousands/millions)
    if (amounts.length === 0) {
      const simplePattern = /(?:EUR|€)?\s*(\d{4,})/g;
      while ((match = simplePattern.exec(line)) !== null) {
        const value = parseInt(match[1], 10);
        if (value > 0) {
          amounts.push({ value, raw: match[0] });
        }
      }
    }

    return amounts;
  }

  /**
   * Extract counterparty name from text
   */
  private extractCounterpartyName(text: string): string | null {
    // Common patterns for counterparty names
    const patterns = [
      /(?:to|from|avec|envers|sur)\s+([A-Z][A-Za-zÀ-ÿ\s\-\.]+?)\s*(?:S\.A\.|S\.à\.r\.l\.|SA|SARL|Ltd|GmbH|BV|NV)/i,
      /([A-Z][A-Za-zÀ-ÿ\s\-\.]+?)\s*(?:S\.A\.|S\.à\.r\.l\.|SA|SARL|Ltd|GmbH|BV|NV)/i,
      /(?:parent|subsidiary|affiliated)\s+(?:company\s+)?([A-Z][A-Za-zÀ-ÿ\s\-\.]+)/i,
      /(?:société\s+mère|filiale)\s*:?\s*([A-Z][A-Za-zÀ-ÿ\s\-\.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Find explicit total in note text
   */
  private findExplicitTotal(noteText: string): number | null {
    const lines = noteText.split('\n');

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('total') || lowerLine.includes('somme')) {
        const amounts = this.extractAmountsFromLine(line);
        if (amounts.length > 0) {
          return amounts[amounts.length - 1].value; // Usually total is last amount on line
        }
      }
    }

    return null;
  }

  /**
   * Clean description text
   */
  private cleanDescription(text: string): string {
    return text
      .replace(/[\s]+/g, ' ')
      .replace(/[€\$£]/g, '')
      .replace(/\d{1,3}(?:[\s.,]?\d{3})*(?:[.,]\d{2})?/g, '')
      .trim()
      .substring(0, 100);
  }

  /**
   * Normalize note reference to standard format
   */
  private normalizeNoteReference(reference: string): string | null {
    const match = reference.match(/(\d+)/);
    if (!match) return null;
    return `Note ${match[1]}`;
  }

  /**
   * Fuzzy search for a note when exact match fails
   */
  private fuzzyFindNote(noteRef: string): { start: number; end: number; content: string } | null {
    const noteNum = noteRef.match(/(\d+)/)?.[1];
    if (!noteNum) return null;

    // Search for note header in text
    const patterns = [
      new RegExp(`Note\\s*${noteNum}[\\s\\-:.]`, 'i'),
      new RegExp(`NOTE\\s*${noteNum}[\\s\\-:.]`, 'i'),
      new RegExp(`\\(${noteNum}\\)`, 'i'),
    ];

    for (const pattern of patterns) {
      for (let i = 0; i < this.lines.length; i++) {
        if (pattern.test(this.lines[i])) {
          // Found start, look for end (next note or significant section break)
          let endIndex = this.lines.length;
          for (let j = i + 1; j < this.lines.length; j++) {
            if (/^[\s]*(?:Note|NOTE)\s*\d+[\s\-:.]/i.test(this.lines[j])) {
              endIndex = j;
              break;
            }
          }

          return {
            start: i,
            end: endIndex,
            content: this.lines.slice(i, endIndex).join('\n'),
          };
        }
      }
    }

    return null;
  }

  /**
   * Estimate page number based on line position
   */
  private estimatePageNumber(lineIndex: number): number | null {
    let pageNum = 1;
    for (let i = 0; i < lineIndex; i++) {
      const line = this.lines[i].toLowerCase();
      const pageMatch = line.match(/page\s*(\d+)/i);
      if (pageMatch) {
        const num = parseInt(pageMatch[1], 10);
        if (num > 0 && num < 100) {
          pageNum = num;
        }
      }
    }
    return pageNum;
  }

  /**
   * Get list of all notes found in document
   */
  getAvailableNotes(): string[] {
    return Array.from(this.noteSections.keys()).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });
  }

  /**
   * Search for related party note specifically
   */
  async findRelatedPartyNote(): Promise<NoteParsingResult | null> {
    const relatedPartyPatterns = [
      /related\s*part/i,
      /parties\s*liées/i,
      /entreprises\s*liées/i,
      /affiliated\s*undertak/i,
      /transactions\s*with\s*related/i,
    ];

    const entries = Array.from(this.noteSections.entries());
    for (const [noteRef, section] of entries) {
      for (const pattern of relatedPartyPatterns) {
        if (pattern.test(section.content)) {
          return this.parseNote(noteRef);
        }
      }
    }

    return null;
  }

  /**
   * Determine transaction type from context
   */
  determineTransactionType(text: string): ICTransactionType {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('interest') || lowerText.includes('intérêt')) {
      if (lowerText.includes('payable') || lowerText.includes('expense') || lowerText.includes('charge')) {
        return 'interest_expense';
      }
      return 'interest_income';
    }

    if (lowerText.includes('dividend') || lowerText.includes('dividende')) {
      return 'dividend_income';
    }

    if (lowerText.includes('management') || lowerText.includes('gestion')) {
      if (lowerText.includes('paid') || lowerText.includes('payé') || lowerText.includes('expense')) {
        return 'management_fee_expense';
      }
      return 'management_fee_income';
    }

    if (lowerText.includes('service') || lowerText.includes('administrative')) {
      if (lowerText.includes('paid') || lowerText.includes('payé') || lowerText.includes('expense')) {
        return 'service_fee_expense';
      }
      return 'service_fee_income';
    }

    if (lowerText.includes('loan') || lowerText.includes('prêt') || lowerText.includes('créance')) {
      return 'loan_principal';
    }

    if (lowerText.includes('guarantee') || lowerText.includes('garantie')) {
      return 'guarantee';
    }

    return 'other';
  }
}

export default NoteParser;
