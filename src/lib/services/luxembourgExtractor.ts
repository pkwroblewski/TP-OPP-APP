/**
 * Luxembourg Financial Extractor - 3-Layer Anti-Hallucination Architecture
 *
 * This module provides hallucination-proof extraction of IC transactions
 * from Luxembourg annual accounts using a 3-layer approach:
 *
 * LAYER 1: Structured Extraction (structuredExtractor.ts)
 * - Fixed patterns only, no AI freedom
 * - Every value requires explicit source
 *
 * LAYER 2: Note Parsing (noteParser.ts)
 * - Controlled parsing of referenced notes
 * - Only extracts IC items with explicit IC keywords
 *
 * LAYER 3: Validation (extractionValidator.ts)
 * - Cross-validation between balance sheet and P&L
 * - Flags TP opportunities and hallucination risks
 */

import { logger } from '@/lib/logger';
import { StructuredExtractor, BalanceSheetExtraction, PLExtraction, CompanyInfoExtraction } from './structuredExtractor';
import { NoteParser, NoteParsingResult } from './noteParser';
import { ExtractionValidator, ValidationResult, ExtractionValidationError, TPOpportunityFlag } from './extractionValidator';

/**
 * Result from the 3-layer extraction process
 */
export interface LuxembourgExtractionResult {
  success: boolean;
  /** Company information */
  companyInfo: CompanyInfoExtraction;
  /** Layer 1: Balance sheet extraction with sources */
  balanceSheet: BalanceSheetExtraction;
  /** Layer 1: P&L extraction with sources */
  profitAndLoss: PLExtraction;
  /** Layer 2: Parsed notes */
  notes: NoteParsingResult[];
  /** Layer 3: Validation results */
  validation: ValidationResult;
  /** Quality metrics */
  extractionQuality: ExtractionQuality;
  /** TP opportunities identified */
  tpOpportunities: TPOpportunityFlag[];
  /** Any extraction errors */
  error?: string;
  /** Raw text for debugging */
  rawText: string;
}

/**
 * Extraction quality metrics
 */
export interface ExtractionQuality {
  /** All IC values have source references */
  allSourced: boolean;
  /** Percentage of referenced notes that were accessible */
  noteCoveragePercent: number;
  /** Cross-validation passed */
  crossValidated: boolean;
  /** Overall confidence */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** List of warnings */
  warnings: string[];
  /** List of items that may be hallucinated */
  hallucinationRisks: string[];
}

/**
 * Summary of IC positions for quick display
 */
export interface ICPositionSummary {
  /** Total IC loans provided (assets) */
  totalICLoansProvided: number;
  /** Total IC loans received (liabilities) */
  totalICLoansReceived: number;
  /** Total IC interest income */
  totalICInterestIncome: number;
  /** Total IC interest expense */
  totalICInterestExpense: number;
  /** Implied lending rate (%) */
  impliedLendingRate: number | null;
  /** Implied borrowing rate (%) */
  impliedBorrowingRate: number | null;
  /** Spread in basis points */
  spreadBps: number | null;
  /** Net IC position */
  netICPosition: number;
}

/**
 * Main extraction function using 3-layer architecture
 * This is the primary entry point for Luxembourg financial extraction
 */
