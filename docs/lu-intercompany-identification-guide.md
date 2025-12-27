# Luxembourg GAAP - Inter-Company Transaction Identification Guide

## Purpose
This guide helps identify and extract inter-company (IC) transactions from Luxembourg annual accounts for transfer pricing opportunity analysis.

---

## IDENTIFICATION KEYWORDS

### French Terms (Primary):
- **entreprises liées** = affiliated undertakings/companies (MOST IMPORTANT)
- **entreprises avec lesquelles il existe un lien de participation** = companies with participating interest
- **filiales** = subsidiaries
- **société mère** = parent company
- **entreprises du groupe** = group companies
- **provenant d'entreprises liées** = from affiliated undertakings (revenue side)
- **concernant des entreprises liées** = concerning affiliated undertakings (expense side)

### English Terms (in translated accounts):
- affiliated undertakings
- related parties
- group companies
- parent company
- subsidiary/subsidiaries
- inter-company / intercompany

---

## IC FINANCING ARRANGEMENTS

### Structure 1: IC Loans Provided (Company is Lender)

#### Balance Sheet Location:
**Fixed Assets (Long-term IC loans):**
- Section: C. Fixed Assets → III. Financial Assets
- Line item: "Créances sur des entreprises liées"
- English: "Amounts owed by affiliated undertakings"

**Current Assets (Short-term IC loans):**
- Section: D. Current Assets → II. Debtors
- Line item: "Créances sur entreprises liées" (becoming due within one year)
- English: "Amounts owed by affiliated undertakings (< 1 year)"

#### P&L Location (Interest Income):
**Primary location:**
- Item 10: "Produits provenant d'autres placements et créances de l'actif immobilisé"
- Sub-item 10a: "provenant d'entreprises liées"
- English: "Income from other investments and loans - from affiliated undertakings"

**Alternative location:**
- Item 11: "Autres intérêts et autres produits assimilés"
- Sub-item 11a: "provenant d'entreprises liées"
- English: "Other interest receivable - from affiliated undertakings"

#### Typical Note Disclosures:
```
Note X - Amounts owed by affiliated undertakings:
The company has granted a loan to ABC Sister Co S.à r.l. with the following terms:
- Principal amount: EUR 5,000,000
- Interest rate: 3.5% per annum
- Maturity: 31 December 2028
- Subordinated: No

Note Y - Income from other investments:
Income from other investments comprises interest on the loan to ABC Sister Co 
amounting to EUR 175,000 (prior year: EUR 150,000).
```

#### What to Extract:
```json
{
  "ic_loan_provided": {
    "balance_sheet": {
      "amount": 5000000,
      "source": "Balance Sheet - Fixed Assets - Financial Assets - Créances sur entreprises liées, Note 6, page 8",
      "maturity": "Long-term (> 1 year)",
      "borrower": "ABC Sister Co S.à r.l.",
      "terms": {
        "interest_rate": "3.5%",
        "maturity_date": "2028-12-31",
        "subordinated": false
      }
    },
    "pnl_interest": {
      "amount": 175000,
      "source": "P&L Item 10a, Note Y, page 12",
      "prior_year": 150000
    },
    "validation": {
      "implied_rate": "3.5%",
      "rate_matches_disclosed": true,
      "flag": null
    }
  }
}
```

### Structure 2: IC Loans Received (Company is Borrower)

#### Balance Sheet Location:
**Current Liabilities (Short-term IC loans):**
- Section: C. Creditors (becoming due within one year)
- Line item: "Dettes envers des entreprises liées"
- English: "Amounts owed to affiliated undertakings (< 1 year)"

**Long-term Liabilities:**
- Section: C. Creditors (becoming due after more than one year)
- Line item: "Dettes envers des entreprises liées"
- English: "Amounts owed to affiliated undertakings (> 1 year)"

#### P&L Location (Interest Expense):
- Item 14: "Intérêts et charges assimilées"
- Sub-item 14a: "concernant des entreprises liées"
- English: "Interest payable - concerning affiliated undertakings"

