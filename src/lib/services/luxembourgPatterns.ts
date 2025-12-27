/**
 * LAYER 0: Fixed Patterns for Luxembourg GAAP
 *
 * These patterns are based on /docs/ reference guides
 * They define EXACTLY what to look for - no interpretation allowed
 *
 * Reference: Luxembourg Company Law (Law of 19 December 2002)
 */

/**
 * Extraction pattern for identifying specific line items in Luxembourg accounts
 */
export interface ExtractionPattern {
  /** English keywords to search for */
  english: string[];
  /** French keywords to search for */
  french: string[];
  /** Expected line numbers in standardized format (optional) */
  lineNumbers?: number[];
  /** Section where this item should appear */
  section: string;
  /** If specified, the line must contain this phrase to be valid */
  mustIncludePhrase: string | null;
  /** Description for documentation purposes */
  description: string;
  /** Whether this is an IC-specific line item (has sub-item a) */
  isICSpecific: boolean;
}

/**
 * Complete patterns library for Luxembourg GAAP balance sheet items
 */
export const BalanceSheetPatterns = {
  // ============================================================
  // ASSETS - FIXED ASSETS - FINANCIAL ASSETS
  // ============================================================

  /**
   * C.III.1 - Shares in affiliated undertakings
   * Not a loan, but shows group structure
   */
  SHARES_IN_AFFILIATES: {
    english: [
      'Shares in affiliated undertakings',
      'shares in affiliated',
      'Parts in affiliated undertakings',
    ],
    french: [
      'Parts dans des entreprises liées',
      'parts dans entreprises liées',
      'Participations dans des entreprises liées',
    ],
    section: 'Fixed Assets - Financial Assets',
    lineNumbers: [1137, 1138],
    mustIncludePhrase: null,
    description: 'Equity holdings in group companies (not loans)',
    isICSpecific: true,
  } as ExtractionPattern,

  /**
   * C.III.2 - Loans to affiliated undertakings (FIXED ASSETS)
   * IC loans provided - LONG TERM (> 1 year)
   * Note: "Loans to affiliated undertakings" must be matched BEFORE
   *       "Amounts owed by affiliated undertakings" to distinguish from current assets
   */
  IC_LOANS_PROVIDED_LONG_TERM: {
    english: [
      'Loans to affiliated undertakings',
      '2. Loans to affiliated',
      'C.III.2',
    ],
    french: [
      'Prêts aux entreprises liées',
      'Créances sur des entreprises liées',
    ],
    section: 'Fixed Assets - Financial Assets',
    lineNumbers: [1139, 1140],
    mustIncludePhrase: null,
    description: 'Long-term IC loans provided (maturity > 1 year)',
    isICSpecific: true,
  } as ExtractionPattern,

  // ============================================================
  // ASSETS - CURRENT ASSETS - DEBTORS
  // ============================================================

  /**
   * D.II.2 - Amounts owed by affiliated undertakings (CURRENT ASSETS)
   * IC loans/receivables - SHORT TERM (< 1 year)
   */
  IC_LOANS_PROVIDED_SHORT_TERM: {
    english: [
      'Amounts owed by affiliated undertakings',
      'becoming due and payable within one year',
      'due within one year',
    ],
    french: [
      'Créances sur entreprises liées',
      'Créances sur des entreprises liées',
      'à moins d\'un an',
      'devenant exigibles à un an au plus',
    ],
    section: 'Current Assets - Debtors',
    lineNumbers: [1171, 1173],
    mustIncludePhrase: 'within one year',
    description: 'Short-term IC loans/receivables (maturity < 1 year)',
    isICSpecific: true,
  } as ExtractionPattern,

  // ============================================================
  // LIABILITIES - CREDITORS (LONG TERM)
  // ============================================================

  /**
   * C.5 - Amounts owed to affiliated undertakings (>1 year)
   * IC loans received - LONG TERM
   */
  IC_LOANS_RECEIVED_LONG_TERM: {
    english: [
      'Amounts owed to affiliated undertakings',
      'Payables to affiliated undertakings',
      'becoming due and payable after more than one year',
      'after more than one year',
    ],
    french: [
      'Dettes envers des entreprises liées',
      'Dettes envers entreprises liées',
      'à plus d\'un an',
      'devenant exigibles à plus d\'un an',
    ],
    section: 'Creditors - Long Term',
    lineNumbers: [1383, 1384],
    mustIncludePhrase: 'after more than one year',
    description: 'Long-term IC loans received (maturity > 1 year)',
    isICSpecific: true,
  } as ExtractionPattern,

  // ============================================================
  // LIABILITIES - CREDITORS (SHORT TERM)
  // ============================================================

  /**
   * C.5 - Amounts owed to affiliated undertakings (<1 year)
   * IC loans received - SHORT TERM
   * IMPORTANT: Must match liability-specific patterns to avoid matching assets
   */
  IC_LOANS_RECEIVED_SHORT_TERM: {
    english: [
      'Amounts owed to affiliated undertakings',
      'Amounts owed to affiliated',
      'owed to affiliated undertakings',
      'Payables to affiliated undertakings',
    ],
    french: [
      'Dettes envers des entreprises liées',
      'Dettes envers entreprises liées',
      'dettes envers entreprises liées',
    ],
    section: 'Creditors - Short Term',
    lineNumbers: [1379, 1381, 1382],
    mustIncludePhrase: 'owed to',  // Ensures we're in liabilities, not assets
    description: 'Short-term IC loans received (maturity < 1 year)',
    isICSpecific: true,
  } as ExtractionPattern,

  // ============================================================
  // OTHER BALANCE SHEET ITEMS (for context/validation)
  // ============================================================

  TOTAL_ASSETS: {
    english: ['Total assets', 'TOTAL ASSETS', 'Total (assets)'],
    french: ['Total de l\'actif', 'TOTAL ACTIF', 'Total actif'],
    section: 'Balance Sheet Total',
    mustIncludePhrase: null,
    description: 'Total assets for validation purposes',
    isICSpecific: false,
  } as ExtractionPattern,

  TOTAL_EQUITY: {
    english: ['Capital and reserves', 'Total equity', 'Shareholders\' equity'],
    french: ['Capitaux propres', 'Capital et réserves'],
    section: 'Equity',
    mustIncludePhrase: null,
    description: 'Total equity for thin cap analysis',
    isICSpecific: false,
  } as ExtractionPattern,
};

