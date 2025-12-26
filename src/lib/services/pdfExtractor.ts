import Anthropic from '@anthropic-ai/sdk';

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

const EXTRACTION_PROMPT = `You are a financial data extraction expert specializing in Luxembourg annual accounts (comptes annuels).

Analyze the following text extracted from a Luxembourg company's annual accounts PDF and extract all financial data.

IMPORTANT GUIDELINES:
1. All monetary values should be in EUR (the standard for Luxembourg accounts)
2. Look for both French and English terminology
3. Pay special attention to intercompany (IC) transactions - these are key for transfer pricing analysis
4. If a value is not found, return null (not 0)
5. Look for related party disclosures and notes to the accounts

FRENCH TERMINOLOGY TO LOOK FOR:
- Bilan (Balance Sheet)
- Actif immobilisé (Fixed assets)
- Immobilisations financières (Financial fixed assets)
- Créances sur entreprises liées (Receivables from affiliated companies)
- Dettes envers entreprises liées (Payables to affiliated companies)
- Capitaux propres (Equity)
- Capital souscrit (Share capital)
- Résultats reportés (Retained earnings)
- Chiffre d'affaires (Turnover)
- Résultat d'exploitation (Operating result)
- Résultat financier (Financial result)
- Bénéfice avant impôts (Profit before tax)
- Impôts sur le résultat (Tax expense)
- Bénéfice net (Net profit)
- Produits d'intérêts (Interest income)
- Charges d'intérêts (Interest expense)
- Produits de participations (Dividend income)
- Frais de gestion (Management fees)
- Redevances (Royalties)

INTERCOMPANY TRANSACTION TYPES TO IDENTIFY:
- ic_loan_granted: Loans to affiliated companies
- ic_loan_received: Loans from affiliated companies
- management_fee: Management service fees
- royalty: Royalty payments/receipts
- guarantee: Financial guarantees
- cash_pool: Cash pooling arrangements
- service_fee: General service fees

Return your analysis as a JSON object with this exact structure:
{
  "financialData": {
    "totalAssets": <number or null>,
    "fixedAssets": <number or null>,
    "financialFixedAssets": <number or null>,
    "icLoansReceivable": <number or null>,
    "icReceivablesTrade": <number or null>,
    "cashAndEquivalents": <number or null>,
    "totalEquity": <number or null>,
    "shareCapital": <number or null>,
    "retainedEarnings": <number or null>,
    "totalDebt": <number or null>,
    "icLoansPayable": <number or null>,
    "icPayablesTrade": <number or null>,
    "thirdPartyDebt": <number or null>,
    "turnover": <number or null>,
    "otherOperatingIncome": <number or null>,
    "icRevenue": <number or null>,
    "interestIncomeTotal": <number or null>,
    "interestIncomeIc": <number or null>,
    "interestExpenseTotal": <number or null>,
    "interestExpenseIc": <number or null>,
    "dividendIncome": <number or null>,
    "managementFees": <number or null>,
    "royaltyExpense": <number or null>,
    "serviceFeesIc": <number or null>,
    "operatingResult": <number or null>,
    "financialResult": <number or null>,
    "profitBeforeTax": <number or null>,
    "taxExpense": <number or null>,
    "netProfit": <number or null>
  },
  "icTransactions": [
    {
      "transactionType": "<one of: ic_loan_granted, ic_loan_received, management_fee, royalty, guarantee, cash_pool, service_fee>",
      "transactionCategory": "<one of: financing, services, ip, goods>",
      "principalAmount": <number or null>,
      "annualFlow": <number or null>,
      "counterpartyName": "<string or null>",
      "counterpartyCountry": "<ISO country code or null>",
      "impliedInterestRate": <decimal rate or null>,
      "isCrossBorder": <boolean>,
      "isHighValue": <boolean - true if amount > 1,000,000 EUR>,
      "sourceNote": "<which note/section this was found in>"
    }
  ],
  "metadata": {
    "detectedLanguage": "<fr or en>",
    "detectedFiscalYear": <number>,
    "detectedCompanyName": "<string or null>",
    "detectedRcsNumber": "<string or null>",
    "confidence": "<high, medium, or low>"
  }
}

TEXT TO ANALYZE:
`;

export async function extractFinancialDataFromPdf(
  pdfText: string
): Promise<ExtractionResult> {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured');
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

    console.log('Calling Anthropic API for extraction...');
    console.log('Text length:', truncatedText.length);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT + truncatedText,
        },
      ],
    });

    console.log('Anthropic API response received');

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

    // Calculate derived ratios
    const financialData = extractedData.financialData as ExtractedFinancialData;
    if (financialData) {
      // Debt to Equity Ratio
      if (financialData.totalDebt && financialData.totalEquity && financialData.totalEquity !== 0) {
        financialData.debtToEquityRatio = financialData.totalDebt / financialData.totalEquity;
      }

      // IC Debt to Total Debt Ratio
      const icDebt = (financialData.icLoansPayable || 0) + (financialData.icPayablesTrade || 0);
      if (icDebt && financialData.totalDebt && financialData.totalDebt !== 0) {
        financialData.icDebtToTotalDebtRatio = icDebt / financialData.totalDebt;
      }

      // Interest Coverage Ratio
      if (financialData.operatingResult && financialData.interestExpenseTotal && financialData.interestExpenseTotal !== 0) {
        financialData.interestCoverageRatio = financialData.operatingResult / financialData.interestExpenseTotal;
      }

      // Net Interest Margin
      const netInterest = (financialData.interestIncomeTotal || 0) - (financialData.interestExpenseTotal || 0);
      if (financialData.totalAssets && financialData.totalAssets !== 0) {
        financialData.netInterestMargin = netInterest / financialData.totalAssets;
      }
    }

    return {
      success: true,
      financialData,
      icTransactions: extractedData.icTransactions || [],
      detectedLanguage: extractedData.metadata?.detectedLanguage || null,
      detectedFiscalYear: extractedData.metadata?.detectedFiscalYear || null,
      detectedCompanyName: extractedData.metadata?.detectedCompanyName || null,
      detectedRcsNumber: extractedData.metadata?.detectedRcsNumber || null,
      confidence: extractedData.metadata?.confidence || 'medium',
      rawText: pdfText,
    };
  } catch (error) {
    console.error('Extraction error:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
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
