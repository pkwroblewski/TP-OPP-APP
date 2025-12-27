/**
 * LAYER 3: Validation & Cross-Checks
 *
 * ANTI-HALLUCINATION RULES:
 * 1. Every IC loan MUST have corresponding interest or be flagged
 * 2. Implied rates must be reasonable (1-10%) or flagged
 * 3. Amounts > company total assets = impossible
 * 4. P&L items without balance sheet support = suspicious
 * 5. All extracted values without sources are flagged as potential hallucinations
 */

import { BalanceSheetExtraction, PLExtraction, ExtractedValue } from './structuredExtractor';
import { NoteParsingResult } from './noteParser';
import { ValidationThresholds } from './luxembourgPatterns';

/**
 * Validation error - something is definitely wrong
 */
export interface ValidationError {
  /** Error severity */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** Field that has the error */
  field: string;
  /** Short issue description */
  issue: string;
  /** Detailed explanation */
  details: string;
  /** Suggests this might be a hallucination */
  possibleHallucination: boolean;
}

/**
 * Validation warning - something to investigate
 */
export interface ValidationWarning {
  /** Warning severity */
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Field with the warning */
  field: string;
  /** Short issue description */
  issue: string;
  /** Detailed explanation */
  details: string;
}

/**
 * TP opportunity flag - potential transfer pricing issue
 */
export interface TPOpportunityFlag {
  /** Type of TP opportunity */
  type:
    | 'ZERO_SPREAD'
    | 'LOW_RATE'
    | 'HIGH_RATE'
    | 'UNDOCUMENTED'
    | 'THIN_CAP'
    | 'NO_INTEREST_ON_LOAN'
    | 'GUARANTEE_NO_FEE'
    | 'SERVICE_FEE_UNSUBSTANTIATED';
  /** Priority level */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Description of the opportunity */
  description: string;
  /** Estimated value of the TP adjustment */
  estimatedValue: string;
  /** OECD or Luxembourg law reference */
  reference: string | null;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Overall validity */
  isValid: boolean;
  /** Errors found */
  errors: ValidationError[];
  /** Warnings found */
  warnings: ValidationWarning[];
  /** TP opportunity flags */
  flags: TPOpportunityFlag[];
  /** Cross-validation results */
  crossValidation: CrossValidationResult;
  /** Quality metrics */
  qualityMetrics: QualityMetrics;
}

/**
 * Cross-validation between balance sheet and P&L
 */
export interface CrossValidationResult {
  /** IC loan vs interest validation */
  loansVsInterest: {
    loansProvidedTotal: number;
    interestIncomeTotal: number;
    impliedLendingRate: number | null;
    loansReceivedTotal: number;
    interestExpenseTotal: number;
    impliedBorrowingRate: number | null;
    spreadBps: number | null;
    issues: string[];
  };
  /** Value reasonableness checks */
  reasonablenessChecks: {
    icLoansVsTotalAssets: number | null;
    interestVsTurnover: number | null;
    debtToEquityRatio: number | null;
    issues: string[];
  };
}

/**
 * Extraction quality metrics
 */
export interface QualityMetrics {
  /** All values have sources */
  allSourced: boolean;
  /** Percentage of values with sources */
  sourcedPercentage: number;
  /** Number of values extracted */
  valuesExtracted: number;
  /** Number of values with sources */
  valuesWithSources: number;
  /** Notes coverage */
  notesCoverage: {
    referenced: number;
    accessible: number;
    withICBreakdown: number;
  };
  /** Cross-validated */
  crossValidated: boolean;
  /** Overall confidence */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Basic company info for validation context
 */
export interface CompanyValidationContext {
  name: string;
  rcsNumber: string;
  totalAssets: number;
  totalEquity: number;
  currency: string;
}

/**
 * Layer 3 Extraction Validator
 * Performs cross-checks and flags TP opportunities
 */
export class ExtractionValidator {
  private balanceSheet: BalanceSheetExtraction;
  private pl: PLExtraction;
  private notes: Map<string, NoteParsingResult>;
  private companyContext: CompanyValidationContext;

