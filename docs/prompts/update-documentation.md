# Update Project Documentation

## Context
The 3-layer anti-hallucination architecture has been successfully implemented, tested, and integrated into the production application.

## Task
Update project documentation to reflect the new extraction system.

## Files to Update

### 1. README.md

Add a section on the extraction architecture:

## Extraction Architecture

### 3-Layer Anti-Hallucination System

The TP Opportunity Finder uses a systematic 3-layer architecture to prevent AI hallucinations when extracting financial data from Luxembourg annual accounts:

**Layer 0: Fixed Patterns (`luxembourgPatterns.ts`)**
- Defines exact patterns for Luxembourg GAAP balance sheet and P&L items
- IC identification keywords (French & English)
- No AI interpretation allowed

**Layer 1: Structured Extraction (`structuredExtractor.ts`)**
- Pattern-based extraction only
- Every extracted value MUST have a source reference
- Returns `null` if pattern not found (never guesses)
- Extracts IC items from specific P&L items (10a, 11a, 14a)

**Layer 2: Controlled Note Parsing (`noteParser.ts`)**
- Only parses notes that are explicitly referenced
- Only extracts IC breakdowns with explicit IC keywords
- Flags notes as "not accessible" if missing
- Never assumes totals are IC-related without proof

**Layer 3: Validation Engine (`extractionValidator.ts`)**
- Cross-validates IC loans vs interest income/expense
- Flags zero-spread opportunities
- Detects impossible values (e.g., IC loans > 2x total assets)
- Marks values without sources as hallucination risks
- Calculates implied rates and quality metrics

### Test Results (APERAM B155908)

- ✅ EUR 91.3M Item 4 correctly flagged as "unverified" (Note 15 inaccessible)
- ✅ EUR 67.8M IC interest income extracted (Items 10a + 11a) - was missing before
- ✅ EUR 378.7M IC interest expense extracted (Item 14a) - was missing before
- ✅ 100% source tracking - zero hallucinations
- ✅ TP opportunities auto-detected (121.8% rate flagged)

### Quality Metrics

Every extraction provides:
- **Confidence Level:** HIGH/MEDIUM/LOW
- **Source Tracking:** All values sourced: Yes/No
- **Cross-Validation:** Loans ↔ Interest reconciled
- **TP Opportunities:** Automatically flagged

### Anti-Hallucination Guarantees

1. No value extracted without explicit source reference
2. Item 4 "Other Operating Income" flagged if note inaccessible
3. IC nature only confirmed with explicit keywords ("affiliated undertakings", "entreprises liées")
4. Impossible values detected and flagged
5. Zero-spread opportunities automatically identified

---

### 2. .claude-rules

Add to the end of `.claude-rules`:

## EXTRACTION ARCHITECTURE - VERIFIED WORKING (December 2024)

3-layer anti-hallucination system prevents AI from inventing IC transactions.

**Implementation Status:** ✅ PRODUCTION

**Files:**
- `src/lib/services/luxembourgPatterns.ts` - Layer 0 (569 lines)
- `src/lib/services/structuredExtractor.ts` - Layer 1 (612 lines)
- `src/lib/services/noteParser.ts` - Layer 2 (553 lines)
- `src/lib/services/extractionValidator.ts` - Layer 3 (697 lines)
- `src/lib/services/luxembourgExtractor.ts` - Integration (479 lines)

**Total:** ~2,910 lines of systematic anti-hallucination code

**Test Results (APERAM B155908 - December 2024):**
- ✅ EUR 91.3M Item 4 correctly flagged as "Cannot verify if IC services - Note 15 not accessible"
- ✅ EUR 36.6M IC interest income (Item 10a) extracted with source
- ✅ EUR 31.3M IC interest income (Item 11a) extracted with source
- ✅ EUR 378.7M IC interest expense (Item 14a) extracted with source
- ✅ EUR 517.4M IC loan provided extracted with source
- ✅ EUR 310.9M IC loan received extracted with source
- ✅ 100% source tracking, zero hallucinations
- ✅ TP opportunities auto-detected (121.8% implied rate flagged as HIGH_RATE)