#### Typical Note Disclosures:
```
Note X - Amounts owed to affiliated undertakings:
The company has received a loan from Parent Co S.A. with the following terms:
- Principal amount: EUR 2,000,000
- Interest rate: 4.0% per annum
- Maturity: 30 June 2026
- Renewable: Annual review

Note Y - Interest payable:
Interest payable includes EUR 80,000 concerning the loan from Parent Co S.A.
```

#### What to Extract:
```json
{
  "ic_loan_received": {
    "balance_sheet": {
      "amount": 2000000,
      "source": "Balance Sheet - Creditors - Dettes envers entreprises liées (>1 year), Note X, page 9",
      "maturity": "Long-term (> 1 year)",
      "lender": "Parent Co S.A.",
      "terms": {
        "interest_rate": "4.0%",
        "maturity_date": "2026-06-30",
        "renewable": "Annual review"
      }
    },
    "pnl_interest": {
      "amount": 80000,
      "source": "P&L Item 14a, Note Y, page 15"
    },
    "validation": {
      "implied_rate": "4.0%",
      "rate_matches_disclosed": true,
      "flag": null
    }
  }
}
```

### 🚨 ZERO-SPREAD INDICATOR (CRITICAL):

**Scenario A: IC Loan with No Interest Income**
```
Balance Sheet: "Créances sur entreprises liées" = EUR 5,000,000
P&L Item 10a: EUR 0 or not disclosed
P&L Item 11a: EUR 0 or not disclosed
Notes: No mention of IC interest income

→ FLAG: HIGH PRIORITY TP OPPORTUNITY
→ Issue: IC loan provided but no interest charged
→ Action: Immediate TP review needed
```

**Scenario B: IC Loan with No Interest Expense**
```
Balance Sheet: "Dettes envers entreprises liées" = EUR 2,000,000
P&L Item 14a: EUR 0 or not disclosed
Notes: No mention of IC interest expense

→ FLAG: MEDIUM PRIORITY (less common as TP issue)
→ Issue: IC loan received but no interest paid
→ Could indicate equity contribution misclassified as loan
```

---

## IC SERVICES/MANAGEMENT FEES

### Structure 3: Services Provided (Revenue)

#### P&L Location:
**Primary location:**
- Item 4: "Autres produits d'exploitation"
- English: "Other operating income"

**Alternative location (if main business activity):**
- Item 1: "Montant net du chiffre d'affaires"
- English: "Net turnover"

#### Typical Note Disclosures:
```
Note X - Other operating income:
Other operating income comprises:
- Management fees charged to subsidiaries              EUR 120,000
- Administrative services to ABC Sister Co             EUR 45,000
- IT support services to group companies               EUR 30,000
Total                                                  EUR 195,000

The management fees are charged based on a cost-plus 5% methodology 
covering strategic guidance, financial oversight, and regulatory compliance.
```

#### What to Extract:
```json
{
  "ic_services_provided": {
    "total_amount": 195000,
    "source": "P&L Item 4, Note X, page 11",
    "breakdown": [
      {
        "type": "Management fees",
        "amount": 120000,
        "recipients": "Subsidiaries (multiple)",
        "methodology": "Cost-plus 5%"
      },
      {
        "type": "Administrative services",
        "amount": 45000,
        "recipient": "ABC Sister Co"
      },
      {
        "type": "IT support",
        "amount": 30000,
        "recipients": "Group companies"
      }
    ],
    "documentation_quality": "Good - methodology disclosed",
    "flag": null
  }
}
```

### Structure 4: Services Received (Expense)

#### P&L Location:
**Primary locations:**
- Item 5b: "Autres charges externes"
- English: "Other external charges"

**OR**
- Item 8: "Autres charges d'exploitation"
- English: "Other operating charges"

#### Typical Note Disclosures:
```
Note X - Other external charges:
Other external charges include EUR 85,000 for management fees paid to Parent Co
for strategic and financial advisory services.
```

