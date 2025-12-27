import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

// Import 3-layer anti-hallucination architecture
import {
  extractLuxembourgFinancials,
  LuxembourgExtractionResult,
  getICPositionSummary,
  convertToLegacyFormat,
} from './luxembourgExtractor';

// Re-export the new 3-layer extraction
export { extractLuxembourgFinancials, getICPositionSummary, convertToLegacyFormat };
export type { LuxembourgExtractionResult };

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Enhanced interfaces for comprehensive Luxembourg TP extraction

export interface CompanyProfile {
  name: string | null;
  rcsNumber: string | null;
  legalForm: string | null;
  registeredAddress: string | null;
  fiscalYearStart: string | null;
  fiscalYearEnd: string | null;
  incorporationDate: string | null;
  principalActivity: string | null;
  industrySector: string | null;
  numberOfEmployees: number | null;
  directors: string[];
  managementCompany: string | null;
  auditor: string | null;
}

export interface GroupStructure {
  parentCompany: string | null;
  parentCountry: string | null;
  parentOwnershipPct: number | null;
  ultimateParent: string | null;
  ultimateParentCountry: string | null;
  isUltimateParentListed: boolean | null;
  subsidiaries: Array<{
    name: string;
    country: string | null;
    ownershipPct: number | null;
    activity: string | null;
  }>;
  relatedPartiesMentioned: string[];
}

export interface BalanceSheetData {
  currency: string;
  totalAssets: number | null;
  formationExpenses: number | null;
  intangibleAssets: number | null;
  tangibleAssets: number | null;
  financialAssets: {
    sharesInAffiliated: number | null;
    loansToAffiliated: number | null;
    participatingInterests: number | null;
    otherFinancialAssets: number | null;
  };
  currentAssets: {
    inventory: number | null;
    tradeReceivables: number | null;
    icReceivablesCurrent: number | null;
    otherReceivables: number | null;
    cash: number | null;
  };
  totalEquity: number | null;
  shareCapital: number | null;
  sharePremium: number | null;
  reserves: number | null;
  retainedEarnings: number | null;
  profitLossYear: number | null;
  provisions: number | null;
  totalLiabilities: number | null;
  liabilities: {
    bonds: number | null;
    bankDebt: number | null;
    icPayables: number | null;
    tradePayables: number | null;
    taxLiabilities: number | null;
    otherPayables: number | null;
  };
}

export interface ProfitLossData {
  currency: string;
  turnover: number | null;
  otherOperatingIncome: number | null;
  rawMaterials: number | null;
  otherExternalCharges: number | null;
  staffCosts: number | null;
  depreciation: number | null;
  otherOperatingExpenses: number | null;
  operatingResult: number | null;
  financialIncome: {
    incomeFromParticipationsTotal: number | null;
    incomeFromParticipationsAffiliated: number | null;
    interestIncomeTotal: number | null;
    interestIncomeAffiliated: number | null;
    otherFinancialIncome: number | null;
  };
  financialExpenses: {
    interestExpenseTotal: number | null;
    interestExpenseAffiliated: number | null;
    otherFinancialExpenses: number | null;
  };
  financialResult: number | null;
  exceptionalResult: number | null;
  taxExpense: number | null;
  netProfitLoss: number | null;
}

export interface LoanCounterparty {
  name: string | null;
  country: string | null;
  amount: number | null;
  statedRate: string | null;
  effectiveRateCalculated: number | null;
}

export interface IntercompanyTransactions {
  financing: {
    loansReceivable: {
      totalAmount: number | null;
      counterparties: LoanCounterparty[];
    };
    loansPayable: {
      totalAmount: number | null;
      counterparties: LoanCounterparty[];
    };
    spreadAnalysis: {
      averageLendingRate: number | null;
      averageBorrowingRate: number | null;
      spreadBps: number | null;
      spreadVsMarket: string | null;
      isZeroSpread: boolean;
      isLowSpread: boolean;
    };
  };
  services: {
    managementFeesPaid: {
      amount: number | null;
      counterparty: string | null;
      description: string | null;
    };
    managementFeesReceived: {
      amount: number | null;
      counterparty: string | null;
      description: string | null;
    };
    serviceCharges: Array<{
      type: string;
      direction: 'paid' | 'received';
      amount: number | null;
      counterparty: string | null;
    }>;
  };
  ipTransactions: {
    royaltiesPaid: {
      amount: number | null;
      counterparty: string | null;
      description: string | null;
    };
    royaltiesReceived: {
      amount: number | null;
      counterparty: string | null;
      description: string | null;
    };
    licenseFees: number | null;
  };
  guarantees: {
    guaranteesGiven: Array<{
      beneficiary: string | null;
      amount: number | null;
      feeReceived: number | null;
      feeRateBps: number | null;
    }>;
    guaranteesReceived: Array<{
      provider: string | null;
      amount: number | null;
      feePaid: number | null;
    }>;
    guaranteesWithoutFeeFlag: boolean;
  };
  cashPooling: {
    isParticipant: boolean;
    role: 'header' | 'participant' | null;
    details: string | null;
  };
  dividends: {
    receivedFromSubsidiaries: number | null;
    paidToParent: number | null;
  };
}

export interface FinancialIntermediationAnalysis {
  isFinancialIntermediary: boolean;
  netIcPosition: number | null;
  netInterestMarginEur: number | null;
  netInterestMarginPct: number | null;
  marginAssessment: string | null;
  marketBenchmarkSpreadBps: string;
  companySpreadVsBenchmark: string | null;
}

export interface ThinCapitalisationAnalysis {
  totalDebt: number | null;
  totalEquity: number | null;
  debtToEquityRatio: number | null;
  icDebt: number | null;
  icDebtToTotalDebtPct: number | null;
  isThinCapRisk: boolean;
  isHighlyLeveraged: boolean;
  equityAtRiskAssessment: string | null;
}

export interface DocumentationRequirements {
  totalIcVolume: number | null;
  exceeds1mThreshold: boolean;
  tpPolicyMentioned: boolean;
  tpPolicyDetails: string | null;
  masterFileRequired: boolean;
  localFileRequired: boolean;
  article56bisExposure: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface NotesExtraction {
  relatedPartyDisclosureFullText: string | null;
  accountingPoliciesRelevant: string | null;
  significantEvents: string | null;
  commitmentsContingencies: string | null;
  subsequentEvents: string | null;
}

export interface RiskIndicator {
  level: 'RED' | 'AMBER' | 'GREEN';
  reasons: string[];
}

export interface RiskIndicators {
  icRisk: RiskIndicator;
  tpRisk: RiskIndicator;
  docRisk: RiskIndicator;
}

export interface KeyFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  finding: string;
  amountInvolved: number | null;
  reference: string | null;
}