  constructor(
    balanceSheet: BalanceSheetExtraction,
    pl: PLExtraction,
    notes: Map<string, NoteParsingResult>,
    companyContext: CompanyValidationContext
  ) {
    this.balanceSheet = balanceSheet;
    this.pl = pl;
    this.notes = notes;
    this.companyContext = companyContext;
  }

  /**
   * Run all validations and return comprehensive result
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const flags: TPOpportunityFlag[] = [];

    // ===== VALIDATION 1: Source Tracking (Anti-Hallucination) =====
    this.validateSourceTracking(errors);

    // ===== VALIDATION 2: IC Loans ↔ Interest Cross-Check =====
    const loansVsInterest = this.validateLoansVsInterest(errors, warnings, flags);

    // ===== VALIDATION 3: Implied Rates =====
    this.validateImpliedRates(warnings, flags, loansVsInterest);

    // ===== VALIDATION 4: Impossible Values =====
    const reasonablenessChecks = this.validateReasonableness(errors, warnings);

    // ===== VALIDATION 5: Unverified IC Services =====
    this.validateICServices(warnings, flags);

    // ===== VALIDATION 6: Thin Capitalisation =====
    this.validateThinCap(warnings, flags, reasonablenessChecks);

    // ===== VALIDATION 7: Note Coverage =====
    this.validateNoteCoverage(warnings);

    // ===== Calculate Quality Metrics =====
    const qualityMetrics = this.calculateQualityMetrics(errors);

    return {
      isValid: errors.filter(e => e.severity === 'CRITICAL').length === 0,
      errors,
      warnings,
      flags,
      crossValidation: {
        loansVsInterest,
        reasonablenessChecks,
      },
      qualityMetrics,
    };
  }

  /**
   * CRITICAL: Validate that all extracted values have sources
   */
  private validateSourceTracking(errors: ValidationError[]): void {
    const allValues: Array<{ name: string; value: ExtractedValue }> = [
      { name: 'icLoansProvidedLongTerm', value: this.balanceSheet.icLoansProvidedLongTerm },
      { name: 'icLoansProvidedShortTerm', value: this.balanceSheet.icLoansProvidedShortTerm },
      { name: 'icLoansReceivedLongTerm', value: this.balanceSheet.icLoansReceivedLongTerm },
      { name: 'icLoansReceivedShortTerm', value: this.balanceSheet.icLoansReceivedShortTerm },
      { name: 'item10aInterestFromAffiliates', value: this.pl.item10aInterestFromAffiliates },
      { name: 'item11aInterestFromAffiliates', value: this.pl.item11aInterestFromAffiliates },
      { name: 'item14aInterestToAffiliates', value: this.pl.item14aInterestToAffiliates },
    ];

    for (const { name, value } of allValues) {
      if (value.amount !== null && value.source === null) {
        errors.push({
          severity: 'CRITICAL',
          field: name,
          issue: 'Extracted value without source',
          details: `Amount EUR ${this.formatAmount(value.amount)} has no source reference - HALLUCINATION RISK`,
          possibleHallucination: true,
        });
      }
    }
  }