#### What to Extract:
```json
{
  "ic_services_received": {
    "amount": 85000,
    "source": "P&L Item 5b, Note X, page 14",
    "type": "Management fees",
    "provider": "Parent Co",
    "description": "Strategic and financial advisory services",
    "documentation_quality": "Moderate - general description",
    "flag": "Request detailed service agreement if >EUR 100k"
  }
}
```

---

## IC DIVIDENDS

### Structure 5: Dividend Income from Subsidiaries

#### P&L Location:
- Item 9: "Produits provenant de participations"
- Sub-item 9a: "provenant d'entreprises liées"
- English: "Income from participating interests - from affiliated undertakings"

#### Typical Note Disclosures:
```
Note X - Income from participating interests:
The company received dividends from its subsidiary XYZ S.à r.l. 
amounting to EUR 500,000 (prior year: EUR 450,000).
```

#### What to Extract:
```json
{
  "ic_dividends_received": {
    "amount": 500000,
    "source": "P&L Item 9a, Note X, page 13",
    "from": "XYZ S.à r.l. (subsidiary)",
    "prior_year": 450000,
    "flag": null
  }
}
```

---

## COMPREHENSIVE EXTRACTION CHECKLIST

### Phase 1: Balance Sheet Scan

```
☐ Scan Fixed Assets → Financial Assets
   → Look for "Créances sur des entreprises liées"
   → Extract amount, note reference, page number
   
☐ Scan Current Assets → Debtors
   → Look for "Créances sur entreprises liées" (within 1 year)
   → Extract amount, note reference, page number
   
☐ Scan Creditors (both <1 year and >1 year)
   → Look for "Dettes envers des entreprises liées"
   → Extract amount, maturity, note reference, page number
   
☐ Scan Fixed Assets → Financial Assets
   → Look for "Parts dans des entreprises liées" (shareholdings)
   → Extract amount for context (not a loan, but shows group structure)
```

### Phase 2: P&L Scan

```
☐ Item 4 - Other Operating Income
   → Check for note reference
   → Read note for IC service fees breakdown
   
☐ Item 9a - Income from Participating Interests
   → Look for "provenant d'entreprises liées"
   → Extract IC dividend income
   
☐ Item 10a - Income from Other Investments
   → Look for "provenant d'entreprises liées"
   → Extract IC interest income (PRIMARY LOCATION)
   
☐ Item 11a - Other Interest Receivable
   → Look for "provenant d'entreprises liées"
   → Extract additional IC interest income
   
☐ Item 14a - Interest Payable
   → Look for "concernant des entreprises liées"
   → Extract IC interest expense
   
☐ Item 5b or 8 - External Charges / Operating Charges
   → Check notes for IC service fees paid
```

### Phase 3: Notes Deep Dive

```
☐ Find all notes referenced next to IC balance sheet items
   → Read for loan terms, interest rates, maturity, subordination
   
☐ Find all notes referenced next to IC P&L items
   → Read for detailed breakdowns, counterparty names, methodologies
   
☐ Look for general note on "Related Party Transactions"
   → May contain comprehensive IC transaction summary
   
☐ Look for note on "Off-Balance Sheet Commitments"
   → May disclose IC guarantees, letters of comfort
```

### Phase 4: Cross-Validation

```
☐ IC loan on balance sheet?
   → Should have corresponding interest income/expense in P&L
   → Calculate implied rate: Interest / Loan Balance
   → Flag if rate <1% or >10%
   → FLAG if zero interest (ZERO-SPREAD OPPORTUNITY)
   
☐ IC interest in P&L?
   → Should have corresponding loan on balance sheet
   → If not found → ERROR in extraction
   
☐ All amounts sourced?
   → Every figure must have "Item/Note/Page" reference
   
☐ Reasonable amounts?
   → Interest EUR 67.8M on small company → IMPOSSIBLE
   → Service fees EUR 91.3M with no description → SUSPICIOUS
```

---

## COMMON MISTAKES TO AVOID

### ❌ MISTAKE 1: Hallucinating IC Items