export async function extractLuxembourgFinancials(
  pdfText: string
): Promise<LuxembourgExtractionResult> {
  const startTime = Date.now();

  try {
    logger.debug('Starting 3-layer Luxembourg extraction', {
      textLength: pdfText.length,
    });

    // =========================================================
    // LAYER 1: Structured Pattern-Based Extraction
    // =========================================================
    logger.debug('Layer 1: Starting structured extraction');

    const structuredExtractor = new StructuredExtractor(pdfText);

    // Extract company info
    const companyInfo = await structuredExtractor.extractCompanyInfo();

    // Extract balance sheet items
    const balanceSheet = await structuredExtractor.extractBalanceSheet();

    // Extract P&L items
    const profitAndLoss = await structuredExtractor.extractPL();

    // Get all note references found in the document
    const allNoteRefs = structuredExtractor.getAllNoteReferences();

    logger.debug('Layer 1 complete', {
      companyName: companyInfo.name,
      rcsNumber: companyInfo.rcsNumber,
      notesFound: allNoteRefs.length,
    });

    // =========================================================
    // LAYER 2: Controlled Note Parsing
    // =========================================================
    logger.debug('Layer 2: Starting note parsing');

    const noteParser = new NoteParser(pdfText);
    const notes = new Map<string, NoteParsingResult>();

    // Parse Item 4 note if referenced
    if (profitAndLoss.item4NoteReference) {
      const item4Note = await noteParser.parseNote(profitAndLoss.item4NoteReference);
      notes.set(profitAndLoss.item4NoteReference, item4Note);
    }

    // Parse notes referenced in balance sheet items
    const balanceSheetNoteRefs = [
      balanceSheet.icLoansProvidedLongTerm.noteReference,
      balanceSheet.icLoansProvidedShortTerm.noteReference,
      balanceSheet.icLoansReceivedLongTerm.noteReference,
      balanceSheet.icLoansReceivedShortTerm.noteReference,
      balanceSheet.sharesInAffiliatedUndertakings.noteReference,
    ].filter((ref): ref is string => ref !== null);

    // Parse notes referenced in P&L items
    const plNoteRefs = [
      profitAndLoss.item10aInterestFromAffiliates.noteReference,
      profitAndLoss.item11aInterestFromAffiliates.noteReference,
      profitAndLoss.item14aInterestToAffiliates.noteReference,
      profitAndLoss.item9aDividendsFromAffiliates.noteReference,
    ].filter((ref): ref is string => ref !== null);

    // Parse all unique note references
    const allRefs = Array.from(new Set([...balanceSheetNoteRefs, ...plNoteRefs]));
    for (const noteRef of allRefs) {
      if (!notes.has(noteRef)) {
        const note = await noteParser.parseNote(noteRef);
        notes.set(noteRef, note);
      }
    }

    // Try to find related party note
    const relatedPartyNote = await noteParser.findRelatedPartyNote();
    if (relatedPartyNote && !notes.has(relatedPartyNote.noteNumber)) {
      notes.set(relatedPartyNote.noteNumber, relatedPartyNote);
    }

    logger.debug('Layer 2 complete', {
      notesParsed: notes.size,
      accessibleNotes: Array.from(notes.values()).filter(n => n.noteAccessible).length,
      notesWithICBreakdown: Array.from(notes.values()).filter(n => n.icBreakdown !== null).length,
    });

    // =========================================================
    // LAYER 3: Validation & Cross-Checks
    // =========================================================
    logger.debug('Layer 3: Starting validation');

    // Build company context for validation
    const companyContext = {
      name: companyInfo.name || 'Unknown',
      rcsNumber: companyInfo.rcsNumber || 'Unknown',
      totalAssets: balanceSheet.totalAssets.amount || 0,
      totalEquity: balanceSheet.totalEquity.amount || 0,
      currency: companyInfo.currency || 'EUR',
    };

    const validator = new ExtractionValidator(
      balanceSheet,
      profitAndLoss,
      notes,
      companyContext
    );

    const validation = validator.validate();

    logger.debug('Layer 3 complete', {
      isValid: validation.isValid,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      flags: validation.flags.length,
    });

    // =========================================================
    // Build Final Result
    // =========================================================
    const extractionQuality = buildQualityMetrics(validation, notes);
    const tpOpportunities = validation.flags;

    const result: LuxembourgExtractionResult = {
      success: true,
      companyInfo,
      balanceSheet,
      profitAndLoss,
      notes: Array.from(notes.values()),
      validation,
      extractionQuality,
      tpOpportunities,
      rawText: pdfText,
    };

    const duration = Date.now() - startTime;
    logger.info('Luxembourg extraction complete', {
      duration: `${duration}ms`,
      success: true,
      companyName: companyInfo.name,
      rcsNumber: companyInfo.rcsNumber,
      confidence: extractionQuality.confidence,
      tpOpportunities: tpOpportunities.length,
    });

    // If validation has CRITICAL errors, log warning
    if (validation.errors.some(e => e.severity === 'CRITICAL')) {
      logger.warn('Extraction completed with critical errors', {
        criticalErrors: validation.errors.filter(e => e.severity === 'CRITICAL'),
      });
    }

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Luxembourg extraction failed', { error, duration: `${duration}ms` });

    return {
      success: false,
      companyInfo: {
        name: null,
        rcsNumber: null,
        totalAssets: null,
        fiscalYearEnd: null,
        currency: 'EUR',
      },
      balanceSheet: createEmptyBalanceSheet(),
      profitAndLoss: createEmptyPL(),
      notes: [],
      validation: createEmptyValidation(),
      extractionQuality: {
        allSourced: false,
        noteCoveragePercent: 0,
        crossValidated: false,
        confidence: 'LOW',
        warnings: [],
        hallucinationRisks: ['Extraction failed - all values uncertain'],
      },
      tpOpportunities: [],
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      rawText: pdfText,
    };
  }
}

/**
 * Get IC position summary from extraction result
 */
export function getICPositionSummary(result: LuxembourgExtractionResult): ICPositionSummary {
  const bs = result.balanceSheet;
  const pl = result.profitAndLoss;

  const totalICLoansProvided =
    (bs.icLoansProvidedLongTerm.amount || 0) +
    (bs.icLoansProvidedShortTerm.amount || 0);

  const totalICLoansReceived =
    (bs.icLoansReceivedLongTerm.amount || 0) +
    (bs.icLoansReceivedShortTerm.amount || 0);

  const totalICInterestIncome =
    (pl.item10aInterestFromAffiliates.amount || 0) +
    (pl.item11aInterestFromAffiliates.amount || 0);

  const totalICInterestExpense = pl.item14aInterestToAffiliates.amount || 0;

  let impliedLendingRate: number | null = null;
  if (totalICLoansProvided > 0) {
    impliedLendingRate = (totalICInterestIncome / totalICLoansProvided) * 100;
  }

  let impliedBorrowingRate: number | null = null;
  if (totalICLoansReceived > 0) {
    impliedBorrowingRate = (totalICInterestExpense / totalICLoansReceived) * 100;
  }

  let spreadBps: number | null = null;
  if (impliedLendingRate !== null && impliedBorrowingRate !== null) {
    spreadBps = (impliedLendingRate - impliedBorrowingRate) * 100;
  }

  return {
    totalICLoansProvided,
    totalICLoansReceived,
    totalICInterestIncome,
    totalICInterestExpense,
    impliedLendingRate,
    impliedBorrowingRate,
    spreadBps,
    netICPosition: totalICLoansProvided - totalICLoansReceived,
  };
}

