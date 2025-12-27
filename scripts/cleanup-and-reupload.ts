import { createClient } from '@supabase/supabase-js';

// Load environment variables inline since dotenv may not be installed
const supabaseUrl = 'https://kgjfjryvwhdxhtvlellr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnamZqcnl2d2hkeGh0dmxlbGxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY4NjQ2MCwiZXhwIjoyMDgyMjYyNDYwfQ.Vima2vsaVyInY_vmhJHH5bF9rJtRuNwnTA6MftfLDZM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupAndVerify() {
  console.log('='.repeat(80));
  console.log('SUPABASE CLEANUP AND VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Delete all data in order (respecting foreign keys)
  console.log('Step 1: Deleting all existing data...');

  // Delete in order: audit_trail, opportunity_status, tp_assessments, ic_transactions, financial_data, filings, uploaded_files, upload_batches, companies
  const tables = [
    'audit_trail',
    'opportunity_status',
    'tp_assessments',
    'ic_transactions',
    'financial_data',
    'filings',
    'uploaded_files',
    'upload_batches',
    'companies'
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.log(`  ⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} cleared`);
    }
  }
  console.log();

  // Step 2: Verify counts are 0
  console.log('Step 2: Verifying all tables are empty...');
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`  ⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`  ${table}: ${count} records`);
    }
  }
  console.log();

  // Step 3: Verify enhanced_extraction column exists
  console.log('Step 3: Checking enhanced_extraction column...');
  const { data: columnData, error: columnError } = await supabase
    .from('filings')
    .select('enhanced_extraction')
    .limit(0);

  if (columnError && columnError.message.includes('enhanced_extraction')) {
    console.error('❌ enhanced_extraction column missing!');
    console.error('You need to run this SQL in Supabase Dashboard:');
    console.log('ALTER TABLE filings ADD COLUMN enhanced_extraction JSONB;');
    process.exit(1);
  }
  console.log('✅ enhanced_extraction column exists');
  console.log();

  console.log('='.repeat(80));
  console.log('CLEANUP COMPLETE - Ready for APERAM upload!');
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Open: http://localhost:3000/upload');
  console.log('3. Upload: docs/B155908.pdf');
  console.log('4. Wait for extraction to complete');
  console.log('5. Run verification script: npx tsx scripts/verify-extraction.ts');
}

cleanupAndVerify().catch(console.error);
