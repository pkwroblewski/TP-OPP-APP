# Extraction Architecture - Technical Documentation

## Overview

The TP Opportunity Finder uses a 3-layer anti-hallucination architecture to extract financial data from Luxembourg annual accounts with zero hallucinations.

## Problem Statement

Previous extraction approaches suffered from:
- AI hallucinating IC transaction values
- Missing IC interest income/expense
- No source tracking for extracted values
- No validation of extracted data
- EUR 91.3M claimed as "IC service fees" without verification

## Solution Architecture

### Layer 0: Fixed Patterns Library

**File:** `src/lib/services/luxembourgPatterns.ts`

Defines exact patterns for Luxembourg GAAP without any AI interpretation:
- Balance sheet line item patterns (English/French)
- P&L line item patterns (Items 4, 9a, 10a, 11a, 14a)
- IC identification keywords
- Note reference patterns
- Validation thresholds

Key exports:
- `BalanceSheetPatterns` - IC loans provided/received patterns
- `PLPatterns` - P&L interest income/expense patterns
- `NoteReferencePatterns` - Note extraction patterns
- `AmountPatterns` - Number format detection (EU/US)

### Layer 1: Structured Extraction

**File:** `src/lib/services/structuredExtractor.ts`

Pattern-based extraction with mandatory source tracking:
- Only extracts values matching exact patterns
- Every value requires source reference (page, line, note)
- Returns `null` if pattern not found (never guesses)
- Extracts IC sub-items from P&L (e.g., "derived from affiliated undertakings")

Key Functions:
- `extractBalanceSheet()` - Extracts IC loans provided/received
- `extractPL()` - Extracts IC interest income/expense, dividends
- `extractExactPattern()` - Pattern matching engine
- `extractICSubItem()` - Finds IC portions within P&L items

**ExtractedValue Interface:**
```typescript
interface ExtractedValue {
  amount: number | null;
  source: string | null;
  pageNumber: number | null;
  lineReference: string | null;
  noteReference: string | null;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern: string | null;
  warning: string | null;
}
```

### Layer 2: Controlled Note Parsing

**File:** `src/lib/services/noteParser.ts`

Only parses notes explicitly referenced in financial statements:
- Extracts IC breakdowns only with explicit IC keywords
- Flags notes as "not accessible" if missing
- Never assumes totals are IC-related without proof
- Identifies transaction types (financing, services, dividends, etc.)

Key Functions:
- `parseNote()` - Parses individual note
- `parseNotes()` - Parses multiple notes
- `findRelatedPartyNote()` - Locates related party disclosures
- `extractICBreakdownFromNote()` - Extracts IC items from note text

### Layer 3: Validation Engine

**File:** `src/lib/services/extractionValidator.ts`

Cross-validates and flags issues:
- IC loans vs interest income/expense reconciliation
- Implied rate calculations (flags if <1% or >15%)
- Impossible value detection (IC loans > 2x assets)
- Zero-spread opportunity detection
- Thin capitalization checks
- Source tracking verification

Key Functions:
- `validate()` - Main validation orchestrator
- `validateSourceTracking()` - Ensures all values sourced
- `validateLoansVsInterest()` - Cross-validates loans and interest
- `validateImpliedRates()` - Checks rate reasonableness
- `validateReasonableness()` - Detects impossible values