/**
 * Build quality metrics from validation result
 */
function buildQualityMetrics(
  validation: ValidationResult,
  notes: Map<string, NoteParsingResult>
): ExtractionQuality {
  const warnings: string[] = validation.warnings.map(w => w.details);
  const hallucinationRisks: string[] = validation.errors
    .filter(e => e.possibleHallucination)
    .map(e => e.details);

  // Calculate note coverage
  const totalNotes = notes.size;
  const accessibleNotes = Array.from(notes.values()).filter(n => n.noteAccessible).length;
  const noteCoveragePercent = totalNotes > 0 ? (accessibleNotes / totalNotes) * 100 : 100;

  return {
    allSourced: validation.qualityMetrics.allSourced,
    noteCoveragePercent,
    crossValidated: validation.qualityMetrics.crossValidated,
    confidence: validation.qualityMetrics.confidence,
    warnings,
    hallucinationRisks,
  };
}

/**
 * Create empty balance sheet structure for error cases
 */
function createEmptyBalanceSheet(): BalanceSheetExtraction {
  const emptyValue = {
    amount: null,
    source: null,
    pageNumber: null,
    lineReference: null,
    noteReference: null,
    confidence: 'low' as const,
    matchedPattern: null,
    warning: null,
  };

  return {
    sharesInAffiliatedUndertakings: { ...emptyValue },
    icLoansProvidedLongTerm: { ...emptyValue },
    icLoansProvidedShortTerm: { ...emptyValue },
    icLoansReceivedLongTerm: { ...emptyValue },
    icLoansReceivedShortTerm: { ...emptyValue },
    totalAssets: { ...emptyValue },
    totalEquity: { ...emptyValue },
  };
}

/**
 * Create empty P&L structure for error cases
 */
function createEmptyPL(): PLExtraction {
  const emptyValue = {
    amount: null,
    source: null,
    pageNumber: null,
    lineReference: null,
    noteReference: null,
    confidence: 'low' as const,
    matchedPattern: null,
    warning: null,
  };

  return {
    item4TotalAmount: { ...emptyValue },
    item4NoteReference: null,
    item9aDividendsFromAffiliates: { ...emptyValue },
    item10TotalInterest: { ...emptyValue },
    item10aInterestFromAffiliates: { ...emptyValue },
    item11TotalInterest: { ...emptyValue },
    item11aInterestFromAffiliates: { ...emptyValue },
    item14TotalInterest: { ...emptyValue },
    item14aInterestToAffiliates: { ...emptyValue },
    netTurnover: { ...emptyValue },
    netProfitLoss: { ...emptyValue },
  };
}

/**
 * Create empty validation structure for error cases
 */
function createEmptyValidation(): ValidationResult {
  return {
    isValid: false,
    errors: [],
    warnings: [],
    flags: [],
    crossValidation: {
      loansVsInterest: {
        loansProvidedTotal: 0,
        interestIncomeTotal: 0,
        impliedLendingRate: null,
        loansReceivedTotal: 0,
        interestExpenseTotal: 0,
        impliedBorrowingRate: null,
        spreadBps: null,
        issues: ['Extraction failed'],
      },
      reasonablenessChecks: {
        icLoansVsTotalAssets: null,
        interestVsTurnover: null,
        debtToEquityRatio: null,
        issues: ['Extraction failed'],
      },
    },
    qualityMetrics: {
      allSourced: false,
      sourcedPercentage: 0,
      valuesExtracted: 0,
      valuesWithSources: 0,
      notesCoverage: {
        referenced: 0,
        accessible: 0,
        withICBreakdown: 0,
      },
      crossValidated: false,
      confidence: 'LOW',
    },
  };
}

/**
 * Convert Luxembourg extraction result to legacy format
 * for backwards compatibility with existing UI components
 */
export function convertToLegacyFormat(result: LuxembourgExtractionResult): {
  icLoansReceivable: number | null;
  icLoansPayable: number | null;
  interestIncomeIc: number | null;
  interestExpenseIc: number | null;
  spreadBps: number | null;
  netIcPosition: number | null;
} {
  const summary = getICPositionSummary(result);

  return {
    icLoansReceivable: summary.totalICLoansProvided || null,
    icLoansPayable: summary.totalICLoansReceived || null,
    interestIncomeIc: summary.totalICInterestIncome || null,
    interestExpenseIc: summary.totalICInterestExpense || null,
    spreadBps: summary.spreadBps,
    netIcPosition: summary.netICPosition || null,
  };
}

export default extractLuxembourgFinancials;