**Example of Error:**
```
AI Output: "IC service fees: EUR 91,300,000"
Reality: No such amount exists anywhere in the accounts
```

**Prevention:**
- Extract ONLY items explicitly labeled "entreprises liées" or disclosed in IC notes
- If amount seems large relative to company size → VERIFY TWICE
- Never invent or calculate amounts not explicitly stated

### ❌ MISTAKE 2: Extracting Wrong Line Item Amounts

**Example of Error:**
```
P&L Item 10: Total income EUR 100,000 (Note 8)
Note 8: "Of which from affiliated undertakings: EUR 67,800"
AI extracts: EUR 100,000 ← WRONG
```

**Prevention:**
- Always read the notes
- Extract the IC portion, not the total
- Source both the P&L item AND the note

### ❌ MISTAKE 3: Missing Maturity Split

**Example of Error:**
```
Balance sheet shows:
- Créances sur entreprises liées (<1 year): EUR 1,000,000
- Créances sur entreprises liées (>1 year): EUR 4,000,000
AI extracts: EUR 1,000,000 only ← INCOMPLETE
```

**Prevention:**
- Check BOTH current and non-current sections
- Add amounts if same item appears in both sections
- Document split in source reference

### ❌ MISTAKE 4: Ignoring French/English Label Variations

**Example of Error:**
```
Looking for: "Amounts owed by affiliated undertakings"
Actual label in PDF: "Créances sur des entreprises liées"
AI: "Not found" ← WRONG SEARCH TERM
```

**Prevention:**
- Search for BOTH French and English terms
- Use keyword list from this guide
- Visual scan if text search fails

### ❌ MISTAKE 5: No Cross-Validation

**Example of Error:**
```
Extracted IC interest income: EUR 67,800
Never checked if IC loan exists on balance sheet
Could be hallucinated data
```

**Prevention:**
- ALWAYS cross-reference IC P&L items with balance sheet
- Calculate implied rates as sanity check
- Flag mismatches for human review

---

## OUTPUT TEMPLATE

### Complete IC Extraction Output:

```json
{
  "company_info": {
    "name": "ABC Company S.à r.l.",
    "rcs_number": "B123456",
    "financial_year_end": "2023-12-31",
    "currency": "EUR"
  },
  
  "intercompany_financing": {
    "ic_loans_provided": {
      "exists": true,
      "balance_sheet_amount": 5000000,
      "source": "Balance Sheet - Fixed Assets - Créances sur entreprises liées, Note 6, page 8",
      "maturity": "Long-term (>1 year)",
      "terms": {
        "borrower": "Sister Co S.à r.l.",
        "interest_rate": "3.5%",
        "maturity_date": "2028-12-31"
      },
      "pnl_interest_income": {
        "amount": 175000,
        "source": "P&L Item 10a, Note 8, page 12",
        "implied_rate": "3.5%",
        "rate_validation": "Matches disclosed rate"
      },
      "flags": []
    },
    
    "ic_loans_received": {
      "exists": true,
      "balance_sheet_amount": 2000000,
      "source": "Balance Sheet - Creditors - Dettes envers entreprises liées (>1 year), Note 7, page 9",
      "maturity": "Long-term (>1 year)",
      "terms": {
        "lender": "Parent Co S.A.",
        "interest_rate": "4.0%",
        "maturity_date": "2026-06-30"
      },
      "pnl_interest_expense": {
        "amount": 80000,
        "source": "P&L Item 14a, Note 12, page 15",
        "implied_rate": "4.0%",
        "rate_validation": "Matches disclosed rate"
      },
      "flags": []
    }
  },
  
  "intercompany_services": {
    "services_provided": {
      "total_amount": 195000,
      "source": "P&L Item 4, Note 9, page 11",
      "breakdown": [
        {
          "type": "Management fees",
          "amount": 120000,
          "recipients": "Various subsidiaries",
          "methodology": "Cost-plus 5%"
        },
        {
          "type": "Administrative services",
          "amount": 45000,
          "recipient": "Sister Co"
        },
        {
          "type": "IT support",
          "amount": 30000,
          "recipients": "Group companies"
        }
      ],
      "flags": []
    },
    
    "services_received": {
      "amount": 85000,
      "source": "P&L Item 5b, Note 10, page 14",
      "type": "Management fees",
      "provider": "Parent Co",
      "flags": []
    }
  },
  
  "intercompany_dividends": {
    "dividends_received": {
      "amount": 500000,
      "source": "P&L Item 9a, Note 11, page 13",
      "from": "XYZ Subsidiary",
      "flags": []
    }
  },
  
  "zero_spread_analysis": {
    "zero_spread_detected": false,
    "details": "All IC loans have corresponding interest income/expense"
  },
  
  "tp_opportunity_flags": [],
  
  "extraction_quality": {
    "all_amounts_sourced": true,
    "cross_validated": true,
    "confidence": "high"
  }
}
```