**Key Principles:**
1. Every extracted value requires source reference (page, line, note)
2. Returns `null` when pattern not found - NEVER guesses
3. IC nature only confirmed with explicit keywords in notes
4. Cross-validation between balance sheet and P&L mandatory
5. Impossible values flagged (IC loans > 2x assets, rates >100%, etc.)

**When Adding New Features:**
Always maintain these anti-hallucination principles. Never bypass source tracking or allow values without explicit pattern matches.

---

### 3. docs/extraction-architecture.md (New File)

Create a detailed technical documentation file:

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
**File:** `src/lib/services/luxembourgPatterns.ts` (569 lines)

Defines exact patterns for Luxembourg GAAP without any AI interpretation:
- Balance sheet line item patterns (English/French)
- P&L line item patterns (Items 4, 9a, 10a, 11a, 14a)
- IC identification keywords
- Note reference patterns
- Validation thresholds

### Layer 1: Structured Extraction
**File:** `src/lib/services/structuredExtractor.ts` (612 lines)

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

### Layer 2: Controlled Note Parsing
**File:** `src/lib/services/noteParser.ts` (553 lines)

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
**File:** `src/lib/services/extractionValidator.ts` (697 lines)

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

### Integration Layer
**File:** `src/lib/services/luxembourgExtractor.ts` (479 lines)

Orchestrates the 3-layer extraction:
- Converts PDF to text
- Runs Layer 1 (structured extraction)
- Runs Layer 2 (note parsing)
- Runs Layer 3 (validation)
- Returns structured result with quality metrics

Main Function:
```typescript
async function extractLuxembourgFinancials(pdfBuffer: Buffer): Promise<ExtractionResult>
```

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

### 5. Null-Safe Pattern Matching
Returns `null` instead of guessing when:
- Pattern not found in document
- Note referenced but not accessible
- IC keywords not present in note

## Testing Protocol

### Unit Tests
Test individual layer functions with known inputs/outputs.

### Integration Tests
Test complete extraction flow with sample Luxembourg accounts.

### Regression Tests
Test against APERAM B155908 to ensure:
- EUR 91.3M Item 4 flagged (not claimed as IC)
- EUR 67.8M IC interest income extracted
- EUR 378.7M IC interest expense extracted
- All values have sources
- TP opportunities detected

### Test Data
Located in: `test-data/aperam-b155908-text.ts`

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
1. Check `test-results/aperam-extraction.json` for sample output
2. Review validation errors/warnings in result
3. Check if pattern exists in `luxembourgPatterns.ts`
4. Verify note is accessible in PDF
5. Confirm IC keywords present in note text

### Performance Optimization
Current architecture processes one PDF in ~3-5 seconds:
- Layer 1 (Extraction): ~1-2s
- Layer 2 (Note Parsing): ~1-2s
- Layer 3 (Validation): ~0.5s

For batch processing, consider:
- Caching pattern matching results
- Parallel note parsing
- Pre-extracting text from PDFs

## Quality Metrics

Every extraction returns quality metrics:
```typescript
{
  allSourced: boolean,        // All values have sources
  crossValidated: boolean,     // Loans vs interest checked
  notesCovered: number,        // % of notes parsed
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}
```

**Confidence Levels:**
- **HIGH:** All values sourced, cross-validated, no critical errors
- **MEDIUM:** Some values sourced, partial validation
- **LOW:** Missing sources, validation failed

## Version History

- **v1.0 (December 2024):** Initial 3-layer architecture
  - Tested on APERAM B155908
  - Zero hallucinations achieved
  - TP opportunity detection implemented

---

## Implementation

Please update these three files (README.md, .claude-rules, docs/extraction-architecture.md) with the content specified above.

After completion, confirm:
1. ✅ README.md updated with extraction architecture section
2. ✅ .claude-rules updated with verified working status
3. ✅ docs/extraction-architecture.md created with full technical documentation

Show me the updated files or confirm completion.