export interface AIAnalysis {
  executiveSummary: string | null;
  keyFindings: KeyFinding[];
  recommendedServices: string[];
  engagementEstimateEur: {
    low: number | null;
    high: number | null;
  };
  outreachAngle: string | null;
  priorityTier: 'A' | 'B' | 'C';
  confidenceScore: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ExtractionMetadata {
  languageDetected: 'FR' | 'EN' | 'DE' | 'MIXED';
  documentQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  pagesProcessed: number | null;
  extractionNotes: string | null;
}

// Complete enhanced extraction result
export interface EnhancedExtractionResult {
  companyProfile: CompanyProfile;
  groupStructure: GroupStructure;
  balanceSheet: BalanceSheetData;
  profitLoss: ProfitLossData;
  intercompanyTransactions: IntercompanyTransactions;
  financialIntermediationAnalysis: FinancialIntermediationAnalysis;
  thinCapitalisationAnalysis: ThinCapitalisationAnalysis;
  documentationRequirements: DocumentationRequirements;
  notesExtraction: NotesExtraction;
  riskIndicators: RiskIndicators;
  aiAnalysis: AIAnalysis;
  extractionMetadata: ExtractionMetadata;
}

// Legacy interface for backwards compatibility
export interface ExtractedFinancialData {
  totalAssets: number | null;
  fixedAssets: number | null;
  financialFixedAssets: number | null;
  icLoansReceivable: number | null;
  icReceivablesTrade: number | null;
  cashAndEquivalents: number | null;
  totalEquity: number | null;
  shareCapital: number | null;
  retainedEarnings: number | null;
  totalDebt: number | null;
  icLoansPayable: number | null;
  icPayablesTrade: number | null;
  thirdPartyDebt: number | null;
  turnover: number | null;
  otherOperatingIncome: number | null;
  icRevenue: number | null;
  interestIncomeTotal: number | null;
  interestIncomeIc: number | null;
  interestExpenseTotal: number | null;
  interestExpenseIc: number | null;
  dividendIncome: number | null;
  managementFees: number | null;
  royaltyExpense: number | null;
  serviceFeesIc: number | null;
  operatingResult: number | null;
  financialResult: number | null;
  profitBeforeTax: number | null;
  taxExpense: number | null;
  netProfit: number | null;
  debtToEquityRatio: number | null;
  icDebtToTotalDebtRatio: number | null;
  interestCoverageRatio: number | null;
  netInterestMargin: number | null;
  // New enhanced fields
  netIcPosition: number | null;
  netInterestMarginEur: number | null;
  netInterestMarginPct: number | null;
  spreadBps: number | null;
  spreadVsBenchmark: string | null;
}

export interface ExtractedICTransaction {
  transactionType: string;
  transactionCategory: string | null;
  principalAmount: number | null;
  annualFlow: number | null;
  counterpartyName: string | null;
  counterpartyCountry: string | null;
  impliedInterestRate: number | null;
  isCrossBorder: boolean;
  isHighValue: boolean;
  sourceNote: string | null;
}

export interface ExtractionResult {
  success: boolean;
  financialData: ExtractedFinancialData | null;
  icTransactions: ExtractedICTransaction[];
  detectedLanguage: string | null;
  detectedFiscalYear: number | null;
  detectedCompanyName: string | null;
  detectedRcsNumber: string | null;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
  error?: string;
  // Enhanced extraction data
  enhancedData?: EnhancedExtractionResult;
}

// Enhanced system prompt for Luxembourg TP specialist
const SYSTEM_PROMPT = `You are a senior Luxembourg transfer pricing specialist with deep expertise in:
- Luxembourg GAAP (Law of 19 December 2002)
- Luxembourg TP Circular (LIR n° 56/1 - 56bis/1)
- OECD Transfer Pricing Guidelines (especially Chapter X on Financial Transactions)
- Article 56 and 56bis LIR requirements
- Financial intermediary analysis

You analyze annual accounts to identify transfer pricing risks and opportunities.
You understand both French and English accounting terminology.
You extract maximum information from financial statements and notes.

Respond ONLY with valid JSON. No explanations or markdown.`;

// Enhanced user prompt template
const getEnhancedUserPrompt = (documentText: string): string => `Analyze this Luxembourg company annual accounts document thoroughly.

DOCUMENT TEXT:
${documentText}

EXTRACT ALL OF THE FOLLOWING (use null if not found):

{
  "company_profile": {
    "name": "string",
    "rcs_number": "string (format: B123456)",
    "legal_form": "SA|SARL|SCS|SCA|SE|SCSp|SNC|other",
    "registered_address": "string",
    "fiscal_year_start": "YYYY-MM-DD",
    "fiscal_year_end": "YYYY-MM-DD",
    "incorporation_date": "string if mentioned",
    "principal_activity": "string - extract from notes/management report",
    "industry_sector": "string - infer from activity",
    "number_of_employees": "number or null",
    "directors": ["array of director names if disclosed"],
    "management_company": "string if admin is outsourced",
    "auditor": "string"
  },

  "group_structure": {
    "parent_company": "string",
    "parent_country": "ISO 2-letter code",
    "parent_ownership_pct": "number",
    "ultimate_parent": "string",
    "ultimate_parent_country": "ISO 2-letter code",
    "is_ultimate_parent_listed": "boolean",
    "subsidiaries": [
      {
        "name": "string",
        "country": "ISO code",
        "ownership_pct": "number",
        "activity": "string if disclosed"
      }
    ],
    "related_parties_mentioned": ["array of all related party names with countries"]
  },

  "balance_sheet": {
    "currency": "EUR",
    "total_assets": "number",
    "formation_expenses": "number",
    "intangible_assets": "number",
    "tangible_assets": "number",
    "financial_assets": {
      "shares_in_affiliated": "number - Parts dans entreprises liées",
      "loans_to_affiliated": "number - Créances sur entreprises liées (fixed)",
      "participating_interests": "number",
      "other_financial_assets": "number"
    },
    "current_assets": {
      "inventory": "number",
      "trade_receivables": "number",
      "ic_receivables_current": "number - Créances sur entreprises liées (current)",
      "other_receivables": "number",
      "cash": "number"
    },
    "total_equity": "number",
    "share_capital": "number",
    "share_premium": "number",
    "reserves": "number",
    "retained_earnings": "number",
    "profit_loss_year": "number",
    "provisions": "number",
    "total_liabilities": "number",
    "liabilities": {
      "bonds": "number",
      "bank_debt": "number",
      "ic_payables": "number - Dettes envers entreprises liées",
      "trade_payables": "number",
      "tax_liabilities": "number",
      "other_payables": "number"
    }
  },

  "profit_loss": {
    "currency": "EUR",
    "turnover": "number",
    "other_operating_income": "number",
    "raw_materials": "number",
    "other_external_charges": "number",
    "staff_costs": "number",
    "depreciation": "number",
    "other_operating_expenses": "number",
    "operating_result": "number",
    "financial_income": {
      "income_from_participations_total": "number",
      "income_from_participations_affiliated": "number",
      "interest_income_total": "number",
      "interest_income_affiliated": "number - specifically from related parties",
      "other_financial_income": "number"
    },
    "financial_expenses": {
      "interest_expense_total": "number",
      "interest_expense_affiliated": "number - specifically to related parties",
      "other_financial_expenses": "number"
    },
    "financial_result": "number",
    "exceptional_result": "number",
    "tax_expense": "number",
    "net_profit_loss": "number"
  },

  "intercompany_transactions": {
    "financing": {
      "loans_receivable": {
        "total_amount": "number",
        "counterparties": [
          {
            "name": "string",
            "country": "ISO code",
            "amount": "number",
            "stated_rate": "string - as written in notes",
            "effective_rate_calculated": "number - interest/principal as %"
          }
        ]
      },
      "loans_payable": {
        "total_amount": "number",
        "counterparties": [
          {
            "name": "string",
            "country": "ISO code",
            "amount": "number",
            "stated_rate": "string - as written in notes",
            "effective_rate_calculated": "number - interest/principal as %"
          }
        ]
      },
      "spread_analysis": {
        "average_lending_rate": "number %",
        "average_borrowing_rate": "number %",
        "spread_bps": "number - in basis points",
        "spread_vs_market": "string - comparison to typical 25-75 bps",
        "is_zero_spread": "boolean",
        "is_low_spread": "boolean - less than 25 bps"
      }
    },
    "services": {
      "management_fees_paid": {
        "amount": "number",
        "counterparty": "string",
        "description": "string from notes"
      },
      "management_fees_received": {
        "amount": "number",
        "counterparty": "string",
        "description": "string from notes"
      },
      "service_charges": [
        {
          "type": "string",
          "direction": "paid|received",
          "amount": "number",
          "counterparty": "string"
        }
      ]
    },
    "ip_transactions": {
      "royalties_paid": {
        "amount": "number",
        "counterparty": "string",
        "description": "string"
      },
      "royalties_received": {
        "amount": "number",
        "counterparty": "string",
        "description": "string"
      },
      "license_fees": "number"
    },
    "guarantees": {
      "guarantees_given": [
        {
          "beneficiary": "string",
          "amount": "number",
          "fee_received": "number or null",
          "fee_rate_bps": "number or null"
        }
      ],
      "guarantees_received": [
        {
          "provider": "string",
          "amount": "number",
          "fee_paid": "number or null"
        }
      ],
      "guarantees_without_fee_flag": "boolean"
    },
    "cash_pooling": {
      "is_participant": "boolean",
      "role": "header|participant|null",
      "details": "string from notes"
    },
    "dividends": {
      "received_from_subsidiaries": "number",
      "paid_to_parent": "number"
    }
  },

  "financial_intermediation_analysis": {
    "is_financial_intermediary": "boolean - borrows to on-lend",
    "net_ic_position": "number - receivables minus payables",
    "net_interest_margin_eur": "number - interest income IC minus interest expense IC",
    "net_interest_margin_pct": "number - margin as % of average loans",
    "margin_assessment": "string - VERY LOW/LOW/ADEQUATE/HIGH",
    "market_benchmark_spread_bps": "25-75 bps typical for treasury",
    "company_spread_vs_benchmark": "string - e.g., '0 bps vs market 25-75 bps'"
  },

  "thin_capitalisation_analysis": {
    "total_debt": "number",
    "total_equity": "number",
    "debt_to_equity_ratio": "number",
    "ic_debt": "number",
    "ic_debt_to_total_debt_pct": "number",
    "is_thin_cap_risk": "boolean - D/E > 4:1",
    "is_highly_leveraged": "boolean - D/E > 6:1",
    "equity_at_risk_assessment": "string"
  },

  "documentation_requirements": {
    "total_ic_volume": "number - sum of all IC transactions",
    "exceeds_1m_threshold": "boolean",
    "tp_policy_mentioned": "boolean",
    "tp_policy_details": "string if mentioned",
    "master_file_required": "boolean",
    "local_file_required": "boolean",
    "article_56bis_exposure": "HIGH|MEDIUM|LOW"
  },

  "notes_extraction": {
    "related_party_disclosure_full_text": "string - complete related party note",
    "accounting_policies_relevant": "string - any TP-relevant policies",
    "significant_events": "string - any significant transactions or events",
    "commitments_contingencies": "string - off-balance sheet items",
    "subsequent_events": "string if any"
  },

  "risk_indicators": {
    "ic_risk": {
      "level": "RED|AMBER|GREEN",
      "reasons": ["array of specific reasons"]
    },
    "tp_risk": {
      "level": "RED|AMBER|GREEN",
      "reasons": ["array of specific reasons"]
    },
    "doc_risk": {
      "level": "RED|AMBER|GREEN",
      "reasons": ["array of specific reasons"]
    }
  },

  "ai_analysis": {
    "executive_summary": "string - 3-4 sentences summarizing TP position",
    "key_findings": [
      {
        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
        "finding": "string - specific issue",
        "amount_involved": "number if applicable",
        "reference": "string - OECD/Luxembourg law reference"
      }
    ],
    "recommended_services": ["array of specific services to propose"],
    "engagement_estimate_eur": {
      "low": "number",
      "high": "number"
    },
    "outreach_angle": "string - suggested pitch for contacting company",
    "priority_tier": "A|B|C",
    "confidence_score": "HIGH|MEDIUM|LOW"
  },

  "extraction_metadata": {
    "language_detected": "FR|EN|DE|MIXED",
    "document_quality": "HIGH|MEDIUM|LOW",
    "pages_processed": "number",
    "extraction_notes": "string - any issues or limitations"
  }
}

TRAFFIC LIGHT RULES:
IC Risk (Intercompany):
- RED: Zero spread OR IC volume > €10M OR guarantee without fee
- AMBER: Spread < 50 bps OR IC volume €1-10M
- GREEN: Spread > 50 bps AND IC volume < €1M

TP Risk (Transfer Pricing):
- RED: Zero spread OR D/E > 4:1 OR no TP policy with IC > €1M
- AMBER: Low spread (< 25 bps) OR D/E 2-4:1
- GREEN: Adequate spread AND D/E < 2:1

DOC Risk (Documentation):
- RED: IC > €1M AND no TP policy mentioned
- AMBER: IC > €1M (documentation required)
- GREEN: IC < €1M OR TP policy exists

IMPORTANT:
- All amounts in EUR
- Interest rates as percentages (e.g., 2.5 for 2.5%)
- Spread in basis points (e.g., 50 for 0.50%)
- Calculate effective rates: annual interest / principal amount
- Market benchmark for treasury spread: 25-75 basis points
- Always extract full related party note text
- Flag any discrepancy between stated and calculated rates`;

// Map enhanced extraction to legacy format for backwards compatibility
const mapToLegacyFormat = (enhanced: EnhancedExtractionResult): ExtractedFinancialData => {
  const bs = enhanced.balanceSheet;
  const pl = enhanced.profitLoss;
  const fia = enhanced.financialIntermediationAnalysis;
  const tca = enhanced.thinCapitalisationAnalysis;
  const ic = enhanced.intercompanyTransactions;

  // Calculate IC loans receivable (fixed + current)
  const icLoansReceivable = (bs.financialAssets.loansToAffiliated || 0) +
    (bs.currentAssets.icReceivablesCurrent || 0) || null;

  return {
    totalAssets: bs.totalAssets,
    fixedAssets: (bs.intangibleAssets || 0) + (bs.tangibleAssets || 0) || null,
    financialFixedAssets: bs.financialAssets.sharesInAffiliated,
    icLoansReceivable,
    icReceivablesTrade: bs.currentAssets.icReceivablesCurrent,
    cashAndEquivalents: bs.currentAssets.cash,
    totalEquity: bs.totalEquity,
    shareCapital: bs.shareCapital,
    retainedEarnings: bs.retainedEarnings,
    totalDebt: bs.totalLiabilities,
    icLoansPayable: bs.liabilities.icPayables,
    icPayablesTrade: null,
    thirdPartyDebt: bs.liabilities.bankDebt,
    turnover: pl.turnover,
    otherOperatingIncome: pl.otherOperatingIncome,
    icRevenue: null,
    interestIncomeTotal: pl.financialIncome.interestIncomeTotal,
    interestIncomeIc: pl.financialIncome.interestIncomeAffiliated,
    interestExpenseTotal: pl.financialExpenses.interestExpenseTotal,
    interestExpenseIc: pl.financialExpenses.interestExpenseAffiliated,
    dividendIncome: pl.financialIncome.incomeFromParticipationsAffiliated,
    managementFees: ic.services.managementFeesPaid.amount,
    royaltyExpense: ic.ipTransactions.royaltiesPaid.amount,
    serviceFeesIc: null,
    operatingResult: pl.operatingResult,
    financialResult: pl.financialResult,
    profitBeforeTax: null,
    taxExpense: pl.taxExpense,
    netProfit: pl.netProfitLoss,
    debtToEquityRatio: tca.debtToEquityRatio,
    icDebtToTotalDebtRatio: tca.icDebtToTotalDebtPct ? tca.icDebtToTotalDebtPct / 100 : null,
    interestCoverageRatio: null,
    netInterestMargin: fia.netInterestMarginPct,
    // New enhanced fields
    netIcPosition: fia.netIcPosition,
    netInterestMarginEur: fia.netInterestMarginEur,
    netInterestMarginPct: fia.netInterestMarginPct,
    spreadBps: ic.financing.spreadAnalysis.spreadBps,
    spreadVsBenchmark: ic.financing.spreadAnalysis.spreadVsMarket,
  };
};

// Map enhanced extraction to IC transactions format
const mapToICTransactions = (enhanced: EnhancedExtractionResult): ExtractedICTransaction[] => {
  const transactions: ExtractedICTransaction[] = [];
  const ic = enhanced.intercompanyTransactions;

  // Loans receivable
  if (ic.financing.loansReceivable.counterparties) {
    for (const cp of ic.financing.loansReceivable.counterparties) {
      transactions.push({
        transactionType: 'ic_loan_granted',
        transactionCategory: 'financing',
        principalAmount: cp.amount,
        annualFlow: null,
        counterpartyName: cp.name,
        counterpartyCountry: cp.country,
        impliedInterestRate: cp.effectiveRateCalculated,
        isCrossBorder: cp.country ? cp.country !== 'LU' : false,
        isHighValue: cp.amount ? cp.amount > 1000000 : false,
        sourceNote: cp.statedRate,
      });
    }
  }

  // Loans payable
  if (ic.financing.loansPayable.counterparties) {
    for (const cp of ic.financing.loansPayable.counterparties) {
      transactions.push({
        transactionType: 'ic_loan_received',
        transactionCategory: 'financing',
        principalAmount: cp.amount,
        annualFlow: null,
        counterpartyName: cp.name,
        counterpartyCountry: cp.country,
        impliedInterestRate: cp.effectiveRateCalculated,
        isCrossBorder: cp.country ? cp.country !== 'LU' : false,
        isHighValue: cp.amount ? cp.amount > 1000000 : false,
        sourceNote: cp.statedRate,
      });
    }
  }

  // Management fees paid
  if (ic.services.managementFeesPaid.amount) {
    transactions.push({
      transactionType: 'management_fee',
      transactionCategory: 'services',
      principalAmount: ic.services.managementFeesPaid.amount,
      annualFlow: ic.services.managementFeesPaid.amount,
      counterpartyName: ic.services.managementFeesPaid.counterparty,
      counterpartyCountry: null,
      impliedInterestRate: null,
      isCrossBorder: true,
      isHighValue: ic.services.managementFeesPaid.amount > 500000,
      sourceNote: ic.services.managementFeesPaid.description,
    });
  }

  // Management fees received
  if (ic.services.managementFeesReceived.amount) {
    transactions.push({
      transactionType: 'management_fee',
      transactionCategory: 'services',
      principalAmount: ic.services.managementFeesReceived.amount,
      annualFlow: ic.services.managementFeesReceived.amount,
      counterpartyName: ic.services.managementFeesReceived.counterparty,
      counterpartyCountry: null,
      impliedInterestRate: null,
      isCrossBorder: true,
      isHighValue: ic.services.managementFeesReceived.amount > 500000,
      sourceNote: ic.services.managementFeesReceived.description,
    });
  }

  // Royalties paid
  if (ic.ipTransactions.royaltiesPaid.amount) {
    transactions.push({
      transactionType: 'royalty',
      transactionCategory: 'ip',
      principalAmount: ic.ipTransactions.royaltiesPaid.amount,
      annualFlow: ic.ipTransactions.royaltiesPaid.amount,
      counterpartyName: ic.ipTransactions.royaltiesPaid.counterparty,
      counterpartyCountry: null,
      impliedInterestRate: null,
      isCrossBorder: true,
      isHighValue: ic.ipTransactions.royaltiesPaid.amount > 500000,
      sourceNote: ic.ipTransactions.royaltiesPaid.description,
    });
  }

  // Guarantees given
  if (ic.guarantees.guaranteesGiven) {
    for (const g of ic.guarantees.guaranteesGiven) {
      transactions.push({
        transactionType: 'guarantee',
        transactionCategory: 'financing',
        principalAmount: g.amount,
        annualFlow: g.feeReceived,
        counterpartyName: g.beneficiary,
        counterpartyCountry: null,
        impliedInterestRate: g.feeRateBps ? g.feeRateBps / 100 : null,
        isCrossBorder: true,
        isHighValue: g.amount ? g.amount > 1000000 : false,
        sourceNote: g.feeReceived === null ? 'No fee charged' : null,
      });
    }
  }

  // Service charges
  if (ic.services.serviceCharges) {
    for (const sc of ic.services.serviceCharges) {
      transactions.push({
        transactionType: 'service_fee',
        transactionCategory: 'services',
        principalAmount: sc.amount,
        annualFlow: sc.amount,
        counterpartyName: sc.counterparty,
        counterpartyCountry: null,
        impliedInterestRate: null,
        isCrossBorder: true,
        isHighValue: sc.amount ? sc.amount > 500000 : false,
        sourceNote: `${sc.type} - ${sc.direction}`,
      });
    }
  }

  return transactions;
};

// Parse the enhanced JSON response into typed structure
const parseEnhancedResponse = (data: Record<string, unknown>): EnhancedExtractionResult => {
  const companyProfile = data.company_profile as Record<string, unknown> || {};
  const groupStructure = data.group_structure as Record<string, unknown> || {};
  const balanceSheet = data.balance_sheet as Record<string, unknown> || {};
  const profitLoss = data.profit_loss as Record<string, unknown> || {};
  const icTransactions = data.intercompany_transactions as Record<string, unknown> || {};
  const fiaData = data.financial_intermediation_analysis as Record<string, unknown> || {};
  const tcaData = data.thin_capitalisation_analysis as Record<string, unknown> || {};
  const docReq = data.documentation_requirements as Record<string, unknown> || {};
  const notesData = data.notes_extraction as Record<string, unknown> || {};
  const riskInd = data.risk_indicators as Record<string, unknown> || {};
  const aiData = data.ai_analysis as Record<string, unknown> || {};
  const metaData = data.extraction_metadata as Record<string, unknown> || {};

  // Parse financial assets
  const financialAssets = balanceSheet.financial_assets as Record<string, unknown> || {};
  const currentAssets = balanceSheet.current_assets as Record<string, unknown> || {};
  const liabilities = balanceSheet.liabilities as Record<string, unknown> || {};

  // Parse P&L sections
  const financialIncome = profitLoss.financial_income as Record<string, unknown> || {};
  const financialExpenses = profitLoss.financial_expenses as Record<string, unknown> || {};

  // Parse IC transaction sections
  const financing = icTransactions.financing as Record<string, unknown> || {};
  const services = icTransactions.services as Record<string, unknown> || {};
  const ipTx = icTransactions.ip_transactions as Record<string, unknown> || {};
  const guarantees = icTransactions.guarantees as Record<string, unknown> || {};
  const cashPooling = icTransactions.cash_pooling as Record<string, unknown> || {};
  const dividends = icTransactions.dividends as Record<string, unknown> || {};

  // Parse financing sub-sections
  const loansReceivable = financing.loans_receivable as Record<string, unknown> || {};
  const loansPayable = financing.loans_payable as Record<string, unknown> || {};
  const spreadAnalysis = financing.spread_analysis as Record<string, unknown> || {};

  // Parse services sub-sections
  const mgmtFeesPaid = services.management_fees_paid as Record<string, unknown> || {};
  const mgmtFeesReceived = services.management_fees_received as Record<string, unknown> || {};

  // Parse IP sub-sections
  const royaltiesPaid = ipTx.royalties_paid as Record<string, unknown> || {};
  const royaltiesReceived = ipTx.royalties_received as Record<string, unknown> || {};

  // Parse risk indicators
  const icRisk = riskInd.ic_risk as Record<string, unknown> || { level: 'GREEN', reasons: [] };
  const tpRisk = riskInd.tp_risk as Record<string, unknown> || { level: 'GREEN', reasons: [] };
  const docRisk = riskInd.doc_risk as Record<string, unknown> || { level: 'GREEN', reasons: [] };

  // Parse AI analysis
  const engagementEstimate = aiData.engagement_estimate_eur as Record<string, unknown> || {};

  return {
    companyProfile: {
      name: companyProfile.name as string | null,
      rcsNumber: companyProfile.rcs_number as string | null,
      legalForm: companyProfile.legal_form as string | null,
      registeredAddress: companyProfile.registered_address as string | null,
      fiscalYearStart: companyProfile.fiscal_year_start as string | null,
      fiscalYearEnd: companyProfile.fiscal_year_end as string | null,
      incorporationDate: companyProfile.incorporation_date as string | null,
      principalActivity: companyProfile.principal_activity as string | null,
      industrySector: companyProfile.industry_sector as string | null,
      numberOfEmployees: companyProfile.number_of_employees as number | null,
      directors: (companyProfile.directors as string[]) || [],
      managementCompany: companyProfile.management_company as string | null,
      auditor: companyProfile.auditor as string | null,
    },
    groupStructure: {
      parentCompany: groupStructure.parent_company as string | null,
      parentCountry: groupStructure.parent_country as string | null,
      parentOwnershipPct: groupStructure.parent_ownership_pct as number | null,
      ultimateParent: groupStructure.ultimate_parent as string | null,
      ultimateParentCountry: groupStructure.ultimate_parent_country as string | null,
      isUltimateParentListed: groupStructure.is_ultimate_parent_listed as boolean | null,
      subsidiaries: (groupStructure.subsidiaries as Array<{
        name: string;
        country: string | null;
        ownership_pct: number | null;
        activity: string | null;
      }> || []).map(s => ({
        name: s.name,
        country: s.country,
        ownershipPct: s.ownership_pct,
        activity: s.activity,
      })),
      relatedPartiesMentioned: (groupStructure.related_parties_mentioned as string[]) || [],
    },
    balanceSheet: {
      currency: (balanceSheet.currency as string) || 'EUR',
      totalAssets: balanceSheet.total_assets as number | null,
      formationExpenses: balanceSheet.formation_expenses as number | null,
      intangibleAssets: balanceSheet.intangible_assets as number | null,
      tangibleAssets: balanceSheet.tangible_assets as number | null,
      financialAssets: {
        sharesInAffiliated: financialAssets.shares_in_affiliated as number | null,
        loansToAffiliated: financialAssets.loans_to_affiliated as number | null,
        participatingInterests: financialAssets.participating_interests as number | null,
        otherFinancialAssets: financialAssets.other_financial_assets as number | null,
      },
      currentAssets: {
        inventory: currentAssets.inventory as number | null,
        tradeReceivables: currentAssets.trade_receivables as number | null,
        icReceivablesCurrent: currentAssets.ic_receivables_current as number | null,
        otherReceivables: currentAssets.other_receivables as number | null,
        cash: currentAssets.cash as number | null,
      },
      totalEquity: balanceSheet.total_equity as number | null,
      shareCapital: balanceSheet.share_capital as number | null,
      sharePremium: balanceSheet.share_premium as number | null,
      reserves: balanceSheet.reserves as number | null,
      retainedEarnings: balanceSheet.retained_earnings as number | null,
      profitLossYear: balanceSheet.profit_loss_year as number | null,
      provisions: balanceSheet.provisions as number | null,
      totalLiabilities: balanceSheet.total_liabilities as number | null,
      liabilities: {
        bonds: liabilities.bonds as number | null,
        bankDebt: liabilities.bank_debt as number | null,
        icPayables: liabilities.ic_payables as number | null,
        tradePayables: liabilities.trade_payables as number | null,
        taxLiabilities: liabilities.tax_liabilities as number | null,
        otherPayables: liabilities.other_payables as number | null,
      },
    },
    profitLoss: {
      currency: (profitLoss.currency as string) || 'EUR',
      turnover: profitLoss.turnover as number | null,
      otherOperatingIncome: profitLoss.other_operating_income as number | null,
      rawMaterials: profitLoss.raw_materials as number | null,
      otherExternalCharges: profitLoss.other_external_charges as number | null,
      staffCosts: profitLoss.staff_costs as number | null,
      depreciation: profitLoss.depreciation as number | null,
      otherOperatingExpenses: profitLoss.other_operating_expenses as number | null,
      operatingResult: profitLoss.operating_result as number | null,
      financialIncome: {
        incomeFromParticipationsTotal: financialIncome.income_from_participations_total as number | null,
        incomeFromParticipationsAffiliated: financialIncome.income_from_participations_affiliated as number | null,
        interestIncomeTotal: financialIncome.interest_income_total as number | null,
        interestIncomeAffiliated: financialIncome.interest_income_affiliated as number | null,
        otherFinancialIncome: financialIncome.other_financial_income as number | null,
      },
      financialExpenses: {
        interestExpenseTotal: financialExpenses.interest_expense_total as number | null,
        interestExpenseAffiliated: financialExpenses.interest_expense_affiliated as number | null,
        otherFinancialExpenses: financialExpenses.other_financial_expenses as number | null,
      },
      financialResult: profitLoss.financial_result as number | null,
      exceptionalResult: profitLoss.exceptional_result as number | null,
      taxExpense: profitLoss.tax_expense as number | null,
      netProfitLoss: profitLoss.net_profit_loss as number | null,
    },
    intercompanyTransactions: {
      financing: {
        loansReceivable: {
          totalAmount: loansReceivable.total_amount as number | null,
          counterparties: ((loansReceivable.counterparties as Array<Record<string, unknown>>) || []).map(cp => ({
            name: cp.name as string | null,
            country: cp.country as string | null,
            amount: cp.amount as number | null,
            statedRate: cp.stated_rate as string | null,
            effectiveRateCalculated: cp.effective_rate_calculated as number | null,
          })),
        },
        loansPayable: {
          totalAmount: loansPayable.total_amount as number | null,
          counterparties: ((loansPayable.counterparties as Array<Record<string, unknown>>) || []).map(cp => ({
            name: cp.name as string | null,
            country: cp.country as string | null,
            amount: cp.amount as number | null,
            statedRate: cp.stated_rate as string | null,
            effectiveRateCalculated: cp.effective_rate_calculated as number | null,
          })),
        },
        spreadAnalysis: {
          averageLendingRate: spreadAnalysis.average_lending_rate as number | null,
          averageBorrowingRate: spreadAnalysis.average_borrowing_rate as number | null,
          spreadBps: spreadAnalysis.spread_bps as number | null,
          spreadVsMarket: spreadAnalysis.spread_vs_market as string | null,
          isZeroSpread: (spreadAnalysis.is_zero_spread as boolean) || false,
          isLowSpread: (spreadAnalysis.is_low_spread as boolean) || false,
        },
      },
      services: {
        managementFeesPaid: {
          amount: mgmtFeesPaid.amount as number | null,
          counterparty: mgmtFeesPaid.counterparty as string | null,
          description: mgmtFeesPaid.description as string | null,
        },
        managementFeesReceived: {
          amount: mgmtFeesReceived.amount as number | null,
          counterparty: mgmtFeesReceived.counterparty as string | null,
          description: mgmtFeesReceived.description as string | null,
        },
        serviceCharges: ((services.service_charges as Array<Record<string, unknown>>) || []).map(sc => ({
          type: sc.type as string,
          direction: sc.direction as 'paid' | 'received',
          amount: sc.amount as number | null,
          counterparty: sc.counterparty as string | null,
        })),
      },
      ipTransactions: {
        royaltiesPaid: {
          amount: royaltiesPaid.amount as number | null,
          counterparty: royaltiesPaid.counterparty as string | null,
          description: royaltiesPaid.description as string | null,
        },
        royaltiesReceived: {
          amount: royaltiesReceived.amount as number | null,
          counterparty: royaltiesReceived.counterparty as string | null,
          description: royaltiesReceived.description as string | null,
        },
        licenseFees: ipTx.license_fees as number | null,
      },
      guarantees: {
        guaranteesGiven: ((guarantees.guarantees_given as Array<Record<string, unknown>>) || []).map(g => ({
          beneficiary: g.beneficiary as string | null,
          amount: g.amount as number | null,
          feeReceived: g.fee_received as number | null,
          feeRateBps: g.fee_rate_bps as number | null,
        })),
        guaranteesReceived: ((guarantees.guarantees_received as Array<Record<string, unknown>>) || []).map(g => ({
          provider: g.provider as string | null,
          amount: g.amount as number | null,
          feePaid: g.fee_paid as number | null,
        })),
        guaranteesWithoutFeeFlag: (guarantees.guarantees_without_fee_flag as boolean) || false,
      },
      cashPooling: {
        isParticipant: (cashPooling.is_participant as boolean) || false,
        role: cashPooling.role as 'header' | 'participant' | null,
        details: cashPooling.details as string | null,
      },
      dividends: {
        receivedFromSubsidiaries: dividends.received_from_subsidiaries as number | null,
        paidToParent: dividends.paid_to_parent as number | null,
      },
    },
    financialIntermediationAnalysis: {
      isFinancialIntermediary: (fiaData.is_financial_intermediary as boolean) || false,
      netIcPosition: fiaData.net_ic_position as number | null,
      netInterestMarginEur: fiaData.net_interest_margin_eur as number | null,
      netInterestMarginPct: fiaData.net_interest_margin_pct as number | null,
      marginAssessment: fiaData.margin_assessment as string | null,
      marketBenchmarkSpreadBps: (fiaData.market_benchmark_spread_bps as string) || '25-75 bps',
      companySpreadVsBenchmark: fiaData.company_spread_vs_benchmark as string | null,
    },
    thinCapitalisationAnalysis: {
      totalDebt: tcaData.total_debt as number | null,
      totalEquity: tcaData.total_equity as number | null,
      debtToEquityRatio: tcaData.debt_to_equity_ratio as number | null,
      icDebt: tcaData.ic_debt as number | null,
      icDebtToTotalDebtPct: tcaData.ic_debt_to_total_debt_pct as number | null,
      isThinCapRisk: (tcaData.is_thin_cap_risk as boolean) || false,
      isHighlyLeveraged: (tcaData.is_highly_leveraged as boolean) || false,
      equityAtRiskAssessment: tcaData.equity_at_risk_assessment as string | null,
    },
    documentationRequirements: {
      totalIcVolume: docReq.total_ic_volume as number | null,
      exceeds1mThreshold: (docReq.exceeds_1m_threshold as boolean) || false,
      tpPolicyMentioned: (docReq.tp_policy_mentioned as boolean) || false,
      tpPolicyDetails: docReq.tp_policy_details as string | null,
      masterFileRequired: (docReq.master_file_required as boolean) || false,
      localFileRequired: (docReq.local_file_required as boolean) || false,
      article56bisExposure: (docReq.article_56bis_exposure as 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW',
    },
    notesExtraction: {
      relatedPartyDisclosureFullText: notesData.related_party_disclosure_full_text as string | null,
      accountingPoliciesRelevant: notesData.accounting_policies_relevant as string | null,
      significantEvents: notesData.significant_events as string | null,
      commitmentsContingencies: notesData.commitments_contingencies as string | null,
      subsequentEvents: notesData.subsequent_events as string | null,
    },
    riskIndicators: {
      icRisk: {
        level: (icRisk.level as 'RED' | 'AMBER' | 'GREEN') || 'GREEN',
        reasons: (icRisk.reasons as string[]) || [],
      },
      tpRisk: {
        level: (tpRisk.level as 'RED' | 'AMBER' | 'GREEN') || 'GREEN',
        reasons: (tpRisk.reasons as string[]) || [],
      },
      docRisk: {
        level: (docRisk.level as 'RED' | 'AMBER' | 'GREEN') || 'GREEN',
        reasons: (docRisk.reasons as string[]) || [],
      },
    },
    aiAnalysis: {
      executiveSummary: aiData.executive_summary as string | null,
      keyFindings: ((aiData.key_findings as Array<Record<string, unknown>>) || []).map(kf => ({
        severity: (kf.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW',
        finding: (kf.finding as string) || '',
        amountInvolved: kf.amount_involved as number | null,
        reference: kf.reference as string | null,
      })),
      recommendedServices: (aiData.recommended_services as string[]) || [],
      engagementEstimateEur: {
        low: engagementEstimate.low as number | null,
        high: engagementEstimate.high as number | null,
      },
      outreachAngle: aiData.outreach_angle as string | null,
      priorityTier: (aiData.priority_tier as 'A' | 'B' | 'C') || 'C',
      confidenceScore: (aiData.confidence_score as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
    },
    extractionMetadata: {
      languageDetected: (metaData.language_detected as 'FR' | 'EN' | 'DE' | 'MIXED') || 'MIXED',
      documentQuality: (metaData.document_quality as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
      pagesProcessed: metaData.pages_processed as number | null,
      extractionNotes: metaData.extraction_notes as string | null,
    },
  };
};

export async function extractFinancialDataFromPdf(
  pdfText: string
): Promise<ExtractionResult> {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error('ANTHROPIC_API_KEY is not configured');
      return {
        success: false,
        financialData: null,
        icTransactions: [],
        detectedLanguage: null,
        detectedFiscalYear: null,
        detectedCompanyName: null,
        detectedRcsNumber: null,
        confidence: 'low',
        rawText: pdfText,
        error: 'Anthropic API key is not configured',
      };
    }

    // Truncate text if too long (Claude has context limits)
    const maxTextLength = 100000;
    const truncatedText = pdfText.length > maxTextLength
      ? pdfText.substring(0, maxTextLength) + '\n\n[TEXT TRUNCATED]'
      : pdfText;

    logger.debug('Calling Anthropic API for enhanced extraction', { textLength: truncatedText.length });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: getEnhancedUserPrompt(truncatedText),
        },
      ],
    });

