import { createClient } from '@supabase/supabase-js';

// Load environment variables inline since dotenv may not be installed
const supabaseUrl = 'https://kgjfjryvwhdxhtvlellr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnamZqcnl2d2hkeGh0dmxlbGxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4NjQ2MCwiZXhwIjoyMDgyMjYyNDYwfQ.Vima2vsaVyInY_vmhJHH5bF9rJtRuNwnTA6MftfLDZM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyExtraction() {
  console.log('='.repeat(80));
  console.log('EXTRACTION VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  // Get most recent filing
  const { data: filing, error } = await supabase
    .from('filings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !filing) {
    console.error('❌ No filing found. Please upload APERAM PDF first.');
    process.exit(1);
  }

  console.log('Filing Details:');
  console.log(`  ID: ${filing.id}`);
  console.log(`  Fiscal Year: ${filing.fiscal_year}`);
  console.log(`  Status: ${filing.extraction_status}`);
  console.log(`  Created: ${filing.created_at}`);
  console.log();

  // Check enhanced_extraction
  if (!filing.enhanced_extraction) {
    console.log('⚠️  enhanced_extraction is NULL');
    console.log('   This could mean:');
    console.log('   - Extraction is still in progress (status: extracting)');
    console.log('   - Extraction failed');
    console.log('   - enhanced_extraction is not being populated by the extractor');
    console.log();

    // Check if there's financial_data instead
    const { data: financialData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('filing_id', filing.id)
      .single();

    if (financialData) {
      console.log('✅ financial_data exists - extraction worked but enhanced_extraction not populated');
      console.log();
      console.log('Financial Data Summary:');
      console.log(`  IC Loans Receivable: EUR ${financialData.ic_loans_receivable ? (financialData.ic_loans_receivable / 1e6).toFixed(1) : '?'}M`);
      console.log(`  IC Loans Payable: EUR ${financialData.ic_loans_payable ? (financialData.ic_loans_payable / 1e6).toFixed(1) : '?'}M`);
      console.log(`  IC Interest Income: EUR ${financialData.interest_income_ic ? (financialData.interest_income_ic / 1e6).toFixed(1) : '?'}M`);
      console.log(`  IC Interest Expense: EUR ${financialData.interest_expense_ic ? (Math.abs(financialData.interest_expense_ic) / 1e6).toFixed(1) : '?'}M`);
      console.log(`  Other Operating Income: EUR ${financialData.other_operating_income ? (financialData.other_operating_income / 1e6).toFixed(1) : '?'}M`);
    }

    process.exit(0);
  }

  console.log('✅ enhanced_extraction exists');
  console.log();

  const enhanced = filing.enhanced_extraction as Record<string, unknown>;
  console.log('Keys in enhanced_extraction:', Object.keys(enhanced));
  console.log();

  // Check validation warnings
  console.log('Validation Warnings:');
  const validation = enhanced.validation as Record<string, unknown> | undefined;
  const warnings = validation?.warnings as Array<Record<string, unknown>> | undefined;
  if (warnings && warnings.length > 0) {
    console.log(`  ✅ Found ${warnings.length} warning(s):`);
    warnings.forEach((w, i) => {
      console.log(`    ${i + 1}. ${w.field}: ${w.issue}`);
      console.log(`       ${w.details}`);
    });
  } else {
    console.log('  ⚠️  No warnings found');
  }
  console.log();

  // Check TP opportunities (could be in validation.flags or tpOpportunities)
  console.log('TP Opportunities:');
  const flags = validation?.flags as Array<Record<string, unknown>> | undefined;
  const tpOpportunities = enhanced.tpOpportunities as Array<Record<string, unknown>> | undefined;
  const tpFlags = flags || tpOpportunities || [];

  if (tpFlags.length > 0) {
    console.log(`  ✅ Found ${tpFlags.length} TP flag(s):`);
    tpFlags.forEach((f, i) => {
      console.log(`    ${i + 1}. ${f.priority}: ${f.type}`);
      console.log(`       ${f.description}`);
      console.log(`       ${f.estimatedValue}`);
    });
  } else {
    console.log('  ⚠️  No TP flags found');
  }
  console.log();

  // Check balance sheet data
  console.log('Balance Sheet Data:');
  const bs = enhanced.balanceSheet as Record<string, Record<string, unknown>> | undefined;
  if (bs) {
    const icLoansProvided = bs.icLoansProvidedLongTerm;
    const icLoansReceived = bs.icLoansReceivedShortTerm;
    console.log(`  IC Loans Provided: EUR ${icLoansProvided?.amount ? (Number(icLoansProvided.amount) / 1e6).toFixed(1) : '?'}M`);
    console.log(`  Source: ${icLoansProvided?.source || 'MISSING'}`);
    console.log();
    console.log(`  IC Loans Received: EUR ${icLoansReceived?.amount ? (Number(icLoansReceived.amount) / 1e6).toFixed(1) : '?'}M`);
    console.log(`  Source: ${icLoansReceived?.source || 'MISSING'}`);
  } else {
    console.log('  ⚠️  Balance sheet data not in enhanced_extraction');
  }
  console.log();

  // Check P&L data
  console.log('P&L Data:');
  const pl = enhanced.profitAndLoss as Record<string, Record<string, unknown>> | undefined;
  if (pl) {
    console.log(`  IC Interest Income (10a): EUR ${pl.item10aInterestFromAffiliates?.amount ? (Number(pl.item10aInterestFromAffiliates.amount) / 1e6).toFixed(1) : '?'}M`);
    console.log(`  IC Interest Income (11a): EUR ${pl.item11aInterestFromAffiliates?.amount ? (Number(pl.item11aInterestFromAffiliates.amount) / 1e6).toFixed(1) : '?'}M`);
    console.log(`  IC Interest Expense (14a): EUR ${pl.item14aInterestToAffiliates?.amount ? (Math.abs(Number(pl.item14aInterestToAffiliates.amount)) / 1e6).toFixed(1) : '?'}M`);
    console.log(`  Other Operating Income (Item 4): EUR ${pl.item4TotalAmount?.amount ? (Number(pl.item4TotalAmount.amount) / 1e6).toFixed(1) : '?'}M`);
  } else {
    console.log('  ⚠️  P&L data not in enhanced_extraction');
  }
  console.log();

  // Quality metrics
  console.log('Extraction Quality:');
  const quality = enhanced.extractionQuality as Record<string, unknown> | undefined || validation?.qualityMetrics as Record<string, unknown> | undefined;
  if (quality) {
    console.log(`  Confidence: ${quality.confidence}`);
    console.log(`  All Sourced: ${quality.allSourced}`);
    console.log(`  Cross-Validated: ${quality.crossValidated}`);
  } else {
    console.log('  ⚠️  Quality metrics not found');
  }
  console.log();

  console.log('='.repeat(80));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

verifyExtraction().catch(console.error);
