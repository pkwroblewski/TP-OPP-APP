/**
 * Full End-to-End Extraction Test
 * Tests the complete 3-layer extraction with the APERAM PDF
 */

import fs from 'fs';
import path from 'path';

// Import extraction functions
import { extractFinancialDataWithValidation } from '../src/lib/services/pdfExtractor';

async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text;
}

async function runFullExtractionTest() {
  console.log('='.repeat(80));
  console.log('FULL END-TO-END EXTRACTION TEST');
  console.log('='.repeat(80));
  console.log();

  // 1. Load and parse the PDF
  console.log('STEP 1: Loading PDF...');
  const pdfPath = path.join(__dirname, '../docs/B155908.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error('ERROR: PDF not found at', pdfPath);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`  PDF loaded: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  console.log('\nSTEP 2: Parsing PDF text...');
  const pdfText = await parsePdf(pdfBuffer);
  console.log(`  Text extracted: ${pdfText.length} characters`);
  console.log(`  First 200 chars: ${pdfText.substring(0, 200).replace(/\n/g, ' ')}...`);

  // 2. Run the combined extraction
  console.log('\nSTEP 3: Running 3-layer extraction with AI...');
  console.log('  (This may take 30-60 seconds...)\n');

  const startTime = Date.now();
  const result = await extractFinancialDataWithValidation(pdfText);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`  Extraction completed in ${duration}s\n`);

  // 3. Display results
  console.log('='.repeat(80));
  console.log('EXTRACTION RESULTS');
  console.log('='.repeat(80));

  console.log('\n--- BASIC INFO ---');
  console.log(`Success: ${result.success}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Company: ${result.detectedCompanyName}`);
  console.log(`RCS: ${result.detectedRcsNumber}`);
  console.log(`Fiscal Year: ${result.detectedFiscalYear}`);
  console.log(`Language: ${result.detectedLanguage}`);

  // 4. Luxembourg Extraction Results
  if (result.luxembourgExtraction) {
    const lux = result.luxembourgExtraction;
    console.log('\n--- LUXEMBOURG 3-LAYER EXTRACTION ---');
    console.log(`Success: ${lux.success}`);

    if (lux.extractionQuality) {
      console.log(`\nExtraction Quality:`);
      console.log(`  Confidence: ${lux.extractionQuality.confidence}`);
      console.log(`  All Sourced: ${lux.extractionQuality.allSourced}`);
      console.log(`  Cross-Validated: ${lux.extractionQuality.crossValidated}`);
    }

    // Display IC Financing from balance sheet and P&L
    const bs = lux.balanceSheet;
    const pl = lux.profitAndLoss;
    console.log(`\nIC Financing Transactions:`);
    const loansProvided = (bs.icLoansProvidedLongTerm?.amount || 0) + (bs.icLoansProvidedShortTerm?.amount || 0);
    const loansReceived = (bs.icLoansReceivedLongTerm?.amount || 0) + (bs.icLoansReceivedShortTerm?.amount || 0);
    console.log(`  Loans Provided: EUR ${(loansProvided / 1e6).toFixed(1)}M`);
    console.log(`    Source: ${bs.icLoansProvidedLongTerm?.source || bs.icLoansProvidedShortTerm?.source || 'N/A'}`);
    console.log(`  Loans Received: EUR ${(loansReceived / 1e6).toFixed(1)}M`);
    console.log(`    Source: ${bs.icLoansReceivedLongTerm?.source || bs.icLoansReceivedShortTerm?.source || 'N/A'}`);
    console.log(`  Interest Income (10a): EUR ${((pl.item10aInterestFromAffiliates?.amount || 0) / 1e6).toFixed(1)}M`);
    console.log(`    Source: ${pl.item10aInterestFromAffiliates?.source || 'N/A'}`);
    console.log(`  Interest Income (11a): EUR ${((pl.item11aInterestFromAffiliates?.amount || 0) / 1e6).toFixed(1)}M`);
    console.log(`    Source: ${pl.item11aInterestFromAffiliates?.source || 'N/A'}`);
    console.log(`  Interest Expense (14a): EUR ${(Math.abs(pl.item14aInterestToAffiliates?.amount || 0) / 1e6).toFixed(1)}M`);
    console.log(`    Source: ${pl.item14aInterestToAffiliates?.source || 'N/A'}`);

    // Display Item 4 service fees warning if present
    if (pl.item4TotalAmount?.amount) {
      console.log(`\nIC Services (Item 4):`);
      console.log(`  Amount: EUR ${((pl.item4TotalAmount.amount || 0) / 1e6).toFixed(1)}M`);
      if (pl.item4TotalAmount.warning) {
        console.log(`  WARNING: Cannot verify if IC services`);
        console.log(`    ${pl.item4TotalAmount.warning}`);
      }
    }

    if (lux.validation?.warnings && lux.validation.warnings.length > 0) {
      console.log(`\nValidation Warnings (${lux.validation.warnings.length}):`);
      lux.validation.warnings.forEach((w, i) => {
        console.log(`  ${i + 1}. [${w.severity}] ${w.field}`);
        console.log(`     ${w.issue}`);
        console.log(`     ${w.details}`);
      });
    }

    if (lux.tpOpportunities && lux.tpOpportunities.length > 0) {
      console.log(`\nTP Opportunities (${lux.tpOpportunities.length}):`);
      lux.tpOpportunities.forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.priority}] ${f.type}`);
        console.log(`     ${f.description}`);
        console.log(`     Estimated Value: ${f.estimatedValue}`);
      });
    }
  }

  // 5. IC Transactions from AI extraction
  if (result.icTransactions && result.icTransactions.length > 0) {
    console.log(`\n--- AI-EXTRACTED IC TRANSACTIONS (${result.icTransactions.length}) ---`);
    result.icTransactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.transactionType} - ${tx.transactionCategory}`);
      console.log(`     Amount: EUR ${((tx.principalAmount || tx.annualFlow || 0) / 1e6).toFixed(1)}M`);
      if (tx.counterpartyName) console.log(`     Counterparty: ${tx.counterpartyName}`);
      if (tx.sourceNote) console.log(`     Source: ${tx.sourceNote}`);
    });
  }

  // 6. Financial Data
  if (result.financialData) {
    const fd = result.financialData;
    console.log(`\n--- FINANCIAL DATA ---`);
    console.log(`Total Assets: EUR ${((fd.totalAssets || 0) / 1e6).toFixed(1)}M`);
    console.log(`Total Equity: EUR ${((fd.totalEquity || 0) / 1e6).toFixed(1)}M`);
    console.log(`IC Loans Receivable: EUR ${((fd.icLoansReceivable || 0) / 1e6).toFixed(1)}M`);
    console.log(`IC Loans Payable: EUR ${((fd.icLoansPayable || 0) / 1e6).toFixed(1)}M`);
    console.log(`IC Interest Income: EUR ${((fd.interestIncomeIc || 0) / 1e6).toFixed(1)}M`);
    console.log(`IC Interest Expense: EUR ${((fd.interestExpenseIc || 0) / 1e6).toFixed(1)}M`);
  }

  // 7. Verification Summary
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));

  // Extract values from the correct paths in luxembourgExtraction
  const bs = result.luxembourgExtraction?.balanceSheet;
  const pl = result.luxembourgExtraction?.profitAndLoss;

  const icLoansProvided = (bs?.icLoansProvidedLongTerm?.amount || 0) + (bs?.icLoansProvidedShortTerm?.amount || 0);
  const icLoansReceived = (bs?.icLoansReceivedLongTerm?.amount || 0) + (bs?.icLoansReceivedShortTerm?.amount || 0);
  const item10a = pl?.item10aInterestFromAffiliates?.amount || 0;
  const item11a = pl?.item11aInterestFromAffiliates?.amount || 0;
  const item14a = Math.abs(pl?.item14aInterestToAffiliates?.amount || 0);

  const checks = [
    {
      name: 'IC Loans Provided extracted',
      passed: icLoansProvided > 500000000,
      expected: '~EUR 517M',
      actual: `EUR ${(icLoansProvided / 1e6).toFixed(1)}M`,
    },
    {
      name: 'IC Loans Received extracted',
      passed: icLoansReceived > 300000000,
      expected: '~EUR 311M',
      actual: `EUR ${(icLoansReceived / 1e6).toFixed(1)}M`,
    },
    {
      name: 'Item 10a Interest Income extracted',
      passed: item10a > 30000000,
      expected: '~EUR 36.6M',
      actual: `EUR ${(item10a / 1e6).toFixed(1)}M`,
    },
    {
      name: 'Item 11a Interest Income extracted',
      passed: item11a > 30000000,
      expected: '~EUR 31.3M',
      actual: `EUR ${(item11a / 1e6).toFixed(1)}M`,
    },
    {
      name: 'Item 14a Interest Expense extracted',
      passed: item14a > 370000000,
      expected: '~EUR 378.7M',
      actual: `EUR ${(item14a / 1e6).toFixed(1)}M`,
    },
    {
      name: 'Item 4 flagged as unverified',
      passed: result.luxembourgExtraction?.validation?.warnings?.some(w => w.field.includes('item4')) || false,
      expected: 'Warning present',
      actual: result.luxembourgExtraction?.validation?.warnings?.some(w => w.field.includes('item4')) ? 'Warning present' : 'No warning',
    },
    {
      name: 'TP Opportunity detected (high rate)',
      passed: (result.luxembourgExtraction?.tpOpportunities?.some(f => f.type.includes('RATE')) || false),
      expected: 'HIGH_RATE flag',
      actual: result.luxembourgExtraction?.tpOpportunities?.find(f => f.type.includes('RATE'))?.type || 'None',
    },
    {
      name: 'Extraction Quality HIGH',
      passed: result.luxembourgExtraction?.extractionQuality?.confidence === 'HIGH',
      expected: 'HIGH',
      actual: result.luxembourgExtraction?.extractionQuality?.confidence || 'N/A',
    },
  ];

  let passCount = 0;
  checks.forEach(check => {
    const status = check.passed ? '✓' : '✗';
    const color = check.passed ? '' : ' <<<';
    console.log(`${status} ${check.name}`);
    console.log(`  Expected: ${check.expected}`);
    console.log(`  Actual: ${check.actual}${color}`);
    if (check.passed) passCount++;
  });

  console.log('\n' + '-'.repeat(40));
  console.log(`RESULT: ${passCount}/${checks.length} checks passed`);

  if (passCount === checks.length) {
    console.log('\n🎉 ALL CHECKS PASSED - Extraction is working correctly!');
  } else {
    console.log('\n⚠️ Some checks failed - review results above');
  }

  // Save full result to JSON
  const outputPath = path.join(__dirname, '../test-results/full-extraction-result.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nFull result saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

runFullExtractionTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
