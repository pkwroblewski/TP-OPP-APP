import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to convert data to CSV
function convertToCSV(data: Record<string, unknown>[], columns: string[]): string {
  if (data.length === 0) return '';

  // Headers
  const headers = columns.join(',');

  // Rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

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
    const exportType = searchParams.get('type') || 'companies';
    const format = searchParams.get('format') || 'csv';
    const fiscalYear = searchParams.get('fiscalYear');
    const priorityTier = searchParams.get('priorityTier');

    let data: Record<string, unknown>[] = [];
    let columns: string[] = [];
    let filename = '';

    switch (exportType) {
      case 'companies': {
        const { data: companies, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (error) throw error;

        data = companies || [];
        columns = [
          'id',
          'rcs_number',
          'name',
          'legal_form',
          'registered_address',
          'incorporation_date',
          'nace_code',
          'is_part_of_group',
          'parent_company_name',
          'parent_country_code',
          'ultimate_parent_name',
          'ultimate_parent_country',
          'last_filing_date',
          'created_at',
        ];
        filename = `companies_export_${new Date().toISOString().split('T')[0]}`;
        break;
      }

      case 'assessments': {
        let query = supabase
          .from('tp_assessments')
          .select(`
            *,
            companies (name, rcs_number)
          `)
          .order('total_score', { ascending: false });

        if (fiscalYear) {
          query = query.eq('fiscal_year', parseInt(fiscalYear));
        }
        if (priorityTier) {
          query = query.eq('priority_tier', priorityTier);
        }

        const { data: assessments, error } = await query;

        if (error) throw error;

        // Flatten the data
        data = (assessments || []).map((a) => ({
          ...a,
          company_name: (a.companies as { name: string } | null)?.name || '',
          rcs_number: (a.companies as { rcs_number: string } | null)?.rcs_number || '',
          companies: undefined, // Remove nested object
        }));

        columns = [
          'id',
          'company_name',
          'rcs_number',
          'fiscal_year',
          'total_score',
          'priority_tier',
          'financing_risk_score',
          'services_risk_score',
          'documentation_risk_score',
          'materiality_score',
          'complexity_score',
          'has_ic_financing',
          'has_ic_services',
          'has_ic_royalties',
          'has_cross_border_ic',
          'has_thin_cap_indicators',
          'has_rate_anomalies',
          'likely_needs_local_file',
          'likely_needs_master_file',
          'estimated_ic_volume',
          'outreach_status',
          'ai_summary',
          'ai_recommended_approach',
          'created_at',
        ];
        filename = `assessments_export_${new Date().toISOString().split('T')[0]}`;
        break;
      }

      case 'transactions': {
        let query = supabase
          .from('ic_transactions')
          .select(`
            *,
            companies (name, rcs_number)
          `)
          .order('principal_amount', { ascending: false });

        if (fiscalYear) {
          query = query.eq('fiscal_year', parseInt(fiscalYear));
        }

        const { data: transactions, error } = await query;

        if (error) throw error;

        // Flatten the data
        data = (transactions || []).map((t) => ({
          ...t,
          company_name: (t.companies as { name: string } | null)?.name || '',
          rcs_number: (t.companies as { rcs_number: string } | null)?.rcs_number || '',
          companies: undefined,
        }));

        columns = [
          'id',
          'company_name',
          'rcs_number',
          'fiscal_year',
          'transaction_type',
          'transaction_category',
          'principal_amount',
          'annual_flow',
          'counterparty_name',
          'counterparty_country',
          'implied_interest_rate',
          'is_cross_border',
          'is_high_value',
          'is_rate_anomaly',
          'source_note',
          'extraction_confidence',
          'created_at',
        ];
        filename = `ic_transactions_export_${new Date().toISOString().split('T')[0]}`;
        break;
      }

      case 'financial': {
        let query = supabase
          .from('financial_data')
          .select(`
            *,
            companies (name, rcs_number)
          `)
          .order('fiscal_year', { ascending: false });

        if (fiscalYear) {
          query = query.eq('fiscal_year', parseInt(fiscalYear));
        }

        const { data: financials, error } = await query;

        if (error) throw error;

        // Flatten the data
        data = (financials || []).map((f) => ({
          ...f,
          company_name: (f.companies as { name: string } | null)?.name || '',
          rcs_number: (f.companies as { rcs_number: string } | null)?.rcs_number || '',
          companies: undefined,
        }));

        columns = [
          'id',
          'company_name',
          'rcs_number',
          'fiscal_year',
          'total_assets',
          'fixed_assets',
          'financial_fixed_assets',
          'ic_loans_receivable',
          'ic_receivables_trade',
          'cash_and_equivalents',
          'total_equity',
          'share_capital',
          'retained_earnings',
          'total_debt',
          'ic_loans_payable',
          'ic_payables_trade',
          'third_party_debt',
          'turnover',
          'other_operating_income',
          'ic_revenue',
          'interest_income_total',
          'interest_income_ic',
          'interest_expense_total',
          'interest_expense_ic',
          'dividend_income',
          'management_fees',
          'royalty_expense',
          'service_fees_ic',
          'operating_result',
          'financial_result',
          'profit_before_tax',
          'tax_expense',
          'net_profit',
          'debt_to_equity_ratio',
          'ic_debt_to_total_debt_ratio',
          'interest_coverage_ratio',
          'net_interest_margin',
          'created_at',
        ];
        filename = `financial_data_export_${new Date().toISOString().split('T')[0]}`;
        break;
      }

      case 'pipeline': {
        // Export opportunities pipeline with key fields
        let query = supabase
          .from('tp_assessments')
          .select(`
            *,
            companies (name, rcs_number, parent_company_name, parent_country_code)
          `)
          .order('total_score', { ascending: false });

        if (fiscalYear) {
          query = query.eq('fiscal_year', parseInt(fiscalYear));
        }
        if (priorityTier) {
          query = query.eq('priority_tier', priorityTier);
        }

        const { data: pipeline, error } = await query;

        if (error) throw error;

        // Flatten for pipeline view
        data = (pipeline || []).map((p) => {
          const company = p.companies as {
            name: string;
            rcs_number: string;
            parent_company_name: string | null;
            parent_country_code: string | null;
          } | null;

          return {
            company_name: company?.name || '',
            rcs_number: company?.rcs_number || '',
            parent_company: company?.parent_company_name || '',
            parent_country: company?.parent_country_code || '',
            fiscal_year: p.fiscal_year,
            priority_tier: p.priority_tier,
            total_score: p.total_score,
            financing_risk: p.financing_risk_score,
            services_risk: p.services_risk_score,
            documentation_risk: p.documentation_risk_score,
            estimated_ic_volume: p.estimated_ic_volume,
            has_ic_financing: p.has_ic_financing ? 'Yes' : 'No',
            has_ic_services: p.has_ic_services ? 'Yes' : 'No',
            has_cross_border: p.has_cross_border_ic ? 'Yes' : 'No',
            thin_cap_indicators: p.has_thin_cap_indicators ? 'Yes' : 'No',
            needs_local_file: p.likely_needs_local_file ? 'Yes' : 'No',
            needs_master_file: p.likely_needs_master_file ? 'Yes' : 'No',
            outreach_status: p.outreach_status,
            summary: p.ai_summary,
            recommended_approach: p.ai_recommended_approach,
            outreach_notes: p.outreach_notes,
          };
        });

        columns = [
          'company_name',
          'rcs_number',
          'parent_company',
          'parent_country',
          'fiscal_year',
          'priority_tier',
          'total_score',
          'financing_risk',
          'services_risk',
          'documentation_risk',
          'estimated_ic_volume',
          'has_ic_financing',
          'has_ic_services',
          'has_cross_border',
          'thin_cap_indicators',
          'needs_local_file',
          'needs_master_file',
          'outreach_status',
          'summary',
          'recommended_approach',
          'outreach_notes',
        ];
        filename = `opportunity_pipeline_${new Date().toISOString().split('T')[0]}`;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        count: data.length,
        data,
      });
    }

    // Default to CSV
    const csv = convertToCSV(data, columns);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'An error occurred during export' },
      { status: 500 }
    );
  }
}
