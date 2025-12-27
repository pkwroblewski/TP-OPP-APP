/**
 * APERAM B155908 Extraction Test Runner
 *
 * This script tests the 3-layer extraction architecture on APERAM data
 * and outputs detailed results for verification.
 */

import { StructuredExtractor } from '../structuredExtractor';
import { NoteParser } from '../noteParser';
import { ExtractionValidator, CompanyValidationContext } from '../extractionValidator';
import { APERAM_B155908_SAMPLE_TEXT } from './aperam-test-data';

async function runAperamExtraction() {
  console.log('='.repeat(80));
  console.log('APERAM B155908 - 3-LAYER EXTRACTION TEST');
  console.log('='.repeat(80));
  console.log();

  // =========================================================
  // LAYER 1: Structured Extraction
  // =========================================================
  console.log('LAYER 1: STRUCTURED EXTRACTION');
  console.log('-'.repeat(40));

  const extractor = new StructuredExtractor(APERAM_B155908_SAMPLE_TEXT);

  // Extract company info
  const companyInfo = await extractor.extractCompanyInfo();
  console.log('\nCompany Info:');
  console.log(JSON.stringify(companyInfo, null, 2));

  // Extract balance sheet
  const balanceSheet = await extractor.extractBalanceSheet();
  console.log('\nBalance Sheet Extraction:');
  console.log(JSON.stringify(balanceSheet, null, 2));

  // Extract P&L
  const profitAndLoss = await extractor.extractPL();
  console.log('\nP&L Extraction:');
  console.log(JSON.stringify(profitAndLoss, null, 2));

  // Get all note references
  const allNotes = extractor.getAllNoteReferences();
  console.log('\nNote References Found:');
  console.log(allNotes);

  // =========================================================
  // LAYER 2: Note Parsing
  // =========================================================
  console.log('\n' + '='.repeat(80));
  console.log('LAYER 2: NOTE PARSING');
  console.log('-'.repeat(40));

  const noteParser = new NoteParser(APERAM_B155908_SAMPLE_TEXT);

  // Get available notes
  const availableNotes = noteParser.getAvailableNotes();
  console.log('\nAvailable Notes in Document:');
  console.log(availableNotes);

  // Parse critical notes
  const notes = new Map();

  // Parse Note 15 (Item 4 - Other operating income)
  if (profitAndLoss.item4NoteReference) {
    const note15 = await noteParser.parseNote(profitAndLoss.item4NoteReference);
    notes.set(profitAndLoss.item4NoteReference, note15);
    console.log(`\n${profitAndLoss.item4NoteReference} Parsing Result:`);
    console.log(JSON.stringify(note15, null, 2));
  }

  // Parse Note 5 (IC Loans - Fixed Assets)
  const note5 = await noteParser.parseNote('Note 5');
  notes.set('Note 5', note5);
  console.log('\nNote 5 Parsing Result (IC Loans Provided):');
  console.log(JSON.stringify(note5, null, 2));

  // Parse Note 8 (IC Loans Received - Current)
  const note8 = await noteParser.parseNote('Note 8');
  notes.set('Note 8', note8);
  console.log('\nNote 8 Parsing Result (IC Loans Received):');
  console.log(JSON.stringify(note8, null, 2));

  // Find related party note
  const relatedPartyNote = await noteParser.findRelatedPartyNote();
  if (relatedPartyNote) {
    notes.set(relatedPartyNote.noteNumber, relatedPartyNote);
    console.log('\nRelated Party Note Found:');
    console.log(JSON.stringify(relatedPartyNote, null, 2));
  }

  // =========================================================
  // LAYER 3: Validation
  // =========================================================
  console.log('\n' + '='.repeat(80));
  console.log('LAYER 3: VALIDATION & CROSS-CHECKS');
  console.log('-'.repeat(40));

  const companyContext: CompanyValidationContext = {
    name: companyInfo.name || 'APERAM Treasury S.C.A.',
    rcsNumber: companyInfo.rcsNumber || 'B155908',
    totalAssets: balanceSheet.totalAssets.amount || 583100000,
    totalEquity: balanceSheet.totalEquity.amount || 137700000,
    currency: 'EUR',
  };

  console.log('\nCompany Context:');
  console.log(JSON.stringify(companyContext, null, 2));

  const validator = new ExtractionValidator(
    balanceSheet,
    profitAndLoss,
    notes,
    companyContext
  );

  const validation = validator.validate();

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(80));

  console.log('\nIs Valid:', validation.isValid);

  console.log('\n--- ERRORS ---');
  if (validation.errors.length === 0) {
    console.log('No errors found.');
  } else {
    validation.errors.forEach((error, i) => {
      console.log(`\n[${i + 1}] ${error.severity}: ${error.issue}`);
      console.log(`    Field: ${error.field}`);
      console.log(`    Details: ${error.details}`);
      console.log(`    Possible Hallucination: ${error.possibleHallucination}`);
    });
  }

  console.log('\n--- WARNINGS ---');
  if (validation.warnings.length === 0) {
    console.log('No warnings found.');
  } else {
    validation.warnings.forEach((warning, i) => {
      console.log(`\n[${i + 1}] ${warning.severity}: ${warning.issue}`);
      console.log(`    Field: ${warning.field}`);
      console.log(`    Details: ${warning.details}`);
    });
  }

  console.log('\n--- TP OPPORTUNITY FLAGS ---');
  if (validation.flags.length === 0) {
    console.log('No TP opportunities flagged.');
  } else {
    validation.flags.forEach((flag, i) => {
      console.log(`\n[${i + 1}] ${flag.priority} PRIORITY: ${flag.type}`);
      console.log(`    Description: ${flag.description}`);
      console.log(`    Estimated Value: ${flag.estimatedValue}`);
      console.log(`    Reference: ${flag.reference || 'N/A'}`);
    });
  }

  console.log('\n--- CROSS-VALIDATION ---');
  console.log('Loans vs Interest:');
  console.log(JSON.stringify(validation.crossValidation.loansVsInterest, null, 2));

  console.log('\nReasonableness Checks:');
  console.log(JSON.stringify(validation.crossValidation.reasonablenessChecks, null, 2));

  console.log('\n--- QUALITY METRICS ---');
  console.log(JSON.stringify(validation.qualityMetrics, null, 2));

  // =========================================================
  // SPECIFIC VERIFICATION
  // =========================================================
  console.log('\n' + '='.repeat(80));
  console.log('SPECIFIC VERIFICATION (Per .claude-rules)');
  console.log('='.repeat(80));

  console.log('\n1. EUR 91.3M (Item 4) - Should be flagged as unverified:');
  const item4Amount = profitAndLoss.item4TotalAmount.amount;
  const item4Note = notes.get(profitAndLoss.item4NoteReference || '');
  console.log(`   Amount: EUR ${item4Amount ? (item4Amount / 1000000).toFixed(1) : 'N/A'}M`);
  console.log(`   Note Reference: ${profitAndLoss.item4NoteReference || 'None'}`);
  console.log(`   Note Accessible: ${item4Note?.noteAccessible || false}`);
  console.log(`   IC Breakdown Found: ${item4Note?.icBreakdown !== null}`);
  const item4Warning = validation.warnings.find(w => w.field === 'item4OtherOperatingIncome');
  console.log(`   Warning Generated: ${item4Warning ? 'YES - ' + item4Warning.issue : 'NO'}`);

  console.log('\n2. EUR 36.6M IC interest income (Item 10a):');
  const item10a = profitAndLoss.item10aInterestFromAffiliates;
  console.log(`   Amount: EUR ${item10a.amount ? (item10a.amount / 1000000).toFixed(1) : 'N/A'}M`);
  console.log(`   Source: ${item10a.source || 'NO SOURCE - HALLUCINATION RISK'}`);
  console.log(`   Confidence: ${item10a.confidence}`);

  console.log('\n3. EUR 31.3M IC interest income (Item 11a):');
  const item11a = profitAndLoss.item11aInterestFromAffiliates;
  console.log(`   Amount: EUR ${item11a.amount ? (item11a.amount / 1000000).toFixed(1) : 'N/A'}M`);
  console.log(`   Source: ${item11a.source || 'NO SOURCE - HALLUCINATION RISK'}`);
  console.log(`   Confidence: ${item11a.confidence}`);

  console.log('\n4. EUR 378.7M IC interest expense (Item 14a):');
  const item14a = profitAndLoss.item14aInterestToAffiliates;
  console.log(`   Amount: EUR ${item14a.amount ? (item14a.amount / 1000000).toFixed(1) : 'N/A'}M`);
  console.log(`   Source: ${item14a.source || 'NO SOURCE - HALLUCINATION RISK'}`);
  console.log(`   Confidence: ${item14a.confidence}`);

  console.log('\n5. EUR 517.4M IC loan provided:');
  const icLoanLT = balanceSheet.icLoansProvidedLongTerm;
  console.log(`   Amount: EUR ${icLoanLT.amount ? (icLoanLT.amount / 1000000).toFixed(1) : 'N/A'}M`);
  console.log(`   Source: ${icLoanLT.source || 'NO SOURCE - HALLUCINATION RISK'}`);
  console.log(`   Note Reference: ${icLoanLT.noteReference || 'None'}`);
  console.log(`   Confidence: ${icLoanLT.confidence}`);

  console.log('\n6. EUR 310.9M IC loan received:');
  const icLoanRec = balanceSheet.icLoansReceivedShortTerm;
  console.log(`   Amount: EUR ${icLoanRec.amount ? (icLoanRec.amount / 1000000).toFixed(1) : 'N/A'}M`);
  console.log(`   Source: ${icLoanRec.source || 'NO SOURCE - HALLUCINATION RISK'}`);
  console.log(`   Note Reference: ${icLoanRec.noteReference || 'None'}`);
  console.log(`   Confidence: ${icLoanRec.confidence}`);

  // =========================================================
  // SUMMARY
  // =========================================================
  console.log('\n' + '='.repeat(80));
  console.log('EXTRACTION SUMMARY');
  console.log('='.repeat(80));

  const loansProvided = (balanceSheet.icLoansProvidedLongTerm.amount || 0) +
    (balanceSheet.icLoansProvidedShortTerm.amount || 0);
  const loansReceived = (balanceSheet.icLoansReceivedLongTerm.amount || 0) +
    (balanceSheet.icLoansReceivedShortTerm.amount || 0);
  const interestIncome = (profitAndLoss.item10aInterestFromAffiliates.amount || 0) +
    (profitAndLoss.item11aInterestFromAffiliates.amount || 0);
  const interestExpense = profitAndLoss.item14aInterestToAffiliates.amount || 0;

  console.log(`
  IC Loans Provided: EUR ${(loansProvided / 1000000).toFixed(1)}M
  IC Loans Received: EUR ${(loansReceived / 1000000).toFixed(1)}M
  IC Interest Income (10a + 11a): EUR ${(interestIncome / 1000000).toFixed(1)}M
  IC Interest Expense (14a): EUR ${(interestExpense / 1000000).toFixed(1)}M

  Implied Lending Rate: ${loansProvided > 0 ? ((interestIncome / loansProvided) * 100).toFixed(2) : 'N/A'}%
  Implied Borrowing Rate: ${loansReceived > 0 ? ((interestExpense / loansReceived) * 100).toFixed(2) : 'N/A'}%

  Validation Status: ${validation.isValid ? 'VALID' : 'INVALID'}
  Confidence: ${validation.qualityMetrics.confidence}
  All Values Sourced: ${validation.qualityMetrics.allSourced}
  TP Opportunities: ${validation.flags.length}
  `);

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));

  return {
    companyInfo,
    balanceSheet,
    profitAndLoss,
    notes: Array.from(notes.entries()),
    validation,
  };
}

// Run the extraction
runAperamExtraction()
  .then(result => {
    console.log('\nFull result object available for inspection.');
  })
  .catch(error => {
    console.error('Extraction failed:', error);
    process.exit(1);
  });

export { runAperamExtraction };
