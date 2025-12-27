/**
 * LAYER 1: Structured Pattern-Based Extraction
 *
 * ANTI-HALLUCINATION RULES:
 * 1. Only extract values that match EXACT patterns
 * 2. Every extracted value MUST include source reference
 * 3. If pattern not found, return null (not 0, not guessed value)
 * 4. No AI interpretation allowed in this layer
 * 5. All amounts must have verifiable source text
 */

import {
  ExtractionPattern,
  BalanceSheetPatterns,
  PLPatterns,
  AmountPatterns,
  NoteReferencePatterns,
} from './luxembourgPatterns';

/**
 * Represents a single extracted value with mandatory source tracking
 */
export interface ExtractedValue {
  /** The extracted amount (null if not found - NEVER guess) */
  amount: number | null;
  /** The exact source text that contains this value */
  source: string | null;
  /** Page number where found (if determinable) */
  pageNumber: number | null;
  /** Line reference or surrounding context */
  lineReference: string | null;
  /** Note reference if mentioned (e.g., "Note 8") */
  noteReference: string | null;
  /** Confidence level based on pattern match quality */
  confidence: 'high' | 'medium' | 'low';
  /** The pattern that matched */
  matchedPattern: string | null;
  /** Warning if extraction had issues */
  warning: string | null;
}

/**
 * Balance sheet extraction result with source tracking
 */
export interface BalanceSheetExtraction {
  /** C.III.1 - Shares in affiliated undertakings */
  sharesInAffiliatedUndertakings: ExtractedValue;
  /** C.III.2 - IC loans provided (fixed assets, > 1 year) */
  icLoansProvidedLongTerm: ExtractedValue;
  /** D.II.2 - IC loans/receivables (current assets, < 1 year) */
  icLoansProvidedShortTerm: ExtractedValue;
  /** C.5 - IC loans received (long term, > 1 year) */
  icLoansReceivedLongTerm: ExtractedValue;
  /** C.5 - IC loans received (short term, < 1 year) */
  icLoansReceivedShortTerm: ExtractedValue;
  /** Total assets for validation */
  totalAssets: ExtractedValue;
  /** Total equity for thin cap analysis */
  totalEquity: ExtractedValue;
}

/**
 * P&L extraction result with source tracking
 */
export interface PLExtraction {
  /** Item 4 total - requires note to verify IC content */
  item4TotalAmount: ExtractedValue;
  /** Note reference for Item 4 */
  item4NoteReference: string | null;
  /** Item 9a - IC dividend income */
  item9aDividendsFromAffiliates: ExtractedValue;
  /** Item 10 total - interest from investments */
  item10TotalInterest: ExtractedValue;
  /** Item 10a - IC interest income (PRIMARY) */
  item10aInterestFromAffiliates: ExtractedValue;
  /** Item 11 total - other interest */
  item11TotalInterest: ExtractedValue;
  /** Item 11a - IC interest income (SECONDARY) */
  item11aInterestFromAffiliates: ExtractedValue;
  /** Item 14 total - interest expense */
  item14TotalInterest: ExtractedValue;
  /** Item 14a - IC interest expense */
  item14aInterestToAffiliates: ExtractedValue;
  /** Net turnover for context */
  netTurnover: ExtractedValue;
  /** Net profit/loss */
  netProfitLoss: ExtractedValue;
}

/**
 * Company info extracted from header/notes
 */
export interface CompanyInfoExtraction {
  name: string | null;
  rcsNumber: string | null;
  totalAssets: number | null;
  fiscalYearEnd: string | null;
  currency: string;
}

/**
 * Layer 1 Structured Extractor
 * CRITICAL: This class only extracts what is EXPLICITLY STATED
 * It does NOT interpret, assume, or calculate
 */
export class StructuredExtractor {
  private pdfText: string;
  private lines: string[];
  private scale: number = 1; // 1 = EUR, 1000 = thousands, 1000000 = millions

  constructor(pdfText: string) {
    this.pdfText = pdfText;
    this.lines = pdfText.split('\n');
    this.detectScale();
  }

  /**
   * Detect if amounts are in thousands or millions
   */
  private detectScale(): void {
    const text = this.pdfText.toLowerCase();

    // Check for scale indicators
    if (text.includes('en milliers') || text.includes('in thousands') ||
        text.includes('(000)') || text.includes('keur')) {
      this.scale = 1000;
    } else if (text.includes('en millions') || text.includes('in millions') ||
               text.includes('(000 000)') || text.includes('meur')) {
      this.scale = 1000000;
    }
  }

