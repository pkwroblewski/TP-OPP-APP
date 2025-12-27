import { StructuredExtractor } from '../src/lib/services/structuredExtractor';
import { NoteParser } from '../src/lib/services/noteParser';
import { ExtractionValidator } from '../src/lib/services/extractionValidator';
import { APERAM_B155908_TEXT } from '../test-data/aperam-b155908-text';
import fs from 'fs';
import path from 'path';

async function testAperamExtraction() {
  console.log('='.repeat(80));
  console.log('APERAM B155908 EXTRACTION TEST (Pre-Extracted Text)');
  console.log('='.repeat(80));
  console.log();

  console.log('✓ Using pre-extracted text from APERAM B155908 PDF\n');

  // LAYER 1: Structured Extraction
  console.log('LAYER 1: Structured Extraction...');
  const extractor = new StructuredExtractor(APERAM_B155908_TEXT);

  const companyInfo = await extractor.extractCompanyInfo();
  const balanceSheet = await extractor.extractBalanceSheet();
  const profitAndLoss = await extractor.extractPL();

  console.log('✓ Extraction complete\n');

  // LAYER 2: Note Parsing
  console.log('LAYER 2: Note Parsing...');
  const noteParser = new NoteParser(APERAM_B155908_TEXT);
  const notes = new Map();

  if (profitAndLoss.item4NoteReference) {
    const note = await noteParser.parseNote(profitAndLoss.item4NoteReference);
    notes.set(profitAndLoss.item4NoteReference, note);
  }

  console.log('✓ Note parsing complete\n');

  // LAYER 3: Validation
  console.log('LAYER 3: Validation...');

  const companyContext = {
    name: 'APERAM',
    rcsNumber: 'B155908',
    totalAssets: 5440566091,
    totalEquity: 4447362656,
    currency: 'EUR'
  };

  const validator = new ExtractionValidator(
    balanceSheet,
    profitAndLoss,
    notes,
    companyContext
  );

  const validation = validator.validate();
  console.log('✓ Validation complete\n');

  // Save results
  const result = {
    companyInfo,
    balanceSheet,
    profitAndLoss,
    notes: Array.from(notes.entries()),
    validation
  };

  const outputDir = path.join(__dirname, '../test-results');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'aperam-extraction.json'),
    JSON.stringify(result, null, 2)
  );

  // Print results
  console.log('='.repeat(80));
  console.log('CRITICAL VERIFICATIONS');
  console.log('='.repeat(80));
  console.log();

  // 1. IC Loans Provided
  console.log('1. EUR 517.4M IC Loan Provided:');
  const loanProvided = balanceSheet.icLoansProvidedLongTerm.amount ||
                       balanceSheet.icLoansProvidedShortTerm.amount;
  if (loanProvided) {
    console.log(`   ✓ Amount: EUR ${(loanProvided / 1e6).toFixed(1)}M`);
    console.log(`   ✓ Source: ${balanceSheet.icLoansProvidedLongTerm.source || balanceSheet.icLoansProvidedShortTerm.source}`);
    console.log(`   ✓ Confidence: ${balanceSheet.icLoansProvidedLongTerm.confidence}`);
  } else {
    console.log('   ✗ NOT EXTRACTED');
  }
  console.log();

  // 2. IC Loans Received
  console.log('2. EUR 310.9M IC Loan Received:');
  const loanReceived = balanceSheet.icLoansReceivedShortTerm.amount ||
                       balanceSheet.icLoansReceivedLongTerm.amount;
  if (loanReceived) {
    console.log(`   ✓ Amount: EUR ${(loanReceived / 1e6).toFixed(1)}M`);
    console.log(`   ✓ Source: ${balanceSheet.icLoansReceivedShortTerm.source || balanceSheet.icLoansReceivedLongTerm.source}`);
    console.log(`   ✓ Confidence: ${balanceSheet.icLoansReceivedShortTerm.confidence}`);
  } else {
    console.log('   ✗ NOT EXTRACTED');
  }
  console.log();

  // 3. IC Interest Income (Item 10a)
  console.log('3. EUR 36.6M IC Interest Income - Item 10a:');
  if (profitAndLoss.item10aInterestFromAffiliates.amount) {
    console.log(`   ✓ Amount: EUR ${(profitAndLoss.item10aInterestFromAffiliates.amount / 1e6).toFixed(1)}M`);
    console.log(`   ✓ Source: ${profitAndLoss.item10aInterestFromAffiliates.source}`);
    console.log(`   ✓ Confidence: ${profitAndLoss.item10aInterestFromAffiliates.confidence}`);
  } else {
    console.log('   ✗ NOT EXTRACTED - WAS MISSING BEFORE');
  }
  console.log();

  // 4. IC Interest Income (Item 11a)
  console.log('4. EUR 31.3M IC Interest Income - Item 11a:');
  if (profitAndLoss.item11aInterestFromAffiliates.amount) {
    console.log(`   ✓ Amount: EUR ${(profitAndLoss.item11aInterestFromAffiliates.amount / 1e6).toFixed(1)}M`);
    console.log(`   ✓ Source: ${profitAndLoss.item11aInterestFromAffiliates.source}`);
    console.log(`   ✓ Confidence: ${profitAndLoss.item11aInterestFromAffiliates.confidence}`);
  } else {
    console.log('   ✗ NOT EXTRACTED - WAS MISSING BEFORE');
  }
  console.log();

  // 5. IC Interest Expense (Item 14a)
  console.log('5. EUR 378.7M IC Interest Expense - Item 14a:');
  if (profitAndLoss.item14aInterestToAffiliates.amount) {
    console.log(`   ✓ Amount: EUR ${(Math.abs(profitAndLoss.item14aInterestToAffiliates.amount) / 1e6).toFixed(1)}M`);
    console.log(`   ✓ Source: ${profitAndLoss.item14aInterestToAffiliates.source}`);
    console.log(`   ✓ Confidence: ${profitAndLoss.item14aInterestToAffiliates.confidence}`);
  } else {
    console.log('   ✗ NOT EXTRACTED - WAS MISSING BEFORE');
  }
  console.log();

  // 6. Item 4 - Should be flagged
  console.log('6. EUR 91.3M Item 4 (Should be FLAGGED as unverified):');
  if (profitAndLoss.item4TotalAmount.amount) {
    console.log(`   ✓ Amount: EUR ${(profitAndLoss.item4TotalAmount.amount / 1e6).toFixed(1)}M`);
    console.log(`   ✓ Note Reference: ${profitAndLoss.item4NoteReference || 'NONE'}`);

    const item4Warning = validation.warnings.find(w => w.field === 'item4OtherOperatingIncome');
    if (item4Warning) {
      console.log(`   ✓✓✓ WARNING GENERATED: "${item4Warning.issue}"`);
      console.log(`   ✓✓✓ CORRECT - Not claiming as IC without verification!`);
    } else {
      console.log(`   ✗✗✗ NO WARNING - Should flag as unverified!`);
    }
  }
  console.log();

  // Validation Summary
  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nErrors: ${validation.errors.length}`);
  console.log(`Warnings: ${validation.warnings.length}`);
  console.log(`TP Flags: ${validation.flags.length}\n`);

  if (validation.warnings.length > 0) {
    console.log('Warnings:');
    validation.warnings.forEach((w, i) => {
      console.log(`  ${i+1}. [${w.severity}] ${w.issue}`);
      console.log(`     ${w.details}\n`);
    });
  }

  if (validation.flags.length > 0) {
    console.log('TP Opportunity Flags:');
    validation.flags.forEach((f, i) => {
      console.log(`  ${i+1}. [${f.priority}] ${f.type}`);
      console.log(`     ${f.description}`);
      console.log(`     ${f.estimatedValue}\n`);
    });
  }

  console.log('Quality Metrics:');
  console.log(`  All Sourced: ${validation.qualityMetrics.allSourced}`);
  console.log(`  Confidence: ${validation.qualityMetrics.confidence}\n`);

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

testAperamExtraction()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
