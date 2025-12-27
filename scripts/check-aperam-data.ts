/**
 * Check APERAM Data Script
 * Shows what data exists for APERAM in the database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAperamData() {
  console.log('='.repeat(60));
  console.log('CHECKING APERAM DATA IN DATABASE');
  console.log('='.repeat(60));
  console.log();

  // Find companies with APERAM or B155908
  console.log('1. Companies:');
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id, name, rcs_number, created_at')
    .or('name.ilike.%APERAM%,rcs_number.eq.B155908');

  if (companyError) {
    console.error('   Error:', companyError.message);
  } else {
    console.log(`   Found ${companies?.length || 0} company records`);
    companies?.forEach(c => console.log(`   - ${c.name} (${c.rcs_number}): ${c.id}`));
  }

  const companyIds = companies?.map(c => c.id) || [];

  if (companyIds.length === 0) {
    console.log('\n   No APERAM data found. Ready to upload fresh PDF.');
    return;
  }

  // Check filings
  console.log('\n2. Filings:');
  const { data: filings, error: filingError } = await supabase
    .from('filings')
    .select('id, fiscal_year, extraction_status, enhanced_extraction')
    .in('company_id', companyIds);

  if (filingError) {
    console.error('   Error:', filingError.message);
  } else {
    console.log(`   Found ${filings?.length || 0} filing records`);
    filings?.forEach(f => {
      console.log(`   - Filing ${f.id.substring(0, 8)}...`);
      console.log(`     Status: ${f.extraction_status}`);
      console.log(`     Has enhanced_extraction: ${!!f.enhanced_extraction}`);
      if (f.enhanced_extraction) {
        const ee = f.enhanced_extraction as Record<string, unknown>;
        console.log(`     - Success: ${ee.success}`);
        console.log(`     - Has validation warnings: ${!!(ee.validation as Record<string, unknown>)?.warnings}`);
        console.log(`     - Has TP flags: ${!!(ee.validation as Record<string, unknown>)?.flags}`);
      }
    });
  }

  // Check IC transactions
  console.log('\n3. IC Transactions:');
  const { data: txs, error: txError } = await supabase
    .from('ic_transactions')
    .select('id, transaction_type, principal_amount, source_note')
    .in('company_id', companyIds);

  if (txError) {
    console.error('   Error:', txError.message);
  } else {
    console.log(`   Found ${txs?.length || 0} IC transaction records`);
    txs?.forEach(tx => {
      const amount = tx.principal_amount ? `EUR ${(tx.principal_amount / 1e6).toFixed(1)}M` : 'N/A';
      console.log(`   - ${tx.transaction_type}: ${amount}`);
      console.log(`     Source: ${tx.source_note || 'NO SOURCE'}`);
    });
  }

  // Check financial data
  console.log('\n4. Financial Data:');
  const { data: fd, error: fdError } = await supabase
    .from('financial_data')
    .select('id, fiscal_year, total_assets, ic_loans_receivable, ic_loans_payable')
    .in('company_id', companyIds);

  if (fdError) {
    console.error('   Error:', fdError.message);
  } else {
    console.log(`   Found ${fd?.length || 0} financial data records`);
    fd?.forEach(f => {
      console.log(`   - FY ${f.fiscal_year}`);
      console.log(`     Total Assets: EUR ${((f.total_assets || 0) / 1e6).toFixed(1)}M`);
      console.log(`     IC Loans Receivable: EUR ${((f.ic_loans_receivable || 0) / 1e6).toFixed(1)}M`);
      console.log(`     IC Loans Payable: EUR ${((f.ic_loans_payable || 0) / 1e6).toFixed(1)}M`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('SQL TO DELETE ALL APERAM DATA (run in Supabase SQL Editor):');
  console.log('='.repeat(60));
  console.log(`
-- Run this in Supabase SQL Editor to delete all APERAM data:
DO $$
DECLARE
  company_ids uuid[];
BEGIN
  -- Get all APERAM company IDs
  SELECT ARRAY_AGG(id) INTO company_ids
  FROM companies
  WHERE name ILIKE '%APERAM%' OR rcs_number = 'B155908';

  IF company_ids IS NOT NULL THEN
    -- Delete in order (respecting foreign keys)
    DELETE FROM audit_trail WHERE company_id = ANY(company_ids);
    DELETE FROM ic_transactions WHERE company_id = ANY(company_ids);
    DELETE FROM tp_assessments WHERE company_id = ANY(company_ids);
    DELETE FROM financial_data WHERE company_id = ANY(company_ids);
    DELETE FROM opportunity_status WHERE company_id = ANY(company_ids);
    DELETE FROM filings WHERE company_id = ANY(company_ids);
    DELETE FROM uploaded_files WHERE confirmed_company_id = ANY(company_ids);
    DELETE FROM companies WHERE id = ANY(company_ids);

    RAISE NOTICE 'Deleted APERAM data for % companies', array_length(company_ids, 1);
  ELSE
    RAISE NOTICE 'No APERAM data found';
  END IF;
END $$;
`);
}

checkAperamData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