  /**
   * Extract balance sheet items with source tracking
   */
  async extractBalanceSheet(): Promise<BalanceSheetExtraction> {
    return {
      sharesInAffiliatedUndertakings: this.extractExactPattern(
        BalanceSheetPatterns.SHARES_IN_AFFILIATES,
        'balance_sheet'
      ),
      icLoansProvidedLongTerm: this.extractExactPattern(
        BalanceSheetPatterns.IC_LOANS_PROVIDED_LONG_TERM,
        'balance_sheet_fixed_assets'
      ),
      icLoansProvidedShortTerm: this.extractExactPattern(
        BalanceSheetPatterns.IC_LOANS_PROVIDED_SHORT_TERM,
        'balance_sheet_current_assets'
      ),
      icLoansReceivedLongTerm: this.extractExactPattern(
        BalanceSheetPatterns.IC_LOANS_RECEIVED_LONG_TERM,
        'balance_sheet_liabilities_long'
      ),
      icLoansReceivedShortTerm: this.extractExactPattern(
        BalanceSheetPatterns.IC_LOANS_RECEIVED_SHORT_TERM,
        'balance_sheet_liabilities_short'
      ),
      totalAssets: this.extractExactPattern(
        BalanceSheetPatterns.TOTAL_ASSETS,
        'balance_sheet'
      ),
      totalEquity: this.extractExactPattern(
        BalanceSheetPatterns.TOTAL_EQUITY,
        'balance_sheet'
      ),
    };
  }

  /**
   * Extract P&L items with source tracking
   */
  async extractPL(): Promise<PLExtraction> {
    // Extract Item 4 and its note reference
    const item4 = this.extractExactPattern(
      PLPatterns.ITEM_4_OTHER_OPERATING_INCOME,
      'profit_loss'
    );
    const item4NoteRef = this.extractNoteReferenceNearPattern(
      PLPatterns.ITEM_4_OTHER_OPERATING_INCOME
    );

    return {
      item4TotalAmount: item4,
      item4NoteReference: item4NoteRef,
      item9aDividendsFromAffiliates: this.extractICSubItem(
        PLPatterns.ITEM_9_DIVIDENDS_TOTAL,
        PLPatterns.ITEM_9A_DIVIDENDS_FROM_AFFILIATES,
        'profit_loss_financial'
      ),
      item10TotalInterest: this.extractExactPattern(
        PLPatterns.ITEM_10_INTEREST_TOTAL,
        'profit_loss_financial'
      ),
      item10aInterestFromAffiliates: this.extractICSubItem(
        PLPatterns.ITEM_10_INTEREST_TOTAL,
        PLPatterns.ITEM_10A_INTEREST_FROM_AFFILIATES,
        'profit_loss_financial'
      ),
      item11TotalInterest: this.extractExactPattern(
        PLPatterns.ITEM_11_OTHER_INTEREST_TOTAL,
        'profit_loss_financial'
      ),
      item11aInterestFromAffiliates: this.extractICSubItem(
        PLPatterns.ITEM_11_OTHER_INTEREST_TOTAL,
        PLPatterns.ITEM_11A_INTEREST_FROM_AFFILIATES,
        'profit_loss_financial'
      ),
      item14TotalInterest: this.extractExactPattern(
        PLPatterns.ITEM_14_INTEREST_EXPENSE_TOTAL,
        'profit_loss_financial'
      ),
      item14aInterestToAffiliates: this.extractICSubItem(
        PLPatterns.ITEM_14_INTEREST_EXPENSE_TOTAL,
        PLPatterns.ITEM_14A_INTEREST_TO_AFFILIATES,
        'profit_loss_financial'
      ),
      netTurnover: this.extractExactPattern(
        PLPatterns.NET_TURNOVER,
        'profit_loss'
      ),
      netProfitLoss: this.extractExactPattern(
        PLPatterns.NET_PROFIT_LOSS,
        'profit_loss'
      ),
    };
  }

  /**
   * Extract company info from document
   */
  async extractCompanyInfo(): Promise<CompanyInfoExtraction> {
    return {
      name: this.extractCompanyName(),
      rcsNumber: this.extractRcsNumber(),
      totalAssets: null, // Will be filled from balance sheet
      fiscalYearEnd: this.extractFiscalYearEnd(),
      currency: 'EUR',
    };
  }