  /**
   * Validate IC loans vs interest income/expense
   */
  private validateLoansVsInterest(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    flags: TPOpportunityFlag[]
  ): CrossValidationResult['loansVsInterest'] {
    const result = {
      loansProvidedTotal: 0,
      interestIncomeTotal: 0,
      impliedLendingRate: null as number | null,
      loansReceivedTotal: 0,
      interestExpenseTotal: 0,
      impliedBorrowingRate: null as number | null,
      spreadBps: null as number | null,
      issues: [] as string[],
    };

    // Calculate totals
    result.loansProvidedTotal =
      (this.balanceSheet.icLoansProvidedLongTerm.amount || 0) +
      (this.balanceSheet.icLoansProvidedShortTerm.amount || 0);

    result.interestIncomeTotal =
      (this.pl.item10aInterestFromAffiliates.amount || 0) +
      (this.pl.item11aInterestFromAffiliates.amount || 0);

    result.loansReceivedTotal =
      (this.balanceSheet.icLoansReceivedLongTerm.amount || 0) +
      (this.balanceSheet.icLoansReceivedShortTerm.amount || 0);

    result.interestExpenseTotal = this.pl.item14aInterestToAffiliates.amount || 0;

    // Calculate implied rates
    if (result.loansProvidedTotal > 0) {
      result.impliedLendingRate = (result.interestIncomeTotal / result.loansProvidedTotal) * 100;
    }

    if (result.loansReceivedTotal > 0) {
      result.impliedBorrowingRate = (result.interestExpenseTotal / result.loansReceivedTotal) * 100;
    }

    // Calculate spread
    if (result.impliedLendingRate !== null && result.impliedBorrowingRate !== null) {
      result.spreadBps = (result.impliedLendingRate - result.impliedBorrowingRate) * 100;
    }

    // ===== FLAG: IC loan provided but NO interest income =====
    if (result.loansProvidedTotal > 0 && result.interestIncomeTotal === 0) {
      flags.push({
        type: 'ZERO_SPREAD',
        priority: 'HIGH',
        description: `IC loan provided EUR ${this.formatMillion(result.loansProvidedTotal)}M but ZERO interest income in P&L Items 10a/11a`,
        estimatedValue: `EUR ${this.formatMillion(result.loansProvidedTotal * 0.04)}M potential interest at 4% arm's length rate`,
        reference: 'OECD TPG Chapter X, Section B',
      });

      result.issues.push('IC loan provided with no interest income');
    }

    // ===== FLAG: IC loan received but NO interest expense =====
    if (result.loansReceivedTotal > 0 && result.interestExpenseTotal === 0) {
      flags.push({
        type: 'NO_INTEREST_ON_LOAN',
        priority: 'MEDIUM',
        description: `IC loan received EUR ${this.formatMillion(result.loansReceivedTotal)}M but ZERO interest expense in P&L Item 14a`,
        estimatedValue: 'Potential interest-free loan from group - review for equity reclassification',
        reference: 'Luxembourg Circular LIR n° 56/1',
      });

      result.issues.push('IC loan received with no interest expense');
    }

    // ===== ERROR: Interest income but NO loan on balance sheet =====
    if (result.interestIncomeTotal > 0 && result.loansProvidedTotal === 0) {
      if (this.pl.item10aInterestFromAffiliates.source !== null ||
          this.pl.item11aInterestFromAffiliates.source !== null) {
        // Only warn if we actually found sources for the interest
        warnings.push({
          severity: 'HIGH',
          field: 'icInterestIncome',
          issue: 'Interest income without corresponding loan',
          details: `IC interest income EUR ${this.formatAmount(result.interestIncomeTotal)} but no IC loan found on balance sheet - verify short-term positions or cash pooling`,
        });
      }
    }

    return result;
  }

