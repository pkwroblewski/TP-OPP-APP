import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractFinancialDataFromPdf } from '@/lib/services/pdfExtractor';
import type { FinancialDataInsert, ICTransactionInsert } from '@/types/database';
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// Parse PDF to extract text using pdf-parse v1 (stable version)
async function parsePdf(buffer: Buffer): Promise<string> {
  console.log('Starting PDF parsing, buffer size:', buffer.length);

  try {
    // pdf-parse v1 uses CommonJS and a simple function API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(buffer);
    console.log('PDF text extracted, length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    if (error instanceof Error) {
      console.error('PDF parse error name:', error.name);
      console.error('PDF parse error message:', error.message);
      console.error('PDF parse error stack:', error.stack);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('=== Extract API called ===');

  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
    console.log('Client ID:', clientId);
    const { allowed, resetTime } = checkRateLimit(
      `${clientId}:extract`,
      RATE_LIMITS.extract
    );

    if (!allowed) {
      return rateLimitResponse(resetTime);
    }

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get filing ID from request body
    const body = await request.json();
    const { filingId } = body;

    if (!filingId) {
      return NextResponse.json(
        { error: 'Filing ID is required' },
        { status: 400 }
      );
    }

    // Get filing details
    const { data: filing, error: filingError } = await supabase
      .from('filings')
      .select('*, companies(*)')
      .eq('id', filingId)
      .single();

    if (filingError || !filing) {
      return NextResponse.json(
        { error: 'Filing not found' },
        { status: 404 }
      );
    }

    if (!filing.pdf_stored_path) {
      return NextResponse.json(
        { error: 'No PDF file associated with this filing' },
        { status: 400 }
      );
    }

    // Update filing status to extracting
    await supabase
      .from('filings')
      .update({ extraction_status: 'extracting' })
      .eq('id', filingId);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('financial-accounts')
      .download(filing.pdf_stored_path);

    if (downloadError || !fileData) {
      await supabase
        .from('filings')
        .update({ extraction_status: 'failed' })
        .eq('id', filingId);

      return NextResponse.json(
        { error: 'Failed to download PDF file', details: downloadError?.message },
        { status: 500 }
      );
    }

    // Parse PDF to extract text
    const buffer = Buffer.from(await fileData.arrayBuffer());
    let pdfText: string;

    try {
      pdfText = await parsePdf(buffer);
    } catch {
      await supabase
        .from('filings')
        .update({ extraction_status: 'failed' })
        .eq('id', filingId);

      return NextResponse.json(
        { error: 'Failed to parse PDF file' },
        { status: 500 }
      );
    }

    // Update filing with extracted text
    await supabase
      .from('filings')
      .update({ extracted_text: pdfText.substring(0, 100000) }) // Limit stored text
      .eq('id', filingId);

    // Extract financial data using AI
    console.log('Starting AI extraction for filing:', filingId);
    console.log('PDF text length:', pdfText.length);

    const extractionResult = await extractFinancialDataFromPdf(pdfText);

    console.log('Extraction result:', {
      success: extractionResult.success,
      hasFinancialData: !!extractionResult.financialData,
      icTransactionsCount: extractionResult.icTransactions.length,
      confidence: extractionResult.confidence,
      error: extractionResult.error,
    });

    if (!extractionResult.success || !extractionResult.financialData) {
      console.error('Extraction failed for filing:', filingId, 'Error:', extractionResult.error);

      await supabase
        .from('filings')
        .update({ extraction_status: 'failed' })
        .eq('id', filingId);

      return NextResponse.json(
        {
          error: 'Failed to extract financial data',
          details: extractionResult.error
        },
        { status: 500 }
      );
    }

    // Save financial data to database
    const financialDataRecord: FinancialDataInsert = {
      filing_id: filingId,
      company_id: filing.company_id,
      fiscal_year: filing.fiscal_year,
      total_assets: extractionResult.financialData.totalAssets,
      fixed_assets: extractionResult.financialData.fixedAssets,
      financial_fixed_assets: extractionResult.financialData.financialFixedAssets,
      ic_loans_receivable: extractionResult.financialData.icLoansReceivable,
      ic_receivables_trade: extractionResult.financialData.icReceivablesTrade,
      cash_and_equivalents: extractionResult.financialData.cashAndEquivalents,
      total_equity: extractionResult.financialData.totalEquity,
      share_capital: extractionResult.financialData.shareCapital,
      retained_earnings: extractionResult.financialData.retainedEarnings,
      total_debt: extractionResult.financialData.totalDebt,
      ic_loans_payable: extractionResult.financialData.icLoansPayable,
      ic_payables_trade: extractionResult.financialData.icPayablesTrade,
      third_party_debt: extractionResult.financialData.thirdPartyDebt,
      turnover: extractionResult.financialData.turnover,
      other_operating_income: extractionResult.financialData.otherOperatingIncome,
      ic_revenue: extractionResult.financialData.icRevenue,
      interest_income_total: extractionResult.financialData.interestIncomeTotal,
      interest_income_ic: extractionResult.financialData.interestIncomeIc,
      interest_expense_total: extractionResult.financialData.interestExpenseTotal,
      interest_expense_ic: extractionResult.financialData.interestExpenseIc,
      dividend_income: extractionResult.financialData.dividendIncome,
      management_fees: extractionResult.financialData.managementFees,
      royalty_expense: extractionResult.financialData.royaltyExpense,
      service_fees_ic: extractionResult.financialData.serviceFeesIc,
      operating_result: extractionResult.financialData.operatingResult,
      financial_result: extractionResult.financialData.financialResult,
      profit_before_tax: extractionResult.financialData.profitBeforeTax,
      tax_expense: extractionResult.financialData.taxExpense,
      net_profit: extractionResult.financialData.netProfit,
      debt_to_equity_ratio: extractionResult.financialData.debtToEquityRatio,
      ic_debt_to_total_debt_ratio: extractionResult.financialData.icDebtToTotalDebtRatio,
      interest_coverage_ratio: extractionResult.financialData.interestCoverageRatio,
      net_interest_margin: extractionResult.financialData.netInterestMargin,
    };

    const { error: financialError } = await supabase
      .from('financial_data')
      .insert(financialDataRecord);

    if (financialError) {
      console.error('Failed to save financial data:', financialError);
    }

    // Save IC transactions
    if (extractionResult.icTransactions.length > 0) {
      const icTransactions: ICTransactionInsert[] = extractionResult.icTransactions.map((tx) => ({
        company_id: filing.company_id,
        filing_id: filingId,
        fiscal_year: filing.fiscal_year,
        transaction_type: tx.transactionType,
        transaction_category: tx.transactionCategory,
        principal_amount: tx.principalAmount,
        annual_flow: tx.annualFlow,
        counterparty_name: tx.counterpartyName,
        counterparty_country: tx.counterpartyCountry,
        implied_interest_rate: tx.impliedInterestRate,
        is_cross_border: tx.isCrossBorder,
        is_high_value: tx.isHighValue,
        source_note: tx.sourceNote,
        extraction_confidence: extractionResult.confidence,
      }));

      const { error: txError } = await supabase
        .from('ic_transactions')
        .insert(icTransactions);

      if (txError) {
        console.error('Failed to save IC transactions:', txError);
      }
    }

    // Update uploaded file with detection results
    const { data: uploadedFile } = await supabase
      .from('uploaded_files')
      .select('id')
      .eq('filing_id', filingId)
      .single();

    if (uploadedFile) {
      await supabase
        .from('uploaded_files')
        .update({
          extraction_status: 'completed',
          detected_company_name: extractionResult.detectedCompanyName,
          detected_rcs_number: extractionResult.detectedRcsNumber,
          detected_fiscal_year: extractionResult.detectedFiscalYear,
          detected_language: extractionResult.detectedLanguage,
          detection_confidence: extractionResult.confidence,
        })
        .eq('id', uploadedFile.id);
    }

    // Update filing status to completed
    await supabase
      .from('filings')
      .update({ extraction_status: 'completed' })
      .eq('id', filingId);

    // Update company if IC transactions detected (mark as part of group)
    if (extractionResult.icTransactions.length > 0 && filing.companies && filing.company_id) {
      const companies = filing.companies as { is_part_of_group?: boolean };
      if (!companies.is_part_of_group) {
        await supabase
          .from('companies')
          .update({ is_part_of_group: true })
          .eq('id', filing.company_id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        filingId,
        financialDataExtracted: !!extractionResult.financialData,
        icTransactionsCount: extractionResult.icTransactions.length,
        confidence: extractionResult.confidence,
        detectedCompanyName: extractionResult.detectedCompanyName,
        detectedFiscalYear: extractionResult.detectedFiscalYear,
      },
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during extraction' },
      { status: 500 }
    );
  }
}

// GET endpoint to check extraction status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filingId = searchParams.get('filingId');

    if (!filingId) {
      return NextResponse.json(
        { error: 'Filing ID is required' },
        { status: 400 }
      );
    }

    const { data: filing, error: filingError } = await supabase
      .from('filings')
      .select('id, extraction_status, fiscal_year')
      .eq('id', filingId)
      .single();

    if (filingError || !filing) {
      return NextResponse.json(
        { error: 'Filing not found' },
        { status: 404 }
      );
    }

    // Get related data counts
    const { count: financialDataCount } = await supabase
      .from('financial_data')
      .select('*', { count: 'exact', head: true })
      .eq('filing_id', filingId);

    const { count: icTransactionsCount } = await supabase
      .from('ic_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('filing_id', filingId);

    return NextResponse.json({
      success: true,
      data: {
        filingId: filing.id,
        status: filing.extraction_status,
        fiscalYear: filing.fiscal_year,
        hasFinancialData: (financialDataCount || 0) > 0,
        icTransactionsCount: icTransactionsCount || 0,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