  /**
   * CRITICAL: Only returns a value if EXACT pattern match found
   * Returns null if pattern not found (NO GUESSING)
   */
  private extractExactPattern(
    pattern: ExtractionPattern,
    sectionHint: string
  ): ExtractedValue {
    const result: ExtractedValue = {
      amount: null,
      source: null,
      pageNumber: null,
      lineReference: null,
      noteReference: null,
      confidence: 'low',
      matchedPattern: null,
      warning: null,
    };

    // Try each English pattern
    for (const englishPattern of pattern.english) {
      const match = this.findPatternWithAmount(englishPattern, pattern.mustIncludePhrase);
      if (match) {
        result.amount = match.amount * this.scale;
        result.source = match.source;
        result.lineReference = match.lineContext;
        result.matchedPattern = englishPattern;
        result.confidence = match.confidence;
        result.noteReference = this.extractNoteReferenceFromText(match.lineContext);
        result.pageNumber = this.estimatePageNumber(match.lineIndex);
        return result;
      }
    }

    // Try each French pattern
    for (const frenchPattern of pattern.french) {
      const match = this.findPatternWithAmount(frenchPattern, pattern.mustIncludePhrase);
      if (match) {
        result.amount = match.amount * this.scale;
        result.source = match.source;
        result.lineReference = match.lineContext;
        result.matchedPattern = frenchPattern;
        result.confidence = match.confidence;
        result.noteReference = this.extractNoteReferenceFromText(match.lineContext);
        result.pageNumber = this.estimatePageNumber(match.lineIndex);
        return result;
      }
    }

    // Pattern not found - return null (NEVER guess)
    result.warning = `Pattern not found: ${pattern.description}`;
    return result;
  }

  /**
   * Extract IC sub-item (e.g., 10a from 10)
   * Looks for the parent item first, then the IC-specific sub-item
   */
  private extractICSubItem(
    parentPattern: ExtractionPattern,
    icPattern: ExtractionPattern,
    sectionHint: string
  ): ExtractedValue {
    const result: ExtractedValue = {
      amount: null,
      source: null,
      pageNumber: null,
      lineReference: null,
      noteReference: null,
      confidence: 'low',
      matchedPattern: null,
      warning: null,
    };

    // First, find the parent item's location
    const parentMatch = this.findFirstPatternMatch(parentPattern);
    if (!parentMatch) {
      result.warning = `Parent pattern not found: ${parentPattern.description}`;
      return result;
    }

    // Look for IC sub-item AFTER the parent (not before!)
    // This prevents picking up IC lines from previous items
    // PDF parsing can split items across many lines, so search up to 15 lines
    const searchStart = parentMatch.lineIndex;
    const searchEnd = Math.min(this.lines.length, parentMatch.lineIndex + 15);

    for (let i = searchStart; i < searchEnd; i++) {
      const line = this.lines[i];

      // Check if this line has IC indicator
      for (const icKeyword of [...icPattern.english, ...icPattern.french]) {
        if (line.toLowerCase().includes(icKeyword.toLowerCase())) {
          // Found IC line - extract amount from this line or subsequent lines
          // PDF parsing often separates labels from amounts across multiple lines
          let amount: number | null = null;
          let amountLine = line;

          for (let j = i; j < Math.min(i + 4, this.lines.length); j++) {
            const checkLine = this.lines[j];
            const candidateAmount = this.extractAmountFromLine(checkLine);

            if (candidateAmount !== null) {
              // Skip if this looks like a reference number (typically 3-4 digits like "1139")
              // Combined refs can be 6-10 digits like "1141141142" or "1169169170"
              const lineOnly = checkLine.trim();
              const isLikelyReferenceNumber = /^\d{3,4}$/.test(lineOnly) ||    // Single ref: 1139
                                              /^\d{6,10}$/.test(lineOnly);      // Combined refs: 1141141142

              if (!isLikelyReferenceNumber && candidateAmount >= 1) {
                amount = candidateAmount;
                amountLine = checkLine;
                break;
              }
            }
          }

          if (amount !== null) {
            result.amount = amount * this.scale;
            result.source = `${parentPattern.section} - ${icKeyword}`;
            result.lineReference = `${line.trim()} ... ${amountLine.trim()}`.substring(0, 200);
            result.matchedPattern = icKeyword;
            result.confidence = 'high';
            result.noteReference = this.extractNoteReferenceFromText(line);
            result.pageNumber = this.estimatePageNumber(i);
            return result;
          }
        }
      }
    }

    // IC sub-item not found
    result.warning = `IC sub-item not found under ${parentPattern.description}`;
    return result;
  }

