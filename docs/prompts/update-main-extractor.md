# Update Main PDF Extractor to Use New 3-Layer Architecture

## Context
The new 3-layer anti-hallucination architecture has been tested and verified working on APERAM B155908. All IC transactions are correctly extracted with sources, and EUR 91.3M Item 4 is properly flagged as unverified.

## Task
Update the main PDF extractor to use the new systematic architecture.

## Implementation

### File: `src/lib/services/pdfExtractor.ts`

Replace or update the `extractFinancialData` function to use `extractLuxembourgFinancials`:

```typescript
import { extractLuxembourgFinancials } from './luxembourgExtractor';

export async function extractFinancialData(pdfBuffer: Buffer) {
  try {
    // Use the new 3-layer anti-hallucination architecture
    const result = await extractLuxembourgFinancials(pdfBuffer);
    
    // Return in format expected by frontend
    return {
      companyInfo: result.companyInfo,
      intercompanyTransactions: {
        financing: {
          loansProvided: result.balanceSheet.icLoansProvidedLongTerm,
          loansReceived: result.balanceSheet.icLoansReceivedShortTerm,
          interestIncome: {
            item10a: result.profitAndLoss.item10aInterestFromAffiliates,
            item11a: result.profitAndLoss.item11aInterestFromAffiliates,
            total: (result.profitAndLoss.item10aInterestFromAffiliates.amount || 0) +
                   (result.profitAndLoss.item11aInterestFromAffiliates.amount || 0)
          },
          interestExpense: result.profitAndLoss.item14aInterestToAffiliates
        },
        services: {
          item4: result.profitAndLoss.item4TotalAmount,
          item4Warning: result.validation.warnings.find(w => w.field === 'item4OtherOperatingIncome')
        },
        dividends: result.profitAndLoss.item9aDividendsFromAffiliates
      },
      balanceSheet: result.balanceSheet,
      validation: result.validation,
      extractionQuality: {
        allSourced: result.validation.qualityMetrics.allSourced,
        confidence: result.validation.qualityMetrics.confidence,
        crossValidated: result.validation.qualityMetrics.crossValidated,
        notesCovered: result.validation.qualityMetrics.notesCovered
      },
      tpOpportunities: result.validation.flags
    };
  } catch (error) {
    console.error('Extraction failed:', error);
    throw error;
  }
}
```

## Verification

After making changes, confirm:
1. File updated successfully
2. No TypeScript errors
3. Function exports correctly

Show me the updated code.
