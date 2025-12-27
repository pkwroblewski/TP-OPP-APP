/**
 * Clear Old APERAM Data Script
 *
 * This script removes the old APERAM filing data so a fresh extraction
 * can be performed with the fixed 3-layer anti-hallucination system.
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
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAperamData() {
  console.log('='.repeat(60));
  console.log('CLEARING OLD APERAM DATA');
  console.log('='.repeat(60));
  console.log();

  // Find companies with APERAM or B155908
  console.log('1. Finding APERAM company records...');
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id, name, rcs_number')
    .or('name.ilike.%APERAM%,rcs_number.eq.B155908');

  if (companyError) {
    console.error('Error finding companies:', companyError);
    return;
  }

  console.log(`   Found ${companies?.length || 0} company records`);
  companies?.forEach(c => console.log(`   - ${c.name} (${c.rcs_number}): ${c.id}`));

  const companyIds = companies?.map(c => c.id) || [];

  if (companyIds.length === 0) {
    console.log('\n   No APERAM data found in database.');
    return;
  }

  // Delete related data in order (respecting foreign keys)
  console.log('\n2. Deleting related data...');

  // Delete audit trail
  const { error: auditError, count: auditCount } = await supabase
    .from('audit_trail')
    .delete()
    .in('company_id', companyIds);
  console.log(`   - Audit trail: ${auditCount || 0} records deleted`);

  // Delete IC transactions
  const { error: txError, count: txCount } = await supabase
    .from('ic_transactions')
    .delete()
    .in('company_id', companyIds);
  console.log(`   - IC transactions: ${txCount || 0} records deleted`);

  // Delete TP assessments
  const { error: tpError, count: tpCount } = await supabase
    .from('tp_assessments')
    .delete()
    .in('company_id', companyIds);
  console.log(`   - TP assessments: ${tpCount || 0} records deleted`);

  // Delete financial data
  const { error: fdError, count: fdCount } = await supabase
    .from('financial_data')
    .delete()
    .in('company_id', companyIds);
  console.log(`   - Financial data: ${fdCount || 0} records deleted`);

  // Delete opportunity status
  const { error: osError, count: osCount } = await supabase
    .from('opportunity_status')
    .delete()
    .in('company_id', companyIds);
  console.log(`   - Opportunity status: ${osCount || 0} records deleted`);

  // Delete filings
  const { error: filingError, count: filingCount } = await supabase
    .from('filings')
    .delete()
    .in('company_id', companyIds);
  console.log(`   - Filings: ${filingCount || 0} records deleted`);

  // Delete uploaded files
  const { error: uploadError, count: uploadCount } = await supabase
    .from('uploaded_files')
    .delete()
    .in('confirmed_company_id', companyIds);
  console.log(`   - Uploaded files: ${uploadCount || 0} records deleted`);

  // Finally delete companies
  console.log('\n3. Deleting company records...');
  const { error: deleteError, count: deleteCount } = await supabase
    .from('companies')
    .delete()
    .in('id', companyIds);
  console.log(`   - Companies: ${deleteCount || 0} records deleted`);

  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNow you can re-upload the APERAM PDF at http://localhost:3002');
  console.log('The new extraction will use the fixed 3-layer anti-hallucination system.');
}

clearAperamData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
