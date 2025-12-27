# Test Complete Flow with Live PDF Upload

## Context
The backend 3-layer extraction is implemented and the frontend UI has been updated to show validation results.

## Task
Test the complete end-to-end flow with a real PDF upload.

## Steps

### 1. Start Development Server

```bash
npm run dev
```

Confirm server is running at `http://localhost:3000`

### 2. Test PDF Upload

Navigate to the upload page and test with:
- **Primary test:** APERAM B155908 PDF at `docs/B155908.pdf`
- **Alternative:** Any other Luxembourg annual accounts PDF

### 3. Verify Results Display

Check that the results page shows:

**✓ Company Information:**
- Company name
- RCS number
- Financial year
- Currency

**✓ IC Transactions Extracted:**
- IC Loans Provided: EUR 517.4M (with source)
- IC Loans Received: EUR 310.9M (with source)
- IC Interest Income Item 10a: EUR 36.6M (with source)
- IC Interest Income Item 11a: EUR 31.3M (with source)
- IC Interest Expense Item 14a: EUR 378.7M (with source)

**✓ Warnings Section:**
- Should show: "Item 4 - Cannot verify if IC services - Note 15 not accessible"

**✓ TP Opportunities Section:**
- Should show: "HIGH_RATE - 121.78% implied borrowing rate"
- Should show estimated value

**✓ Extraction Quality Badge:**
- Confidence: HIGH
- All values sourced: ✓
- Cross-validated: ✓

**✓ Status Badges in Table:**
- Item 4 shows: ⚠️ Unverified (yellow)
- Items 10a, 11a, 14a show: ✓ Verified (green)
- Borrowing rate shows: 🚩 TP Opportunity (red)

### 4. Report Results

After testing, provide:

1. **Console logs** showing extraction process
2. **Screenshots or description** of:
   - Warnings section
   - TP opportunities section
   - Results table with status badges
   - Extraction quality badge
3. **Confirmation** that Item 4 is NOT claimed as "IC service fees" but flagged as unverified
4. **Any errors** encountered

## Success Criteria

- ✅ Upload completes without errors
- ✅ All IC transactions extracted with sources
- ✅ Item 4 flagged as unverified (not claimed as IC)
- ✅ TP opportunity detected and displayed
- ✅ UI shows validation warnings prominently
- ✅ No hallucinated values

Run the test now and report results.
