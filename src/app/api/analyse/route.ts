import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTPOpportunity, type TPAnalysisInput } from '@/lib/services/tpAnalyser';
import type { FinancialData, ICTransaction } from '@/types/database';
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const { allowed, resetTime } = checkRateLimit(
      `${clientId}:analyse`,
      RATE_LIMITS.analyse
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

    // Get company ID and fiscal year from request body
    const body = await request.json();
    const { companyId, fiscalYear } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Determine fiscal year to analyze (default to most recent)
    let targetFiscalYear = fiscalYear;
    if (!targetFiscalYear) {
      const { data: latestFiling } = await supabase
        .from('filings')
        .select('fiscal_year')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: false })
        .limit(1)
        .single();

      targetFiscalYear = latestFiling?.fiscal_year || new Date().getFullYear() - 1;
    }

    // Get financial data for the fiscal year
    const { data: financialData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('company_id', companyId)
      .eq('fiscal_year', targetFiscalYear)
      .single();

    // Get IC transactions for the fiscal year
    const { data: icTransactions } = await supabase
      .from('ic_transactions')
      .select('*')
      .eq('company_id', companyId)
      .eq('fiscal_year', targetFiscalYear);

    // Prepare analysis input
    const analysisInput: TPAnalysisInput = {
      companyId,
      fiscalYear: targetFiscalYear,
      companyName: company.name,
      legalForm: company.legal_form,
      isPartOfGroup: company.is_part_of_group || false,
      parentCompanyName: company.parent_company_name,
      parentCountry: company.parent_country_code,
      financialData: financialData as FinancialData | null,
      icTransactions: (icTransactions || []) as ICTransaction[],
    };

    // Run TP analysis
    const result = await analyzeTPOpportunity(analysisInput);

    if (!result.success || !result.assessment) {
      return NextResponse.json(
        {
          error: 'Analysis failed',
          details: result.error
        },
        { status: 500 }
      );
    }

    // Check if assessment already exists for this company/year
    const { data: existingAssessment } = await supabase
      .from('tp_assessments')
      .select('id')
      .eq('company_id', companyId)
      .eq('fiscal_year', targetFiscalYear)
      .single();

    let savedAssessment;
    if (existingAssessment) {
      // Update existing assessment
      const { data, error } = await supabase
        .from('tp_assessments')
        .update({
          ...result.assessment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAssessment.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update assessment:', error);
        return NextResponse.json(
          { error: 'Failed to save assessment', details: error.message },
          { status: 500 }
        );
      }
      savedAssessment = data;
    } else {
      // Insert new assessment
      const { data, error } = await supabase
        .from('tp_assessments')
        .insert(result.assessment)
        .select()
        .single();

      if (error) {
        console.error('Failed to insert assessment:', error);
        return NextResponse.json(
          { error: 'Failed to save assessment', details: error.message },
          { status: 500 }
        );
      }
      savedAssessment = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: savedAssessment.id,
        companyId,
        fiscalYear: targetFiscalYear,
        totalScore: result.assessment.total_score,
        priorityTier: result.assessment.priority_tier,
        financingRiskScore: result.assessment.financing_risk_score,
        servicesRiskScore: result.assessment.services_risk_score,
        documentationRiskScore: result.assessment.documentation_risk_score,
        summary: result.assessment.ai_summary,
        keyFindings: result.assessment.ai_key_findings,
        recommendedApproach: result.assessment.ai_recommended_approach,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during analysis' },
      { status: 500 }
    );
  }
}

// Batch analysis endpoint - analyze multiple companies
export async function PUT(request: NextRequest) {
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

    // Get company IDs from request body
    const body = await request.json();
    const { companyIds, fiscalYear } = body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json(
        { error: 'Company IDs array is required' },
        { status: 400 }
      );
    }

    // Limit batch size
    const maxBatchSize = 10;
    if (companyIds.length > maxBatchSize) {
      return NextResponse.json(
        { error: `Maximum batch size is ${maxBatchSize} companies` },
        { status: 400 }
      );
    }

    const results: Array<{
      companyId: string;
      success: boolean;
      totalScore?: number;
      priorityTier?: string;
      error?: string;
    }> = [];

    // Process each company
    for (const companyId of companyIds) {
      try {
        // Get company details
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError || !company) {
          results.push({
            companyId,
            success: false,
            error: 'Company not found',
          });
          continue;
        }

        // Determine fiscal year
        let targetFiscalYear = fiscalYear;
        if (!targetFiscalYear) {
          const { data: latestFiling } = await supabase
            .from('filings')
            .select('fiscal_year')
            .eq('company_id', companyId)
            .order('fiscal_year', { ascending: false })
            .limit(1)
            .single();

          targetFiscalYear = latestFiling?.fiscal_year || new Date().getFullYear() - 1;
        }

        // Get financial data
        const { data: financialData } = await supabase
          .from('financial_data')
          .select('*')
          .eq('company_id', companyId)
          .eq('fiscal_year', targetFiscalYear)
          .single();

        // Get IC transactions
        const { data: icTransactions } = await supabase
          .from('ic_transactions')
          .select('*')
          .eq('company_id', companyId)
          .eq('fiscal_year', targetFiscalYear);

        // Prepare and run analysis
        const analysisInput: TPAnalysisInput = {
          companyId,
          fiscalYear: targetFiscalYear,
          companyName: company.name,
          legalForm: company.legal_form,
          isPartOfGroup: company.is_part_of_group || false,
          parentCompanyName: company.parent_company_name,
          parentCountry: company.parent_country_code,
          financialData: financialData as FinancialData | null,
          icTransactions: (icTransactions || []) as ICTransaction[],
        };

        const result = await analyzeTPOpportunity(analysisInput);

        if (!result.success || !result.assessment) {
          results.push({
            companyId,
            success: false,
            error: result.error || 'Analysis failed',
          });
          continue;
        }

        // Save assessment
        const { data: existingAssessment } = await supabase
          .from('tp_assessments')
          .select('id')
          .eq('company_id', companyId)
          .eq('fiscal_year', targetFiscalYear)
          .single();

        if (existingAssessment) {
          await supabase
            .from('tp_assessments')
            .update({
              ...result.assessment,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingAssessment.id);
        } else {
          await supabase
            .from('tp_assessments')
            .insert(result.assessment);
        }

        results.push({
          companyId,
          success: true,
          totalScore: result.assessment.total_score ?? undefined,
          priorityTier: result.assessment.priority_tier ?? undefined,
        });
      } catch (err) {
        results.push({
          companyId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      data: {
        total: companyIds.length,
        successful: successCount,
        failed: companyIds.length - successCount,
        results,
      },
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during batch analysis' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve assessment for a company
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
    const companyId = searchParams.get('companyId');
    const fiscalYear = searchParams.get('fiscalYear');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('tp_assessments')
      .select('*')
      .eq('company_id', companyId);

    if (fiscalYear) {
      query = query.eq('fiscal_year', parseInt(fiscalYear));
    } else {
      // Get most recent if no fiscal year specified
      query = query.order('fiscal_year', { ascending: false }).limit(1);
    }

    const { data: assessment, error: assessmentError } = await query.single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
