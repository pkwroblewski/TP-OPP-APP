import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractFinancialDataWithValidation } from '@/lib/services/pdfExtractor';
import type { FinancialDataInsert, ICTransactionInsert, CompanyInsert, FilingInsert, TPAssessmentInsert } from '@/types/database';
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Parse PDF to extract text using pdf-parse v1 (stable version)
async function parsePdf(buffer: Buffer): Promise<string> {
  logger.debug('Starting PDF parsing', { bufferSize: buffer.length });

  try {
    // pdf-parse v1 uses CommonJS and a simple function API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(buffer);
    logger.debug('PDF text extracted', { textLength: data.text.length });
    return data.text;
  } catch (error) {
    logger.error('PDF parsing error', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  logger.debug('Extract API called');

  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
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

    // Get fileId or filingId from request body
    const body = await request.json();
    const { fileId, filingId } = body;

    // Support both fileId (new flow) and filingId (legacy flow)
    let uploadedFile: {
      id: string;
      file_path: string | null;
      detected_company_name: string | null;
      detected_rcs_number: string | null;
      detected_fiscal_year: number | null;
      filing_id: string | null;
      confirmed_company_id: string | null;
    } | null = null;

    let filing: {
      id: string;
      company_id: string | null;
      fiscal_year: number;
      pdf_stored_path: string | null;
      companies?: unknown;
    } | null = null;

    if (fileId) {
      // New flow: start from uploaded_files record
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('id, file_path, detected_company_name, detected_rcs_number, detected_fiscal_year, filing_id, confirmed_company_id')
        .eq('id', fileId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      uploadedFile = data;

      // If there's already a filing, use it
      if (uploadedFile.filing_id) {
        const { data: existingFiling } = await supabase
          .from('filings')
          .select('*, companies(*)')
          .eq('id', uploadedFile.filing_id)
          .single();
        filing = existingFiling;
      }
    } else if (filingId) {
      // Legacy flow: start from filings record
      const { data, error } = await supabase
        .from('filings')
        .select('*, companies(*)')
        .eq('id', filingId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Filing not found' },
          { status: 404 }
        );
      }
      filing = data;

      // Get the uploaded file record
      const { data: uf } = await supabase
        .from('uploaded_files')
        .select('id, file_path, detected_company_name, detected_rcs_number, detected_fiscal_year, filing_id, confirmed_company_id')
        .eq('filing_id', filingId)
        .single();
      uploadedFile = uf;
    } else {
      return NextResponse.json(
        { error: 'fileId or filingId is required' },
        { status: 400 }
      );
    }

    // Get file path
    const filePath = uploadedFile?.file_path || filing?.pdf_stored_path;
    if (!filePath) {
      return NextResponse.json(
        { error: 'No PDF file path found' },
        { status: 400 }
      );
    }

    // Update extraction status
    if (uploadedFile) {
      await supabase
        .from('uploaded_files')
        .update({ extraction_status: 'extracting' })
        .eq('id', uploadedFile.id);
    }
    if (filing) {
      await supabase
        .from('filings')
        .update({ extraction_status: 'extracting' })
        .eq('id', filing.id);
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('financial-accounts')
      .download(filePath);

    if (downloadError || !fileData) {
      if (uploadedFile) {
        await supabase
          .from('uploaded_files')
          .update({ extraction_status: 'failed' })
          .eq('id', uploadedFile.id);
      }
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
      if (uploadedFile) {
        await supabase
          .from('uploaded_files')
          .update({ extraction_status: 'failed' })
          .eq('id', uploadedFile.id);
      }
      return NextResponse.json(
        { error: 'Failed to parse PDF file' },
        { status: 500 }
      );
    }

    // Extract financial data using 3-layer architecture + AI
    logger.debug('Starting combined extraction with 3-layer validation', { textLength: pdfText.length });
    const extractionResult = await extractFinancialDataWithValidation(pdfText);

    logger.debug('Extraction result', {
      success: extractionResult.success,
      hasFinancialData: !!extractionResult.financialData,
      icTransactionsCount: extractionResult.icTransactions.length,
      confidence: extractionResult.confidence,
      detectedCompanyName: extractionResult.detectedCompanyName,
      detectedRcsNumber: extractionResult.detectedRcsNumber,
      // 3-layer validation results
      luxembourgExtractionSuccess: extractionResult.luxembourgExtraction?.success,
      validationConfidence: extractionResult.luxembourgExtraction?.extractionQuality?.confidence,
      tpOpportunitiesCount: extractionResult.luxembourgExtraction?.tpOpportunities?.length || 0,
      allSourced: extractionResult.luxembourgExtraction?.extractionQuality?.allSourced,
    });

    if (!extractionResult.success) {
      if (uploadedFile) {
        await supabase
          .from('uploaded_files')
          .update({ extraction_status: 'failed' })
          .eq('id', uploadedFile.id);
      }
      return NextResponse.json(
        { error: 'Failed to extract financial data', details: extractionResult.error },
        { status: 500 }
      );
    }

    // Get company and fiscal year info (from extraction or pre-existing)
    const companyName = extractionResult.detectedCompanyName || uploadedFile?.detected_company_name || 'Unknown Company';
    const rcsNumber = extractionResult.detectedRcsNumber || uploadedFile?.detected_rcs_number || null;
    const fiscalYear = extractionResult.detectedFiscalYear || uploadedFile?.detected_fiscal_year || new Date().getFullYear();

    // Create or find company if we don't have one yet
    let companyId = filing?.company_id || uploadedFile?.confirmed_company_id;

    if (!companyId && rcsNumber) {
      // Try to find existing company by RCS
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('rcs_number', rcsNumber.toUpperCase())
        .single();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // Create new company
        const companyData: CompanyInsert = {
          rcs_number: rcsNumber.toUpperCase(),
          name: companyName,
        };

        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();

        if (companyError) {
          logger.error('Company creation error', companyError);
        } else {
          companyId = newCompany.id;
        }
      }
    } else if (!companyId) {
      // No RCS number - create company with generated placeholder
      const placeholderRcs = `PENDING-${Date.now()}`;
      const companyData: CompanyInsert = {
        rcs_number: placeholderRcs,
        name: companyName,
      };

      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (companyError) {
        logger.error('Company creation error', companyError);
      } else {
        companyId = newCompany.id;
      }
    }

    // Create filing if we don't have one
    let filingIdToUse = filing?.id;
    if (!filingIdToUse && companyId) {
      const filingData: FilingInsert = {
        company_id: companyId,
        fiscal_year: fiscalYear,
        pdf_stored_path: filePath,
        extraction_status: 'extracting',
        extracted_text: pdfText.substring(0, 100000),
      };

      const { data: newFiling, error: filingError } = await supabase
        .from('filings')
        .insert(filingData)
        .select()
        .single();

      if (filingError) {
        logger.error('Filing creation error', filingError);
      } else {
        filingIdToUse = newFiling.id;
      }
    } else if (filingIdToUse) {
      // Update existing filing with extracted text
      await supabase
        .from('filings')
        .update({ extracted_text: pdfText.substring(0, 100000) })
        .eq('id', filingIdToUse);
    }

    // Save financial data
    if (extractionResult.financialData && companyId && filingIdToUse) {
      const financialDataRecord: FinancialDataInsert = {
        filing_id: filingIdToUse,
        company_id: companyId,
        fiscal_year: fiscalYear,
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
        logger.error('Failed to save financial data', financialError);
      }
    }

    // Save IC transactions from 3-layer extraction (anti-hallucination)
    // Only save verified transactions with source references
    if (companyId && filingIdToUse && extractionResult.luxembourgExtraction) {
      const lux = extractionResult.luxembourgExtraction;
      const bs = lux.balanceSheet;
      const pl = lux.profitAndLoss;
      const icTransactions: ICTransactionInsert[] = [];

      // IC Loans Provided (from balance sheet)
      const loansProvidedAmount = (bs.icLoansProvidedLongTerm?.amount || 0) +
        (bs.icLoansProvidedShortTerm?.amount || 0);
      if (loansProvidedAmount > 0) {
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'ic_loan_provided',
          transaction_category: 'financing',
          principal_amount: loansProvidedAmount,
          source_note: bs.icLoansProvidedLongTerm?.source ||
            bs.icLoansProvidedShortTerm?.source || 'Balance Sheet',
          extraction_confidence: 'high',
          is_high_value: loansProvidedAmount > 10000000,
        });
      }

      // IC Loans Received (from balance sheet)
      const loansReceivedAmount = (bs.icLoansReceivedLongTerm?.amount || 0) +
        (bs.icLoansReceivedShortTerm?.amount || 0);
      if (loansReceivedAmount > 0) {
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'ic_loan_received',
          transaction_category: 'financing',
          principal_amount: loansReceivedAmount,
          source_note: bs.icLoansReceivedLongTerm?.source ||
            bs.icLoansReceivedShortTerm?.source || 'Balance Sheet',
          extraction_confidence: 'high',
          is_high_value: loansReceivedAmount > 10000000,
        });
      }

      // IC Interest Income - Item 10a
      if (pl.item10aInterestFromAffiliates?.amount) {
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'ic_interest_income_10a',
          transaction_category: 'financing',
          annual_flow: pl.item10aInterestFromAffiliates.amount,
          source_note: pl.item10aInterestFromAffiliates.source || 'P&L Item 10a',
          extraction_confidence: 'high',
        });
      }

      // IC Interest Income - Item 11a
      if (pl.item11aInterestFromAffiliates?.amount) {
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'ic_interest_income_11a',
          transaction_category: 'financing',
          annual_flow: pl.item11aInterestFromAffiliates.amount,
          source_note: pl.item11aInterestFromAffiliates.source || 'P&L Item 11a',
          extraction_confidence: 'high',
        });
      }

      // IC Interest Expense - Item 14a
      if (pl.item14aInterestToAffiliates?.amount) {
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'ic_interest_expense_14a',
          transaction_category: 'financing',
          annual_flow: Math.abs(pl.item14aInterestToAffiliates.amount),
          source_note: pl.item14aInterestToAffiliates.source || 'P&L Item 14a',
          extraction_confidence: 'high',
        });
      }

      // IC Dividend Income - Item 9a
      if (pl.item9aDividendsFromAffiliates?.amount) {
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'ic_dividend_income',
          transaction_category: 'dividends',
          annual_flow: pl.item9aDividendsFromAffiliates.amount,
          source_note: pl.item9aDividendsFromAffiliates.source || 'P&L Item 9a',
          extraction_confidence: 'high',
        });
      }

      // Item 4 Other Operating Income - ONLY if note is accessible
      // Mark as unverified if we can't confirm IC nature
      if (pl.item4TotalAmount?.amount && pl.item4TotalAmount.amount > 0) {
        const hasWarning = lux.validation?.warnings?.some(
          w => w.field.includes('item4')
        );
        icTransactions.push({
          company_id: companyId,
          filing_id: filingIdToUse,
          fiscal_year: fiscalYear,
          transaction_type: 'other_operating_income',
          transaction_category: 'services',
          annual_flow: pl.item4TotalAmount.amount,
          source_note: hasWarning
            ? 'P&L Item 4 - UNVERIFIED: Note not accessible'
            : pl.item4TotalAmount.source || 'P&L Item 4',
          extraction_confidence: hasWarning ? 'low' : 'medium',
          is_rate_anomaly: hasWarning,
        });
      }

      if (icTransactions.length > 0) {
        const { error: txError } = await supabase
          .from('ic_transactions')
          .insert(icTransactions);

        if (txError) {
          logger.error('Failed to save IC transactions', txError);
        }
      }
    }

    // Create TP Assessment with risk levels
    const riskIndicators = extractionResult.enhancedData?.riskIndicators;
    const aiAnalysis = extractionResult.enhancedData?.aiAnalysis;
    if (companyId && fiscalYear) {
      const assessmentData: TPAssessmentInsert = {
        company_id: companyId,
        fiscal_year: fiscalYear,
        ic_risk_level: riskIndicators?.icRisk?.level || null,
        ic_risk_reasons: riskIndicators?.icRisk?.reasons || [],
        tp_risk_level: riskIndicators?.tpRisk?.level || null,
        tp_risk_reasons: riskIndicators?.tpRisk?.reasons || [],
        doc_risk_level: riskIndicators?.docRisk?.level || null,
        doc_risk_reasons: riskIndicators?.docRisk?.reasons || [],
        ai_summary: aiAnalysis?.executiveSummary || null,
        recommended_services: aiAnalysis?.recommendedServices || [],
        outreach_angle: aiAnalysis?.outreachAngle || null,
        engagement_estimate_low: aiAnalysis?.engagementEstimateEur?.low || null,
        engagement_estimate_high: aiAnalysis?.engagementEstimateEur?.high || null,
        estimated_ic_volume: (extractionResult.financialData?.icLoansReceivable || 0) + (extractionResult.financialData?.icLoansPayable || 0),
      };

      const { error: assessmentError } = await supabase
        .from('tp_assessments')
        .insert(assessmentData);

      if (assessmentError) {
        logger.error('Failed to save TP assessment', assessmentError);
      }
    }

    // Update uploaded file with final status
    if (uploadedFile) {
      await supabase
        .from('uploaded_files')
        .update({
          extraction_status: 'completed',
          detected_company_name: companyName,
          detected_rcs_number: rcsNumber,
          detected_fiscal_year: fiscalYear,
          detected_language: extractionResult.detectedLanguage,
          detection_confidence: extractionResult.confidence,
          filing_id: filingIdToUse,
          confirmed_company_id: companyId,
        })
        .eq('id', uploadedFile.id);
    }

    // Update filing status with enhanced extraction data
    if (filingIdToUse) {
      const updateData: Record<string, unknown> = {
        extraction_status: 'completed'
      };

      // Save Luxembourg 3-layer extraction validation data
      if (extractionResult.luxembourgExtraction) {
        const lux = extractionResult.luxembourgExtraction;
        updateData.enhanced_extraction = {
          success: lux.success,
          extractionQuality: lux.extractionQuality,
          validation: {
            isValid: lux.validation?.isValid ?? true,
            errors: lux.validation?.errors || [],
            warnings: lux.validation?.warnings || [],
            flags: lux.tpOpportunities || [],  // Frontend expects 'flags'
            qualityMetrics: lux.extractionQuality,
          },
          tpOpportunities: lux.tpOpportunities || [],
          balanceSheet: lux.balanceSheet,
          profitAndLoss: lux.profitAndLoss,
          companyInfo: lux.companyInfo,
        };
      }

      await supabase
        .from('filings')
        .update(updateData)
        .eq('id', filingIdToUse);
    }

    // Mark company as part of group if IC transactions detected
    if (extractionResult.icTransactions.length > 0 && companyId) {
      await supabase
        .from('companies')
        .update({ is_part_of_group: true })
        .eq('id', companyId);
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: uploadedFile?.id,
        filingId: filingIdToUse,
        companyId,
        financialDataExtracted: !!extractionResult.financialData,
        icTransactionsCount: extractionResult.icTransactions.length,
        confidence: extractionResult.confidence,
        detectedCompanyName: companyName,
        detectedRcsNumber: rcsNumber,
        detectedFiscalYear: fiscalYear,
      },
    });
  } catch (error) {
    logger.error('Extraction error', error);
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
    const fileId = searchParams.get('fileId');

    if (!filingId && !fileId) {
      return NextResponse.json(
        { error: 'filingId or fileId is required' },
        { status: 400 }
      );
    }

    if (fileId) {
      const { data: uploadedFile, error } = await supabase
        .from('uploaded_files')
        .select('id, extraction_status, detected_company_name, detected_rcs_number, detected_fiscal_year, confirmed_company_id')
        .eq('id', fileId)
        .single();

      if (error || !uploadedFile) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          fileId: uploadedFile.id,
          status: uploadedFile.extraction_status,
          companyId: uploadedFile.confirmed_company_id,
          detectedCompanyName: uploadedFile.detected_company_name,
          detectedRcsNumber: uploadedFile.detected_rcs_number,
          detectedFiscalYear: uploadedFile.detected_fiscal_year,
        },
      });
    }

    // At this point, we know filingId is not null because:
    // - We returned early if both filingId and fileId were null
    // - We returned inside the fileId block if fileId was provided
    const { data: filing, error: filingError } = await supabase
      .from('filings')
      .select('id, extraction_status, fiscal_year')
      .eq('id', filingId!)
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
      .eq('filing_id', filingId!);

    const { count: icTransactionsCount } = await supabase
      .from('ic_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('filing_id', filingId!);

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
    logger.error('Status check error', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