    logger.debug('Anthropic API response received');

    // Extract JSON from response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Try to parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        financialData: null,
        icTransactions: [],
        detectedLanguage: null,
        detectedFiscalYear: null,
        detectedCompanyName: null,
        detectedRcsNumber: null,
        confidence: 'low',
        rawText: pdfText,
        error: 'Could not parse extraction response',
      };
    }

    const extractedData = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Parse into enhanced structure
    const enhancedData = parseEnhancedResponse(extractedData);

    // Map to legacy formats for backwards compatibility
    const financialData = mapToLegacyFormat(enhancedData);
    const icTransactions = mapToICTransactions(enhancedData);

    // Extract fiscal year
    let detectedFiscalYear: number | null = null;
    if (enhancedData.companyProfile.fiscalYearEnd) {
      const yearMatch = enhancedData.companyProfile.fiscalYearEnd.match(/(\d{4})/);
      if (yearMatch) {
        detectedFiscalYear = parseInt(yearMatch[1], 10);
      }
    }

    // Map confidence
    const confidenceMap: Record<string, 'high' | 'medium' | 'low'> = {
      'HIGH': 'high',
      'MEDIUM': 'medium',
      'LOW': 'low',
    };

    return {
      success: true,
      financialData,
      icTransactions,
      detectedLanguage: enhancedData.extractionMetadata.languageDetected?.toLowerCase() || null,
      detectedFiscalYear,
      detectedCompanyName: enhancedData.companyProfile.name,
      detectedRcsNumber: enhancedData.companyProfile.rcsNumber,
      confidence: confidenceMap[enhancedData.aiAnalysis.confidenceScore] || 'medium',
      rawText: pdfText,
      enhancedData,
    };
  } catch (error) {
    logger.error('Extraction error', error);
    return {
      success: false,
      financialData: null,
      icTransactions: [],
      detectedLanguage: null,
      detectedFiscalYear: null,
      detectedCompanyName: null,
      detectedRcsNumber: null,
      confidence: 'low',
      rawText: pdfText,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
    };
  }
}