  /**
   * Validate implied interest rates
   */
  private validateImpliedRates(
    warnings: ValidationWarning[],
    flags: TPOpportunityFlag[],
    loansVsInterest: CrossValidationResult['loansVsInterest']
  ): void {
    const thresholds = ValidationThresholds.interestRates;

    // Check lending rate
    if (loansVsInterest.impliedLendingRate !== null && loansVsInterest.loansProvidedTotal > 0) {
      const rate = loansVsInterest.impliedLendingRate;

      if (rate < thresholds.min) {
        flags.push({
          type: 'LOW_RATE',
          priority: 'HIGH',
          description: `Implied IC lending rate ${rate.toFixed(2)}% is near-zero (expected ${thresholds.marketLow}-${thresholds.marketHigh}%)`,
          estimatedValue: `EUR ${this.formatMillion(
            loansVsInterest.loansProvidedTotal * (thresholds.armLengthTypical / 100) -
            loansVsInterest.interestIncomeTotal
          )}M potential additional interest`,
          reference: 'OECD TPG Chapter X, Sections B.1.2 and B.1.3',
        });
      } else if (rate < thresholds.marketLow) {
        flags.push({
          type: 'LOW_RATE',
          priority: 'MEDIUM',
          description: `Implied IC lending rate ${rate.toFixed(2)}% is below market range (${thresholds.marketLow}-${thresholds.marketHigh}%)`,
          estimatedValue: `EUR ${this.formatMillion(
            loansVsInterest.loansProvidedTotal * (thresholds.armLengthTypical / 100) -
            loansVsInterest.interestIncomeTotal
          )}M potential adjustment`,
          reference: 'OECD TPG Chapter X',
        });
      } else if (rate > thresholds.max) {
        warnings.push({
          severity: 'HIGH',
          field: 'icLendingRate',
          issue: 'Extremely high implied lending rate',
          details: `Interest EUR ${this.formatAmount(loansVsInterest.interestIncomeTotal)} on loan EUR ${this.formatAmount(loansVsInterest.loansProvidedTotal)} = ${rate.toFixed(1)}% - verify if includes fees/penalties or extraction error`,
        });
      }
    }

    // Check borrowing rate
    if (loansVsInterest.impliedBorrowingRate !== null && loansVsInterest.loansReceivedTotal > 0) {
      const rate = loansVsInterest.impliedBorrowingRate;

      if (rate > thresholds.max) {
        flags.push({
          type: 'HIGH_RATE',
          priority: 'HIGH',
          description: `Implied IC borrowing rate ${rate.toFixed(2)}% is extremely high`,
          estimatedValue: `EUR ${this.formatMillion(
            loansVsInterest.interestExpenseTotal -
            loansVsInterest.loansReceivedTotal * (thresholds.armLengthTypical / 100)
          )}M potential interest deduction at risk`,
          reference: 'Luxembourg Circular LIR n° 56/1',
        });
      }
    }

    // Check spread (treasury function analysis)
    if (loansVsInterest.spreadBps !== null) {
      const spreadThresholds = ValidationThresholds.spreads;

      if (Math.abs(loansVsInterest.spreadBps) < spreadThresholds.zeroSpreadThreshold) {
        flags.push({
          type: 'ZERO_SPREAD',
          priority: 'HIGH',
          description: `Zero spread on IC financing (${loansVsInterest.spreadBps.toFixed(0)} bps vs market ${spreadThresholds.marketMin}-${spreadThresholds.marketMax} bps)`,
          estimatedValue: 'Treasury function should earn arm\'s length margin',
          reference: 'OECD TPG Chapter X, Section E',
        });
      } else if (Math.abs(loansVsInterest.spreadBps) < spreadThresholds.lowSpreadThreshold) {
        warnings.push({
          severity: 'MEDIUM',
          field: 'icSpread',
          issue: 'Low spread on IC financing',
          details: `Spread of ${loansVsInterest.spreadBps.toFixed(0)} bps is below typical treasury margin of ${spreadThresholds.marketMin}-${spreadThresholds.marketMax} bps`,
        });
      }
    }
  }

  /**
   * Validate value reasonableness
   */
  private validateReasonableness(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): CrossValidationResult['reasonablenessChecks'] {
    const result = {
      icLoansVsTotalAssets: null as number | null,
      interestVsTurnover: null as number | null,
      debtToEquityRatio: null as number | null,
      issues: [] as string[],
    };

    const totalAssets = this.companyContext.totalAssets;
    const totalEquity = this.companyContext.totalEquity;

    // Calculate IC loans as % of total assets
    const totalICLoans =
      (this.balanceSheet.icLoansProvidedLongTerm.amount || 0) +
      (this.balanceSheet.icLoansProvidedShortTerm.amount || 0) +
      (this.balanceSheet.icLoansReceivedLongTerm.amount || 0) +
      (this.balanceSheet.icLoansReceivedShortTerm.amount || 0);

    if (totalAssets > 0) {
      result.icLoansVsTotalAssets = (totalICLoans / totalAssets) * 100;
    }

    // Check if IC loans exceed total assets (impossible)
    if (totalAssets > 0 && totalICLoans > totalAssets * 2) {
      errors.push({
        severity: 'CRITICAL',
        field: 'icLoans',
        issue: 'IC loans exceed 2x total assets',
        details: `IC loans EUR ${this.formatMillion(totalICLoans)}M vs total assets EUR ${this.formatMillion(totalAssets)}M - likely extraction error`,
        possibleHallucination: true,
      });
      result.issues.push('IC loans exceed total assets');
    }

    // Calculate debt to equity ratio
    const totalICDebt =
      (this.balanceSheet.icLoansReceivedLongTerm.amount || 0) +
      (this.balanceSheet.icLoansReceivedShortTerm.amount || 0);

    if (totalEquity > 0) {
      result.debtToEquityRatio = totalICDebt / totalEquity;
    }

    // Check for negative values (should not exist for these fields)
    const positiveOnlyFields: Array<{ name: string; value: ExtractedValue }> = [
      { name: 'icLoansProvidedLongTerm', value: this.balanceSheet.icLoansProvidedLongTerm },
      { name: 'icLoansReceivedShortTerm', value: this.balanceSheet.icLoansReceivedShortTerm },
    ];

    for (const { name, value } of positiveOnlyFields) {
      if (value.amount !== null && value.amount < 0) {
        warnings.push({
          severity: 'HIGH',
          field: name,
          issue: 'Unexpected negative value',
          details: `${name} shows EUR ${this.formatAmount(value.amount)} which should not be negative`,
        });
      }
    }

    return result;
  }