/**
 * Complete patterns library for Luxembourg GAAP P&L items
 */
export const PLPatterns = {
  // ============================================================
  // OPERATING INCOME
  // ============================================================

  /**
   * Item 4 - Other operating income
   * May contain IC service fees - REQUIRES NOTE VERIFICATION
   */
  ITEM_4_OTHER_OPERATING_INCOME: {
    english: [
      'Other operating income',
      'Other operating revenues',
    ],
    french: [
      'Autres produits d\'exploitation',
      'Autres produits d\'exploitation',
    ],
    section: 'P&L - Operating',
    lineNumbers: [713, 714],
    mustIncludePhrase: null,
    description: 'Other operating income - check notes for IC breakdown',
    isICSpecific: false, // Total is not IC-specific, need to check notes
  } as ExtractionPattern,

  // ============================================================
  // FINANCIAL INCOME
  // ============================================================

  /**
   * Item 9 - Income from participating interests (TOTAL)
   */
  ITEM_9_DIVIDENDS_TOTAL: {
    english: [
      'Income from participating interests',
      'Income from financial fixed assets',
    ],
    french: [
      'Produits provenant de participations',
      'Revenus de participations',
    ],
    section: 'P&L - Financial Income',
    lineNumbers: [715, 716],
    mustIncludePhrase: null,
    description: 'Total dividend income - may include non-IC',
    isICSpecific: false,
  } as ExtractionPattern,

  /**
   * Item 9a - Income from participating interests (IC ONLY)
   * "derived from affiliated undertakings"
   */
  ITEM_9A_DIVIDENDS_FROM_AFFILIATES: {
    english: [
      'derived from affiliated undertakings',
      'from affiliated undertakings',
      'of which from affiliated',
    ],
    french: [
      'provenant d\'entreprises liées',
      'dont entreprises liées',
    ],
    section: 'P&L - Financial Income',
    lineNumbers: [717, 718],
    mustIncludePhrase: 'affiliated',
    description: 'IC dividend income ONLY',
    isICSpecific: true,
  } as ExtractionPattern,

  /**
   * Item 10 - Income from other investments (TOTAL)
   */
  ITEM_10_INTEREST_TOTAL: {
    english: [
      'Income from other investments and loans forming part of the fixed assets',
      'Income from other investments and loans forming part',
      'Income from other investments',
      'Other investment income',
    ],
    french: [
      'Produits provenant d\'autres placements et créances de l\'actif immobilisé',
      'Autres produits financiers',
    ],
    section: 'P&L - Financial Income',
    lineNumbers: [721, 722],
    mustIncludePhrase: null,
    description: 'Total interest income from fixed asset loans',
    isICSpecific: false,
  } as ExtractionPattern,

  /**
   * Item 10a - Income from other investments (IC ONLY)
   * "derived from affiliated undertakings"
   * PRIMARY LOCATION FOR IC INTEREST INCOME
   */
  ITEM_10A_INTEREST_FROM_AFFILIATES: {
    english: [
      'derived from affiliated undertakings',
      'from affiliated undertakings',
      'of which from affiliated',
    ],
    french: [
      'provenant d\'entreprises liées',
      'dont entreprises liées',
    ],
    section: 'P&L - Financial Income (Item 10a)',
    lineNumbers: [723, 724],
    mustIncludePhrase: 'affiliated',
    description: 'IC interest income from long-term loans - PRIMARY LOCATION',
    isICSpecific: true,
  } as ExtractionPattern,

  /**
   * Item 11 - Other interest receivable (TOTAL)
   */
  ITEM_11_OTHER_INTEREST_TOTAL: {
    english: [
      'Other interest receivable and similar income',
      'Other interest receivable and similar',
      'Other interest receivable',
      '11.Other interest receivable',
      'Other interest income',
    ],
    french: [
      'Autres intérêts et autres produits assimilés',
      'Autres intérêts',
    ],
    section: 'P&L - Financial Income',
    lineNumbers: [727, 728],
    mustIncludePhrase: null,
    description: 'Total other interest income',
    isICSpecific: false,
  } as ExtractionPattern,

  /**
   * Item 11a - Other interest receivable (IC ONLY)
   * "derived from affiliated undertakings"
   * SECONDARY LOCATION FOR IC INTEREST INCOME
   */
  ITEM_11A_INTEREST_FROM_AFFILIATES: {
    english: [
      'derived from affiliated undertakings',
      'from affiliated undertakings',
      'of which from affiliated',
    ],
    french: [
      'provenant d\'entreprises liées',
      'dont entreprises liées',
    ],
    section: 'P&L - Financial Income (Item 11a)',
    lineNumbers: [729, 730],
    mustIncludePhrase: 'affiliated',
    description: 'IC interest income (other) - SECONDARY LOCATION',
    isICSpecific: true,
  } as ExtractionPattern,

  // ============================================================
  // FINANCIAL EXPENSES
  // ============================================================

  /**
   * Item 14 - Interest payable (TOTAL)
   */
  ITEM_14_INTEREST_EXPENSE_TOTAL: {
    english: [
      'Interest payable and similar expenses',
      'Interest payable',
      'Interest expense',
    ],
    french: [
      'Intérêts et charges assimilées',
      'Intérêts payables',
      'Charges d\'intérêts',
    ],
    section: 'P&L - Financial Expenses',
    lineNumbers: [627, 628],
    mustIncludePhrase: null,
    description: 'Total interest expense',
    isICSpecific: false,
  } as ExtractionPattern,

  /**
   * Item 14a - Interest payable (IC ONLY)
   * "concerning affiliated undertakings"
   * PRIMARY LOCATION FOR IC INTEREST EXPENSE
   */
  ITEM_14A_INTEREST_TO_AFFILIATES: {
    english: [
      'concerning affiliated undertakings',
      'to affiliated undertakings',
      'of which to affiliated',
      'of which concerning affiliated',
    ],
    french: [
      'concernant des entreprises liées',
      'concernant entreprises liées',
      'dont entreprises liées',
    ],
    section: 'P&L - Financial Expenses (Item 14a)',
    lineNumbers: [629, 630],
    mustIncludePhrase: 'affiliated',
    description: 'IC interest expense - PRIMARY LOCATION',
    isICSpecific: true,
  } as ExtractionPattern,

  // ============================================================
  // OTHER P&L ITEMS (for context)
  // ============================================================

  NET_TURNOVER: {
    english: ['Net turnover', 'Revenue', 'Turnover'],
    french: ['Montant net du chiffre d\'affaires', 'Chiffre d\'affaires'],
    section: 'P&L - Revenue',
    mustIncludePhrase: null,
    description: 'Total revenue',
    isICSpecific: false,
  } as ExtractionPattern,

  NET_PROFIT_LOSS: {
    english: ['Profit or loss for the financial year', 'Net profit', 'Net loss'],
    french: ['Résultat de l\'exercice', 'Bénéfice net', 'Perte nette'],
    section: 'P&L - Bottom Line',
    mustIncludePhrase: null,
    description: 'Net profit/loss for the year',
    isICSpecific: false,
  } as ExtractionPattern,
};