  /**
   * Find pattern match with amount extraction
   */
  private findPatternWithAmount(
    searchPattern: string,
    mustIncludePhrase: string | null
  ): {
    amount: number;
    source: string;
    lineContext: string;
    lineIndex: number;
    confidence: 'high' | 'medium' | 'low';
  } | null {
    const lowerPattern = searchPattern.toLowerCase();

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes(lowerPattern)) {
        // Check mustIncludePhrase if specified
        if (mustIncludePhrase) {
          // Look at current line and next few lines for the phrase
          const contextLines = this.lines.slice(i, Math.min(i + 3, this.lines.length)).join(' ');
          if (!contextLines.toLowerCase().includes(mustIncludePhrase.toLowerCase())) {
            continue; // Skip this match
          }
        }

        // Try to extract amount from this line or subsequent lines
        // PDF parsing often separates labels from amounts across multiple lines
        let amount: number | null = null;
        let sourceLine = line;

        // Look at current line and next few lines for a valid amount
        // Skip lines that only contain reference numbers (4 digits or less)
        for (let j = i; j < Math.min(i + 4, this.lines.length); j++) {
          const checkLine = this.lines[j];
          const candidateAmount = this.extractAmountFromLine(checkLine);

          if (candidateAmount !== null) {
            // Skip if this looks like a reference number (typically 3-4 digits like "1139")
            // Combined refs can be 6-10 digits like "1141141142" or "1169169170"
            // Real amounts typically have decimal separators or are very large with formatting
            const lineOnly = checkLine.trim();
            const isLikelyReferenceNumber = /^\d{3,4}$/.test(lineOnly) ||    // Single ref: 1139
                                            /^\d{6,10}$/.test(lineOnly);      // Combined refs: 1141141142

            if (!isLikelyReferenceNumber && candidateAmount >= 1) {
              amount = candidateAmount;
              sourceLine = j === i ? line : `${line} ... ${checkLine}`;
              break;
            }
          }
        }

        if (amount !== null) {
          return {
            amount,
            source: `Line containing "${searchPattern}"`,
            lineContext: sourceLine.trim().substring(0, 200),
            lineIndex: i,
            confidence: mustIncludePhrase ? 'high' : 'medium',
          };
        }
      }
    }

    return null;
  }

  /**
   * Find first match for a pattern (without amount)
   */
  private findFirstPatternMatch(pattern: ExtractionPattern): {
    lineIndex: number;
    line: string;
  } | null {
    const allPatterns = [...pattern.english, ...pattern.french];

    for (const searchPattern of allPatterns) {
      const lowerPattern = searchPattern.toLowerCase();

      for (let i = 0; i < this.lines.length; i++) {
        if (this.lines[i].toLowerCase().includes(lowerPattern)) {
          return { lineIndex: i, line: this.lines[i] };
        }
      }
    }

    return null;
  }

  /**
   * Extract a numeric amount from a line of text
   */
  private extractAmountFromLine(line: string): number | null {
    // Remove common noise
    const cleanLine = line
      .replace(/[()]/g, ' ')
      .replace(/EUR|€|\$/g, '')
      .trim();

    // Match European format with decimals: 1.234.567,89 or 1 234 567,89
    const euroMatch = cleanLine.match(/(\d{1,3}(?:[\s.]?\d{3})*)[,](\d{2})(?!\d)/);
    if (euroMatch) {
      const intPart = euroMatch[1].replace(/[\s.]/g, '');
      const decPart = euroMatch[2];
      return parseFloat(`${intPart}.${decPart}`);
    }

    // Match US format with decimals: 1,234,567.89
    const usMatchWithDecimals = cleanLine.match(/(\d{1,3}(?:,\d{3})+)[.](\d{2})(?!\d)/);
    if (usMatchWithDecimals) {
      const intPart = usMatchWithDecimals[1].replace(/,/g, '');
      const decPart = usMatchWithDecimals[2];
      return parseFloat(`${intPart}.${decPart}`);
    }

    // Match US format without decimals: 1,234,567 or 517,445,444
    const usMatchNoDecimals = cleanLine.match(/(\d{1,3}(?:,\d{3})+)(?![.,\d])/);
    if (usMatchNoDecimals) {
      return parseInt(usMatchNoDecimals[1].replace(/,/g, ''), 10);
    }

    // Match European format without decimals: 1.234.567
    const euroMatchNoDecimals = cleanLine.match(/(\d{1,3}(?:\.\d{3})+)(?![.,\d])/);
    if (euroMatchNoDecimals) {
      return parseInt(euroMatchNoDecimals[1].replace(/\./g, ''), 10);
    }

    // Match simple integer: 1234567
    const simpleMatch = cleanLine.match(/(\d{4,})/);
    if (simpleMatch) {
      return parseInt(simpleMatch[1], 10);
    }

    // Match number with decimal: 1234567.89 or 1234567,89
    const decimalMatch = cleanLine.match(/(\d+)[.,](\d{1,2})(?!\d)/);
    if (decimalMatch) {
      return parseFloat(`${decimalMatch[1]}.${decimalMatch[2]}`);
    }

    return null;
  }

  /**
   * Extract note reference from text
   */
  private extractNoteReferenceFromText(text: string): string | null {
    for (const pattern of NoteReferencePatterns.patterns) {
      const match = text.match(pattern);
      if (match) {
        return `Note ${match[1]}`;
      }
    }
    return null;
  }

  /**
   * Extract note reference near a pattern
   */
  private extractNoteReferenceNearPattern(pattern: ExtractionPattern): string | null {
    const match = this.findFirstPatternMatch(pattern);
    if (!match) return null;

    // Search current line and nearby lines for note reference
    const searchStart = Math.max(0, match.lineIndex - 1);
    const searchEnd = Math.min(this.lines.length, match.lineIndex + 2);

    for (let i = searchStart; i < searchEnd; i++) {
      const noteRef = this.extractNoteReferenceFromText(this.lines[i]);
      if (noteRef) return noteRef;
    }

    return null;
  }

  /**
   * Estimate page number based on line position
   */
  private estimatePageNumber(lineIndex: number): number | null {
    // Rough estimate: ~50 lines per page
    // Look for page markers in text
    let pageNum = 1;
    for (let i = 0; i < lineIndex; i++) {
      const line = this.lines[i].toLowerCase();
      if (line.includes('page ') || line.match(/^[\s]*\d+[\s]*$/)) {
        const pageMatch = line.match(/page\s*(\d+)/i) || line.match(/^[\s]*(\d+)[\s]*$/);
        if (pageMatch) {
          const num = parseInt(pageMatch[1], 10);
          if (num > 0 && num < 100) { // Sanity check
            pageNum = num;
          }
        }
      }
    }
    return pageNum;
  }

  /**
   * Extract company name from document
   */
  private extractCompanyName(): string | null {
    // Common patterns for company names in Luxembourg filings
    const patterns = [
      /(?:société|company|sa|s\.a\.|sarl|s\.à\.r\.l\.)[\s:]+([A-Za-zÀ-ÿ\s\-\.]+?)(?:\s*(?:S\.A\.|S\.à\.r\.l\.|SA|SARL))/i,
      /^([A-Z][A-Za-zÀ-ÿ\s\-\.]+?)\s*(?:S\.A\.|S\.à\.r\.l\.|SA|SARL)/m,
      /Dénomination[\s:]+([A-Za-zÀ-ÿ\s\-\.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = this.pdfText.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract RCS number
   */
  private extractRcsNumber(): string | null {
    // RCS number format: B followed by digits
    const patterns = [
      /R\.?C\.?S\.?\s*(?:Luxembourg\s*)?[:\s]*([Bb]\s*\d+)/i,
      /(?:immatriculée|registered)\s*(?:au\s*)?(?:R\.?C\.?S\.?\s*)?(?:Luxembourg\s*)?(?:sous\s*le\s*)?(?:numéro\s*)?([Bb]\s*\d+)/i,
      /([Bb]\s*\d{5,6})/,
    ];

    for (const pattern of patterns) {
      const match = this.pdfText.match(pattern);
      if (match) {
        return match[1].replace(/\s/g, '').toUpperCase();
      }
    }

    return null;
  }

  /**
   * Extract fiscal year end date
   */
  private extractFiscalYearEnd(): string | null {
    const patterns = [
      /(?:exercice|year|période).*?(?:clos|ended|closing|au).*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}).*?(?:exercice|year)/i,
      /(?:31|30)\s*(?:décembre|december|juin|june)\s*(\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = this.pdfText.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  /**
   * Get all note references found in the document
   */
  getAllNoteReferences(): string[] {
    const notes = new Set<string>();

    for (const line of this.lines) {
      for (const pattern of NoteReferencePatterns.patterns) {
        const matches = Array.from(line.matchAll(pattern));
        for (const match of matches) {
          notes.add(`Note ${match[1]}`);
        }
      }
    }

    return Array.from(notes).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });
  }
}

export default StructuredExtractor;