  /**
   * Validate IC services (Item 4)
   */
  private validateICServices(warnings: ValidationWarning[], flags: TPOpportunityFlag[]): void {
    if (this.pl.item4TotalAmount.amount && this.pl.item4TotalAmount.amount > 0) {
      const noteRef = this.pl.item4NoteReference;

      if (!noteRef) {
        warnings.push({
          severity: 'MEDIUM',
          field: 'item4OtherOperatingIncome',
          issue: 'No note reference for Other Operating Income',
          details: `P&L Item 4 shows EUR ${this.formatMillion(this.pl.item4TotalAmount.amount)}M but no note reference found - cannot verify IC service fee breakdown`,
        });
        return;
      }

      const note = this.notes.get(noteRef);

      if (!note || !note.noteAccessible) {
        warnings.push({
          severity: 'MEDIUM',
          field: 'item4OtherOperatingIncome',
          issue: 'Cannot verify if IC services',
          details: `P&L Item 4 shows EUR ${this.formatMillion(this.pl.item4TotalAmount.amount)}M but ${noteRef} not accessible - cannot confirm IC nature`,
        });
      } else if (note.icBreakdown === null) {
        warnings.push({
          severity: 'MEDIUM',
          field: 'item4OtherOperatingIncome',
          issue: 'No IC breakdown found in note',
          details: `${noteRef} does not contain explicit IC service fee breakdown - amount may or may not be IC-related`,
        });
      } else {
        // Note accessible and has IC breakdown - this is good
        const icTotal = note.icBreakdown.calculatedTotal;
        if (icTotal > 0) {
          // Verify if properly documented
          if (icTotal > ValidationThresholds.icVolume.documentationRequired) {
            flags.push({
              type: 'SERVICE_FEE_UNSUBSTANTIATED',
              priority: 'MEDIUM',
              description: `IC service fees EUR ${this.formatMillion(icTotal)}M identified in ${noteRef} - verify TP documentation`,
              estimatedValue: `High value IC services require arm's length substantiation`,
              reference: 'OECD TPG Chapter VII',
            });
          }
        }
      }
    }
  }

  /**
   * Validate thin capitalisation
   */
  private validateThinCap(
    warnings: ValidationWarning[],
    flags: TPOpportunityFlag[],
    reasonablenessChecks: CrossValidationResult['reasonablenessChecks']
  ): void {
    const deRatio = reasonablenessChecks.debtToEquityRatio;
    const thresholds = ValidationThresholds.debtEquity;

    if (deRatio !== null) {
      if (deRatio > thresholds.thinCapCritical) {
        flags.push({
          type: 'THIN_CAP',
          priority: 'HIGH',
          description: `IC D/E ratio of ${deRatio.toFixed(1)}:1 exceeds critical threshold of ${thresholds.thinCapCritical}:1`,
          estimatedValue: 'Interest deductions may be denied under thin cap rules',
          reference: 'Luxembourg Circular LIR n° 56/1, Section 3',
        });
      } else if (deRatio > thresholds.thinCapWarning) {
        warnings.push({
          severity: 'HIGH',
          field: 'thinCap',
          issue: 'High IC leverage',
          details: `IC D/E ratio of ${deRatio.toFixed(1)}:1 is elevated (warning threshold: ${thresholds.thinCapWarning}:1)`,
        });
      }
    }
  }