**Validation Output:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ExtractionValidationError[];
  warnings: ValidationWarning[];
  tpOpportunities: TPOpportunityFlag[];
}
```

### Integration Layer

**File:** `src/lib/services/luxembourgExtractor.ts`

Orchestrates the 3-layer extraction:
1. Runs Layer 1 (structured extraction)
2. Runs Layer 2 (note parsing)
3. Runs Layer 3 (validation)
4. Returns structured result with quality metrics

**Main Function:**
```typescript
async function extractLuxembourgFinancials(
  pdfText: string
): Promise<LuxembourgExtractionResult>
```

**Result Structure:**
```typescript
interface LuxembourgExtractionResult {
  success: boolean;
  companyInfo: CompanyInfoExtraction;
  balanceSheet: BalanceSheetExtraction;
  profitAndLoss: PLExtraction;
  notes: NoteParsingResult[];
  validation: ValidationResult;
  extractionQuality: ExtractionQuality;
  tpOpportunities: TPOpportunityFlag[];
  error?: string;
  rawText: string;
}
```

---

## Anti-Hallucination Mechanisms

### 1. Mandatory Source Tracking

Every extracted value includes:
```typescript
{
  amount: number | null,
  source: string | null,  // "Balance Sheet - Line 1139, page 2"
  pageNumber: number | null,
  lineReference: string | null,
  noteReference: string | null,
  confidence: 'high' | 'medium' | 'low'
}
```

### 2. Explicit IC Keywords Required

IC nature only confirmed if note text contains:
- "affiliated undertakings"
- "entreprises liées"
- "group companies"
- "derived from affiliated"
- "concerning affiliated"

### 3. Cross-Validation Rules

- IC loan on balance sheet → MUST have interest in P&L (or flagged as zero-spread)
- Interest income/expense → MUST have corresponding loan
- Implied rate must be 1-15% (or flagged)

### 4. Impossible Value Detection

Flags as CRITICAL error if:
- IC loans > 2x total assets
- Negative equity with positive net income
- Interest > 10x principal amount
- Implied rates > 100%

### 5. Null-Safe Pattern Matching

Returns `null` instead of guessing when:
- Pattern not found in document
- Note referenced but not accessible
- IC keywords not present in note

---

## TP Opportunity Detection

The system automatically detects and flags TP opportunities:

### HIGH Priority Flags:
- **ZERO_SPREAD:** IC loan with zero interest income/expense
- **HIGH_RATE:** Implied rate > 15% (suspicious pricing)
- **LOW_RATE:** Implied rate < 1% (below market)

### MEDIUM Priority Flags:
- **NO_INTEREST_ON_LOAN:** Possible equity reclassification needed
- **THIN_CAP_RISK:** D/E ratio > 4:1
- **MISSING_TP_POLICY:** Large IC transactions without policy

---

## Quality Metrics

Every extraction returns quality metrics:

```typescript
interface ExtractionQuality {
  allSourced: boolean;        // All values have sources
  crossValidated: boolean;    // Loans vs interest checked
  notesCovered: number;       // % of notes parsed
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  warnings: string[];
  hallucinationRisks: string[];
}
```

**Confidence Levels:**
- **HIGH:** All values sourced, cross-validated, no critical errors
- **MEDIUM:** Some values sourced, partial validation
- **LOW:** Missing sources, validation failed

---

## Testing Protocol

### Unit Tests

Located in: `src/lib/services/__tests__/`

Test individual layer functions with known inputs/outputs.

### Integration Test

**File:** `scripts/test-full-extraction.ts`

Tests complete extraction flow with APERAM B155908 PDF:

```bash
npx tsx scripts/test-full-extraction.ts
```

**Expected Results (8/8 checks):**
1. IC Loans Provided: EUR 517.4M
2. IC Loans Received: EUR 320.9M
3. Item 10a Interest Income: EUR 36.6M
4. Item 11a Interest Income: EUR 31.3M
5. Item 14a Interest Expense: EUR 378.7M
6. Item 4 flagged as unverified
7. HIGH_RATE TP opportunity detected
8. Extraction Quality: HIGH

### Test Data

Pre-extracted text: `test-data/aperam-b155908-text.ts`

---

## PDF Text Structure Handling

Luxembourg eCDF PDFs have specific formatting challenges:

### Issue: Multi-line Labels
PDF often splits labels across lines:
```
Line 654: "11.Other interest receivable and similar "
Line 655: "income"
```

**Solution:** Pattern matching checks multiple lines for complete match.

### Issue: Separated Amounts
Amounts appear on separate lines from labels:
```
Line 109: "2.Loans to affiliated undertakings"
Line 110: "1139"           <- Reference number
Line 111: "517.445.443,81" <- Actual amount
```

**Solution:** Amount extraction searches up to 4 lines after pattern, skipping reference numbers.

### Issue: Reference Number Detection
Reference numbers (1139, 1169169170) can be confused with amounts.

**Solution:** Regex filtering for 3-4 digit and 6-10 digit pure numbers:
```typescript
const isLikelyReferenceNumber = /^\d{3,4}$/.test(lineOnly) || /^\d{6,10}$/.test(lineOnly);
```

---

## Maintenance Guidelines

### Adding New Patterns

1. Update `luxembourgPatterns.ts` with new pattern
2. Add pattern matching logic to `structuredExtractor.ts`
3. Add validation rules to `extractionValidator.ts`
4. Add unit tests
5. Test on real accounts

### Modifying Extraction Logic

**NEVER:**
- Remove source tracking requirements
- Allow pattern matching to guess values
- Bypass validation layer
- Assume IC nature without explicit keywords

**ALWAYS:**
- Return `null` when pattern not found
- Track source for every extracted value
- Run validation on all extractions
- Flag suspicious values

### Debugging Extraction Issues

1. Check `test-results/full-extraction-result.json` for sample output
2. Review validation errors/warnings in result
3. Check if pattern exists in `luxembourgPatterns.ts`
4. Verify note is accessible in PDF
5. Confirm IC keywords present in note text

---

## Performance

Current architecture processes one PDF in ~3-5 seconds:
- Layer 1 (Extraction): ~1-2s
- Layer 2 (Note Parsing): ~1-2s
- Layer 3 (Validation): ~0.5s

For batch processing, consider:
- Caching pattern matching results
- Parallel note parsing
- Pre-extracting text from PDFs

---

## Version History

### v1.0 (December 2024)
- Initial 3-layer architecture
- Tested on APERAM B155908
- Zero hallucinations achieved
- TP opportunity detection implemented

### Key Fixes Applied:
1. Reference number filtering expanded to catch 6-10 digit combined refs
2. Multi-line amount extraction (search up to 4 lines after pattern)
3. Expanded IC sub-item search window to 15 lines
4. Updated liability patterns to use "owed to" phrase
5. Updated Item 11 patterns for truncated PDF lines