---

## PRIORITY FLAGGING SYSTEM

### 🔴 HIGH PRIORITY FLAGS

```json
{
  "flag_type": "ZERO_SPREAD_IC_FINANCING",
  "severity": "HIGH",
  "details": "IC loan provided of EUR 5,000,000 (Note 6, page 8) but no IC interest income in P&L Items 10a, 11a or notes",
  "tp_opportunity": "Potential absence of TP policy - arm's length interest should be charged",
  "estimated_value": "EUR 150k-250k annual interest at 3-5% arm's length rate",
  "action": "Immediate TP review required"
}
```

```json
{
  "flag_type": "EXTREMELY_LOW_IC_RATE",
  "severity": "HIGH",
  "details": "IC loan EUR 5M with interest EUR 25k = 0.5% implied rate",
  "tp_opportunity": "Interest rate significantly below arm's length",
  "comparable_range": "3-5% for IC financing",
  "action": "TP documentation review and rate adjustment"
}
```

```json
{
  "flag_type": "LARGE_UNDOCUMENTED_SERVICE_FEES",
  "severity": "HIGH",
  "details": "IC service fees EUR 500k with vague description 'management fees'",
  "tp_opportunity": "Service agreement and TP documentation likely missing",
  "action": "Request detailed service level agreements and TP study"
}
```

### 🟡 MEDIUM PRIORITY FLAGS

```json
{
  "flag_type": "IC_LOAN_NO_DISCLOSED_TERMS",
  "severity": "MEDIUM",
  "details": "IC loan EUR 2M on balance sheet but no interest rate or maturity disclosed in notes",
  "tp_opportunity": "Loan agreement should specify terms for TP compliance",
  "action": "Request underlying IC loan agreement"
}
```

```json
{
  "flag_type": "ONE_WAY_IC_TRANSACTIONS",
  "severity": "MEDIUM",
  "details": "Company receives IC loans and services but provides none to group",
  "tp_opportunity": "Asymmetric transactions may indicate transfer pricing planning",
  "action": "Review if company's role in group structure makes commercial sense"
}
```

### 🟢 LOW PRIORITY FLAGS

```json
{
  "flag_type": "WELL_DOCUMENTED_IC_TRANSACTIONS",
  "severity": "LOW",
  "details": "All IC transactions have disclosed rates/terms and appear commercially reasonable",
  "tp_opportunity": "Low risk but periodic review recommended",
  "action": "Standard monitoring"
}
```

---

## FINAL VALIDATION CHECKLIST

Before submitting extracted data:

```
☑ Every extracted amount has a source (Item/Note/Page)
☑ IC balance sheet items cross-referenced with P&L
☑ Implied interest rates calculated where possible
☑ All rates and amounts seem reasonable (not hallucinated)
☑ Zero-spread scenarios identified and flagged
☑ French and English labels correctly matched
☑ Maturity splits properly captured
☑ Notes fully read for all referenced items
☑ No invented amounts or descriptions
☑ Output JSON structure complete and valid
```

**If ANY item unchecked → DO NOT SUBMIT → FIX FIRST**