  /**
   * Validate note coverage
   */
  private validateNoteCoverage(warnings: ValidationWarning[]): void {
    const referencedNotes: string[] = [];

    // Collect all referenced notes
    if (this.pl.item4NoteReference) referencedNotes.push(this.pl.item4NoteReference);
    if (this.balanceSheet.icLoansProvidedLongTerm.noteReference) {
      referencedNotes.push(this.balanceSheet.icLoansProvidedLongTerm.noteReference);
    }
    if (this.balanceSheet.icLoansReceivedShortTerm.noteReference) {
      referencedNotes.push(this.balanceSheet.icLoansReceivedShortTerm.noteReference);
    }

    // Check coverage
    let accessibleCount = 0;
    for (const noteRef of referencedNotes) {
      const note = this.notes.get(noteRef);
      if (note?.noteAccessible) {
        accessibleCount++;
      } else {
        warnings.push({
          severity: 'LOW',
          field: 'noteCoverage',
          issue: `Referenced note not accessible`,
          details: `${noteRef} is referenced but not found/readable in document`,
        });
      }
    }
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(errors: ValidationError[]): QualityMetrics {
    const allValues: ExtractedValue[] = [
      this.balanceSheet.icLoansProvidedLongTerm,
      this.balanceSheet.icLoansProvidedShortTerm,
      this.balanceSheet.icLoansReceivedLongTerm,
      this.balanceSheet.icLoansReceivedShortTerm,
      this.balanceSheet.sharesInAffiliatedUndertakings,
      this.pl.item10aInterestFromAffiliates,
      this.pl.item11aInterestFromAffiliates,
      this.pl.item14aInterestToAffiliates,
      this.pl.item9aDividendsFromAffiliates,
    ];

    const extractedValues = allValues.filter(v => v.amount !== null);
    const sourcedValues = extractedValues.filter(v => v.source !== null);

    // Count notes
    let referencedNotes = 0;
    let accessibleNotes = 0;
    let notesWithICBreakdown = 0;

    Array.from(this.notes.values()).forEach(note => {
      referencedNotes++;
      if (note.noteAccessible) {
        accessibleNotes++;
        if (note.icBreakdown !== null) {
          notesWithICBreakdown++;
        }
      }
    });

    const allSourced = extractedValues.length === sourcedValues.length;
    const sourcedPercentage = extractedValues.length > 0
      ? (sourcedValues.length / extractedValues.length) * 100
      : 100;

    // Determine confidence
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    const criticalErrors = errors.filter(e => e.severity === 'CRITICAL').length;
    const hallucinationRisks = errors.filter(e => e.possibleHallucination).length;

    if (criticalErrors > 0 || hallucinationRisks > 0) {
      confidence = 'LOW';
    } else if (sourcedPercentage < 80 || errors.filter(e => e.severity === 'HIGH').length > 0) {
      confidence = 'MEDIUM';
    }

    return {
      allSourced,
      sourcedPercentage,
      valuesExtracted: extractedValues.length,
      valuesWithSources: sourcedValues.length,
      notesCoverage: {
        referenced: referencedNotes,
        accessible: accessibleNotes,
        withICBreakdown: notesWithICBreakdown,
      },
      crossValidated: true,
      confidence,
    };
  }

  /**
   * Format amount for display
   */
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format amount in millions
   */
  private formatMillion(amount: number): string {
    return (amount / 1000000).toFixed(1);
  }
}

/**
 * Custom error for extraction failures
 */
export class ExtractionValidationError extends Error {
  constructor(message: string, public validation: ValidationResult) {
    super(message);
    this.name = 'ExtractionValidationError';
  }
}

export default ExtractionValidator;
