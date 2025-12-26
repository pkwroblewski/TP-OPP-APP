import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedFinancialData {
  // Balance Sheet - Assets
  totalAssets: number | null;
  fixedAssets: number | null;
  financialFixedAssets: number | null;
  icLoansReceivable: number | null;
  icReceivablesTrade: number | null;
  cashAndEquivalents: number | null;

  // Balance Sheet - Liabilities
  totalEquity: number | null;
  shareCapital: number | null;
  retainedEarnings: number | null;
  totalDebt: number | null;
  icLoansPayable: number | null;
  icPayablesTrade: number | null;
  thirdPartyDebt: number | null;

  // Income Statement
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

  // Computed Ratios
  debtToEquityRatio: number | null;
  icDebtToTotalDebtRatio: number | null;
  interestCoverageRatio: number | null;
  netInterestMargin: number | null;
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
}

// System prompt for Luxembourg GAAP annual accounts analysis
const SYSTEM_PROMPT = `You are a Luxembourg transfer pricing expert analysing annual accounts prepared under Luxembourg GAAP (Law of 19 December 2002).

You understand:
- Luxembourg balance sheet format (Bilan actif/passif)
- Luxembourg P&L format (Compte de profits et pertes)
- Luxembourg notes format (Annexe aux comptes annuels)
- Both French and English terminology

Key IC line items to find:
ASSETS:
- "Créances sur des entreprises liées" / "Amounts owed by affiliated undertakings" (both fixed and current)
- "Parts dans des entreprises liées" / "Shares in affiliated undertakings"

LIABILITIES:
- "Dettes envers des entreprises liées" / "Amounts owed to affiliated undertakings"

P&L:
- "Intérêts et produits assimilés - dont entreprises liées" / "Interest income from affiliated undertakings"
- "Intérêts et charges assimilées - dont entreprises liées" / "Interest expense to affiliated undertakings"
- "Autres charges externes" may contain management fees / "Other external charges"

NOTES - Look specifically for:
- List of affiliated undertakings with countries
- Related party transactions disclosure
- Guarantees (Engagements / Off-balance sheet)
- Any mention of "contrat de gestion", "management agreement", "cash pooling", "prêt intragroupe"

Respond ONLY with valid JSON.`;

// User prompt template for extraction
const getUserPrompt = (documentText: string): string => `Analyse this Luxembourg company annual accounts document.

DOCUMENT TEXT:
${documentText}

EXTRACT AND RETURN THIS EXACT JSON STRUCTURE:

{
  "company": {
    "name": "string or null",
    "rcs_number": "string or null - format B123456",
    "legal_form": "SA|SARL|SCS|SCA|SE|SCSp|SNC|other",
    "address": "string or null",
    "fiscal_year_end": "YYYY-MM-DD or null",
    "parent_company": "string or null",
    "parent_country": "ISO 2-letter code or null",
    "ultimate_parent": "string or null",
    "ultimate_parent_country": "ISO 2-letter code or null"
  },

  "balance_sheet": {
    "currency": "EUR",
    "total_assets": null,
    "shares_in_affiliated": null,
    "loans_to_affiliated_fixed": null,
    "loans_to_affiliated_current": null,
    "total_ic_receivables": null,
    "cash": null,
    "total_equity": null,
    "share_capital": null,
    "retained_earnings": null,
    "profit_loss_year": null,
    "total_debt": null,
    "loans_from_affiliated": null,
    "bank_debt": null,
    "trade_payables": null
  },

  "profit_loss": {
    "currency": "EUR",
    "turnover": null,
    "other_operating_income": null,
    "raw_materials": null,
    "other_external_charges": null,
    "staff_costs": null,
    "depreciation": null,
    "interest_income_total": null,
    "interest_income_affiliated": null,
    "interest_expense_total": null,
    "interest_expense_affiliated": null,
    "tax_expense": null,
    "net_profit_loss": null
  },

  "ic_transactions": [
    {
      "type": "loan_granted|loan_received|equity|management_fee|royalty|guarantee|cash_pool|service_fee|other",
      "counterparty": "string or null",
      "country": "ISO 2-letter code or null",
      "amount": null,
      "rate_if_applicable": null,
      "description": "string"
    }
  ],

  "related_parties": [
    {
      "name": "string",
      "country": "ISO 2-letter code or null",
      "relationship": "parent|subsidiary|sister|shareholder|other",
      "ownership_pct": null
    }
  ],

  "off_balance_sheet": {
    "guarantees_given": null,
    "guarantees_received": null,
    "commitments": "string or null"
  },

  "tp_indicators": {
    "has_ic_financing": false,
    "has_ic_services": false,
    "has_ic_royalties": false,
    "has_guarantees": false,
    "financing_spread_bps": null,
    "estimated_ic_volume": null,
    "red_flags": []
  },

  "extraction_metadata": {
    "confidence": "high|medium|low",
    "language_detected": "fr|en|de|mixed",
    "document_pages": null,
    "notes": "string"
  }
}

IMPORTANT RULES:
1. Use null for any value you cannot find
2. All amounts should be numbers (no currency symbols, no thousand separators)
3. For negative amounts, use negative numbers (not parentheses)
4. Calculate financing_spread_bps if both IC interest income and expense exist:
   spread = ((interest_income_affiliated/loans_to_affiliated) - (interest_expense_affiliated/loans_from_affiliated)) * 10000
5. Set has_ic_financing=true if any IC loans exist
6. Add to red_flags: "zero_spread" if spread is 0, "thin_cap" if debt/equity > 4:1`;