/**
 * Combined extraction using both 3-layer architecture and AI-based extraction
 *
 * This function:
 * 1. First runs the 3-layer structured extraction (anti-hallucination)
 * 2. Then runs the AI-based extraction for additional context
 * 3. Uses 3-layer results for IC values (high confidence, sourced)
 * 4. Uses AI results for supplementary data (company info, notes text, etc.)
 *
 * @param pdfText - The extracted text from the PDF
 * @returns Combined extraction result with validation
 */
export async function extractFinancialDataWithValidation(
  pdfText: string
): Promise<ExtractionResult & { luxembourgExtraction?: LuxembourgExtractionResult }> {
  logger.info('Starting combined extraction with 3-layer validation');

  // Run 3-layer structured extraction first
  const luxembourgResult = await extractLuxembourgFinancials(pdfText);

  // Run AI-based extraction for supplementary data
  const aiResult = await extractFinancialDataFromPdf(pdfText);

  // If both succeed, merge results preferring 3-layer for IC data
  if (luxembourgResult.success && aiResult.success && aiResult.financialData) {
    const legacyICData = convertToLegacyFormat(luxembourgResult);

    // Override AI-extracted IC values with validated 3-layer values
    const mergedFinancialData: ExtractedFinancialData = {
      ...aiResult.financialData,
      // Override IC financing data with 3-layer validated values
      icLoansReceivable: legacyICData.icLoansReceivable,
      icLoansPayable: legacyICData.icLoansPayable,
      interestIncomeIc: legacyICData.interestIncomeIc,
      interestExpenseIc: legacyICData.interestExpenseIc,
      spreadBps: legacyICData.spreadBps,
      netIcPosition: legacyICData.netIcPosition,
    };

    // Adjust confidence based on 3-layer validation
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (luxembourgResult.extractionQuality.confidence === 'HIGH' &&
        luxembourgResult.extractionQuality.allSourced) {
      confidence = 'high';
    } else if (luxembourgResult.extractionQuality.confidence === 'LOW' ||
               luxembourgResult.extractionQuality.hallucinationRisks.length > 0) {
      confidence = 'low';
    }

    return {
      ...aiResult,
      financialData: mergedFinancialData,
      confidence,
      luxembourgExtraction: luxembourgResult,
    };
  }

  // If 3-layer failed but AI succeeded, return AI result with warning
  if (!luxembourgResult.success && aiResult.success) {
    logger.warn('3-layer extraction failed, using AI-only results (higher hallucination risk)');
    return {
      ...aiResult,
      confidence: 'low', // Downgrade confidence since validation failed
      luxembourgExtraction: luxembourgResult,
    };
  }

  // If AI failed but 3-layer succeeded, build result from 3-layer
  if (luxembourgResult.success && !aiResult.success) {
    const legacyICData = convertToLegacyFormat(luxembourgResult);
    const summary = getICPositionSummary(luxembourgResult);

    return {
      success: true,
      financialData: {
        totalAssets: luxembourgResult.balanceSheet.totalAssets.amount,
        fixedAssets: null,
        financialFixedAssets: luxembourgResult.balanceSheet.sharesInAffiliatedUndertakings.amount,
        icLoansReceivable: legacyICData.icLoansReceivable,
        icReceivablesTrade: null,
        cashAndEquivalents: null,
        totalEquity: luxembourgResult.balanceSheet.totalEquity.amount,
        shareCapital: null,
        retainedEarnings: null,
        totalDebt: null,
        icLoansPayable: legacyICData.icLoansPayable,
        icPayablesTrade: null,
        thirdPartyDebt: null,
        turnover: luxembourgResult.profitAndLoss.netTurnover.amount,
        otherOperatingIncome: luxembourgResult.profitAndLoss.item4TotalAmount.amount,
        icRevenue: null,
        interestIncomeTotal: luxembourgResult.profitAndLoss.item10TotalInterest.amount,
        interestIncomeIc: legacyICData.interestIncomeIc,
        interestExpenseTotal: luxembourgResult.profitAndLoss.item14TotalInterest.amount,
        interestExpenseIc: legacyICData.interestExpenseIc,
        dividendIncome: luxembourgResult.profitAndLoss.item9aDividendsFromAffiliates.amount,
        managementFees: null,
        royaltyExpense: null,
        serviceFeesIc: null,
        operatingResult: null,
        financialResult: null,
        profitBeforeTax: null,
        taxExpense: null,
        netProfit: luxembourgResult.profitAndLoss.netProfitLoss.amount,
        debtToEquityRatio: null,
        icDebtToTotalDebtRatio: null,
        interestCoverageRatio: null,
        netInterestMargin: summary.impliedLendingRate,
        netIcPosition: legacyICData.netIcPosition,
        netInterestMarginEur: summary.totalICInterestIncome - summary.totalICInterestExpense,
        netInterestMarginPct: summary.impliedLendingRate,
        spreadBps: legacyICData.spreadBps,
        spreadVsBenchmark: null,
      },
      icTransactions: [],
      detectedLanguage: null,
      detectedFiscalYear: null,
      detectedCompanyName: luxembourgResult.companyInfo.name,
      detectedRcsNumber: luxembourgResult.companyInfo.rcsNumber,
      confidence: luxembourgResult.extractionQuality.confidence === 'HIGH' ? 'high' :
                  luxembourgResult.extractionQuality.confidence === 'MEDIUM' ? 'medium' : 'low',
      rawText: pdfText,
      luxembourgExtraction: luxembourgResult,
    };
  }

  // Both failed
  return {
    ...aiResult,
    luxembourgExtraction: luxembourgResult,
  };
}