/**
 * IC identification keywords - must be present to classify as intercompany
 */
export const ICIdentificationKeywords = {
  /** Primary keywords that definitively indicate IC nature */
  primary: {
    french: [
      'entreprises liées',
      'filiales',
      'société mère',
      'entreprises du groupe',
    ],
    english: [
      'affiliated undertakings',
      'related parties',
      'group companies',
      'parent company',
      'subsidiary',
      'subsidiaries',
      'inter-company',
      'intercompany',
    ],
  },

  /** Secondary keywords that suggest IC nature (need context) */
  secondary: {
    french: [
      'provenant d\'entreprises',
      'concernant des entreprises',
      'envers des entreprises',
      'sur des entreprises',
    ],
    english: [
      'derived from',
      'concerning',
      'owed to',
      'owed by',
    ],
  },

  /** Revenue-side IC indicators */
  revenueIndicators: {
    french: ['provenant d\'entreprises liées'],
    english: ['derived from affiliated undertakings', 'from affiliated'],
  },

  /** Expense-side IC indicators */
  expenseIndicators: {
    french: ['concernant des entreprises liées'],
    english: ['concerning affiliated undertakings', 'to affiliated'],
  },
};

/**
 * Note reference patterns for extracting note numbers
 */
export const NoteReferencePatterns = {
  /** Common note reference formats */
  patterns: [
    /Note\s*(\d+)/gi,
    /Notes?\s*n[°o]?\s*(\d+)/gi,
    /\((\d+)\)/g, // Sometimes notes are just numbers in parentheses
    /\[(\d+)\]/g,
    /voir\s*note\s*(\d+)/gi,
    /see\s*note\s*(\d+)/gi,
    /cf\.\s*note\s*(\d+)/gi,
  ],

  /** Section headers that indicate note content */
  noteSectionHeaders: {
    french: [
      'Notes aux comptes annuels',
      'Annexe aux comptes',
      'NOTES',
    ],
    english: [
      'Notes to the annual accounts',
      'Notes to the financial statements',
      'NOTES',
    ],
  },
};