// Helper function to map transaction types from new format to existing format
const mapTransactionType = (type: string | undefined): string => {
  if (!type) return 'other';
  const typeMap: Record<string, string> = {
    'loan_granted': 'ic_loan_granted',
    'loan_received': 'ic_loan_received',
    'equity': 'equity_investment',
    'management_fee': 'management_fee',
    'royalty': 'royalty',
    'guarantee': 'guarantee',
    'cash_pool': 'cash_pool',
    'service_fee': 'service_fee',
    'other': 'other',
  };
  return typeMap[type] || type;
};

// Helper function to map transaction types to categories
const mapTransactionCategory = (type: string | undefined): string | null => {
  if (!type) return null;
  const categoryMap: Record<string, string> = {
    'loan_granted': 'financing',
    'loan_received': 'financing',
    'equity': 'financing',
    'guarantee': 'financing',
    'cash_pool': 'financing',
    'management_fee': 'services',
    'service_fee': 'services',
    'royalty': 'ip',
  };
  return categoryMap[type] || null;
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

    logger.debug('Calling Anthropic API for extraction', { textLength: truncatedText.length });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: getUserPrompt(truncatedText),
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

    const extractedData = JSON.parse(jsonMatch[0]);

    // Map the new JSON structure to the existing ExtractedFinancialData interface
    const balanceSheet = extractedData.balance_sheet || {};
    const profitLoss = extractedData.profit_loss || {};
    const company = extractedData.company || {};
    const extractionMeta = extractedData.extraction_metadata || {};

    // Build financialData from the new structure
    const financialData: ExtractedFinancialData = {
      // Balance Sheet - Assets
      totalAssets: balanceSheet.total_assets,
      fixedAssets: null, // Not in new structure
      financialFixedAssets: balanceSheet.shares_in_affiliated,
      icLoansReceivable: balanceSheet.total_ic_receivables ||
        ((balanceSheet.loans_to_affiliated_fixed || 0) + (balanceSheet.loans_to_affiliated_current || 0)) || null,
      icReceivablesTrade: balanceSheet.loans_to_affiliated_current,
      cashAndEquivalents: balanceSheet.cash,

      // Balance Sheet - Liabilities
      totalEquity: balanceSheet.total_equity,
      shareCapital: balanceSheet.share_capital,
      retainedEarnings: balanceSheet.retained_earnings,
      totalDebt: balanceSheet.total_debt,
      icLoansPayable: balanceSheet.loans_from_affiliated,
      icPayablesTrade: null, // Not separately tracked in new structure
      thirdPartyDebt: balanceSheet.bank_debt,

      // Income Statement
      turnover: profitLoss.turnover,
      otherOperatingIncome: profitLoss.other_operating_income,
      icRevenue: null, // Derived from IC transactions
      interestIncomeTotal: profitLoss.interest_income_total,
      interestIncomeIc: profitLoss.interest_income_affiliated,
      interestExpenseTotal: profitLoss.interest_expense_total,
      interestExpenseIc: profitLoss.interest_expense_affiliated,
      dividendIncome: null, // Not in new structure
      managementFees: null, // Extracted from IC transactions
      royaltyExpense: null, // Extracted from IC transactions
      serviceFeesIc: null, // Extracted from IC transactions
      operatingResult: null, // Not in new structure
      financialResult: null, // Not in new structure
      profitBeforeTax: null, // Not in new structure
      taxExpense: profitLoss.tax_expense,
      netProfit: profitLoss.net_profit_loss,

      // Computed Ratios - will be calculated below
      debtToEquityRatio: null,
      icDebtToTotalDebtRatio: null,
      interestCoverageRatio: null,
      netInterestMargin: null,
    };

    // Calculate derived ratios
    if (financialData.totalDebt && financialData.totalEquity && financialData.totalEquity !== 0) {
      financialData.debtToEquityRatio = financialData.totalDebt / financialData.totalEquity;
    }

    const icDebt = financialData.icLoansPayable || 0;
    if (icDebt && financialData.totalDebt && financialData.totalDebt !== 0) {
      financialData.icDebtToTotalDebtRatio = icDebt / financialData.totalDebt;
    }

    const netInterest = (financialData.interestIncomeTotal || 0) - (financialData.interestExpenseTotal || 0);
    if (financialData.totalAssets && financialData.totalAssets !== 0) {
      financialData.netInterestMargin = netInterest / financialData.totalAssets;
    }

    // Map IC transactions from new structure
    const icTransactions: ExtractedICTransaction[] = (extractedData.ic_transactions || []).map(
      (tx: {
        type?: string;
        counterparty?: string;
        country?: string;
        amount?: number;
        rate_if_applicable?: number;
        description?: string;
      }) => ({
        transactionType: mapTransactionType(tx.type),
        transactionCategory: mapTransactionCategory(tx.type),
        principalAmount: tx.amount || null,
        annualFlow: null, // Would need to be derived
        counterpartyName: tx.counterparty || null,
        counterpartyCountry: tx.country || null,
        impliedInterestRate: tx.rate_if_applicable || null,
        isCrossBorder: tx.country ? tx.country !== 'LU' : false,
        isHighValue: tx.amount ? tx.amount > 1000000 : false,
        sourceNote: tx.description || null,
      })
    );

    // Extract fiscal year from fiscal_year_end date string
    const fiscalYearEnd = company.fiscal_year_end;
    let detectedFiscalYear: number | null = null;
    if (fiscalYearEnd && typeof fiscalYearEnd === 'string') {
      const yearMatch = fiscalYearEnd.match(/(\d{4})/);
      if (yearMatch) {
        detectedFiscalYear = parseInt(yearMatch[1], 10);
      }
    }

    return {
      success: true,
      financialData,
      icTransactions,
      detectedLanguage: extractionMeta.language_detected || null,
      detectedFiscalYear,
      detectedCompanyName: company.name || null,
      detectedRcsNumber: company.rcs_number || null,
      confidence: extractionMeta.confidence || 'medium',
      rawText: pdfText,
      // Store additional data from new structure for potential future use
      _rawExtraction: extractedData,
    } as ExtractionResult;
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