/**
 * Amount extraction patterns
 */
export const AmountPatterns = {
  /** Currency symbols and prefixes */
  currencies: ['EUR', '€', 'USD', '$', 'GBP', '£'],

  /** Number formats (European and US) */
  numberFormats: [
    // European format: 1.234.567,89 or 1 234 567,89
    /(\d{1,3}(?:[\s.]?\d{3})*(?:,\d{1,2})?)/,
    // US format: 1,234,567.89
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
    // Simple format: 1234567 or 1234567.89
    /(\d+(?:\.\d{1,2})?)/,
  ],

  /** Scale indicators */
  scaleIndicators: {
    thousands: ['(000)', '(in thousands)', 'K EUR', 'KEUR', 'en milliers'],
    millions: ['(000 000)', '(in millions)', 'M EUR', 'MEUR', 'en millions'],
  },
};

/**
 * Validation thresholds for sanity checks
 */
export const ValidationThresholds = {
  /** Interest rate bounds (percentages) */
  interestRates: {
    min: 0.1, // 0.1% - below this is suspicious
    max: 20, // 20% - above this is suspicious
    marketLow: 1, // 1% - low end of market range
    marketHigh: 10, // 10% - high end of market range
    armLengthTypical: 4, // 4% - typical arm's length estimate
  },

  /** Spread thresholds (basis points) */
  spreads: {
    zeroSpreadThreshold: 5, // < 5 bps is effectively zero
    lowSpreadThreshold: 25, // < 25 bps is low
    marketMin: 25, // Market minimum for treasury operations
    marketMax: 75, // Market maximum for treasury operations
  },

  /** Debt/Equity ratio thresholds */
  debtEquity: {
    thinCapWarning: 4, // D/E > 4:1 triggers warning
    thinCapCritical: 6, // D/E > 6:1 is critical
  },

  /** IC volume thresholds (EUR) */
  icVolume: {
    documentationRequired: 1000000, // > €1M requires documentation
    highRisk: 10000000, // > €10M is high risk
  },
};

/**
 * Export all patterns as a single object for easy access
 */
export const LuxembourgAccountsPatterns = {
  BALANCE_SHEET: BalanceSheetPatterns,
  PL: PLPatterns,
  IC_KEYWORDS: ICIdentificationKeywords,
  NOTE_REFERENCES: NoteReferencePatterns,
  AMOUNTS: AmountPatterns,
  VALIDATION: ValidationThresholds,
};

export default LuxembourgAccountsPatterns;
