# TP Opportunity Finder - Complete Redesign Guide

## Overview

This document contains all prompts and instructions to redesign the TP Opportunity Finder application with a minimalist, professional Big Four aesthetic.

**Design Philosophy:**
- Clean, data-dense interface (like Bloomberg or internal Big Four tools)
- Traffic light system (🔴🟠🟢) for instant risk recognition
- Luxembourg TP-specific extraction and analysis
- 3-4 pages maximum (Companies, Company Detail, Upload, Opportunities)
- No clutter, badges, or decorative elements

**Key Features:**
- Spread vs market benchmark comparison
- Full audit trail
- Enhanced Luxembourg GAAP extraction
- Professional, minimalist design

---

## INSTRUCTIONS FOR CLAUDE CODE

Before executing any prompts, Claude must:

1. Read `.claude-rules` for project coding standards
2. Read `docs/TP_OPPORTUNITY_FINDER_MASTER_PROMPT.md` for original specifications
3. Read this entire document to understand the redesign goals
4. Execute prompts in order (PROMPT 1 through PROMPT 8)
5. After each prompt: verify build passes, report completion, wait for approval
6. If errors occur: fix them before proceeding

**Communication Protocol:**
- After each prompt completion, summarize what was changed
- List any files created or modified
- Report any issues encountered
- Wait for "Continue" or "Proceed" before next prompt

---

## PROMPT 0: PREPARATION & CONTEXT

```
Read these files to understand the project:
1. .claude-rules
2. docs/TP_OPPORTUNITY_FINDER_MASTER_PROMPT.md

Then read this entire redesign guide to understand the new direction.

The app is being redesigned with these principles:
- Minimalist, professional Big Four aesthetic
- Traffic light system (red/amber/green) for risk indicators
- 3-4 main pages only (Companies, Company Detail, Upload, Opportunities)
- Data-dense but clean presentation
- Luxembourg TP-specific analysis
- Spread vs market benchmark comparison
- Full audit trail for tracking outreach

Confirm you understand the redesign goals, then I'll provide the first implementation prompt.
```

---

## PROMPT 1: ENHANCED CLAUDE API EXTRACTION

**Purpose:** Upgrade the PDF extraction to capture all Luxembourg TP-relevant data

```
Update src/lib/services/pdfExtractor.ts with an enhanced extraction prompt.

Replace the current system and user prompts with the following:

SYSTEM PROMPT:
"""
You are a senior Luxembourg transfer pricing specialist with deep expertise in:
- Luxembourg GAAP (Law of 19 December 2002)
- Luxembourg TP Circular (LIR n° 56/1 - 56bis/1)
- OECD Transfer Pricing Guidelines (especially Chapter X on Financial Transactions)
- Article 56 and 56bis LIR requirements
- Financial intermediary analysis

You analyze annual accounts to identify transfer pricing risks and opportunities.
You understand both French and English accounting terminology.
You extract maximum information from financial statements and notes.

Respond ONLY with valid JSON. No explanations or markdown.
"""

USER PROMPT:
"""
Analyze this Luxembourg company annual accounts document thoroughly.

DOCUMENT TEXT:
{document_text}

EXTRACT ALL OF THE FOLLOWING (use null if not found):

{
  "company_profile": {
    "name": "string",
    "rcs_number": "string (format: B123456)",
    "legal_form": "SA|SARL|SCS|SCA|SE|SCSp|SNC|other",
    "registered_address": "string",
    "fiscal_year_start": "YYYY-MM-DD",
    "fiscal_year_end": "YYYY-MM-DD",
    "incorporation_date": "string if mentioned",
    "principal_activity": "string - extract from notes/management report",
    "industry_sector": "string - infer from activity",
    "number_of_employees": "number or null",
    "directors": ["array of director names if disclosed"],
    "management_company": "string if admin is outsourced",
    "auditor": "string"
  },

  "group_structure": {
    "parent_company": "string",
    "parent_country": "ISO 2-letter code",
    "parent_ownership_pct": "number",
    "ultimate_parent": "string",
    "ultimate_parent_country": "ISO 2-letter code",
    "is_ultimate_parent_listed": "boolean",
    "subsidiaries": [
      {
        "name": "string",
        "country": "ISO code",
        "ownership_pct": "number",
        "activity": "string if disclosed"
      }
    ],
    "related_parties_mentioned": ["array of all related party names with countries"]
  },

  "balance_sheet": {
    "currency": "EUR",
    "total_assets": "number",
    "formation_expenses": "number",
    "intangible_assets": "number",
    "tangible_assets": "number",
    "financial_assets": {
      "shares_in_affiliated": "number - Parts dans entreprises liées",
      "loans_to_affiliated": "number - Créances sur entreprises liées (fixed)",
      "participating_interests": "number",
      "other_financial_assets": "number"
    },
    "current_assets": {
      "inventory": "number",
      "trade_receivables": "number",
      "ic_receivables_current": "number - Créances sur entreprises liées (current)",
      "other_receivables": "number",
      "cash": "number"
    },
    "total_equity": "number",
    "share_capital": "number",
    "share_premium": "number",
    "reserves": "number",
    "retained_earnings": "number",
    "profit_loss_year": "number",
    "provisions": "number",
    "total_liabilities": "number",
    "liabilities": {
      "bonds": "number",
      "bank_debt": "number",
      "ic_payables": "number - Dettes envers entreprises liées",
      "trade_payables": "number",
      "tax_liabilities": "number",
      "other_payables": "number"
    }
  },

  "profit_loss": {
    "currency": "EUR",
    "turnover": "number",
    "other_operating_income": "number",
    "raw_materials": "number",
    "other_external_charges": "number",
    "staff_costs": "number",
    "depreciation": "number",
    "other_operating_expenses": "number",
    "operating_result": "number",
    "financial_income": {
      "income_from_participations_total": "number",
      "income_from_participations_affiliated": "number",
      "interest_income_total": "number",
      "interest_income_affiliated": "number - specifically from related parties",
      "other_financial_income": "number"
    },
    "financial_expenses": {
      "interest_expense_total": "number",
      "interest_expense_affiliated": "number - specifically to related parties",
      "other_financial_expenses": "number"
    },
    "financial_result": "number",
    "exceptional_result": "number",
    "tax_expense": "number",
    "net_profit_loss": "number"
  },

  "intercompany_transactions": {
    "financing": {
      "loans_receivable": {
        "total_amount": "number",
        "counterparties": [
          {
            "name": "string",
            "country": "ISO code",
            "amount": "number",
            "stated_rate": "string - as written in notes",
            "effective_rate_calculated": "number - interest/principal as %"
          }
        ]
      },
      "loans_payable": {
        "total_amount": "number",
        "counterparties": [
          {
            "name": "string",
            "country": "ISO code",
            "amount": "number",
            "stated_rate": "string - as written in notes",
            "effective_rate_calculated": "number - interest/principal as %"
          }
        ]
      },
      "spread_analysis": {
        "average_lending_rate": "number %",
        "average_borrowing_rate": "number %",
        "spread_bps": "number - in basis points",
        "spread_vs_market": "string - comparison to typical 25-75 bps",
        "is_zero_spread": "boolean",
        "is_low_spread": "boolean - less than 25 bps"
      }
    },
    "services": {
      "management_fees_paid": {
        "amount": "number",
        "counterparty": "string",
        "description": "string from notes"
      },
      "management_fees_received": {
        "amount": "number",
        "counterparty": "string",
        "description": "string from notes"
      },
      "service_charges": [
        {
          "type": "string",
          "direction": "paid|received",
          "amount": "number",
          "counterparty": "string"
        }
      ]
    },
    "ip_transactions": {
      "royalties_paid": {
        "amount": "number",
        "counterparty": "string",
        "description": "string"
      },
      "royalties_received": {
        "amount": "number",
        "counterparty": "string",
        "description": "string"
      },
      "license_fees": "number"
    },
    "guarantees": {
      "guarantees_given": [
        {
          "beneficiary": "string",
          "amount": "number",
          "fee_received": "number or null",
          "fee_rate_bps": "number or null"
        }
      ],
      "guarantees_received": [
        {
          "provider": "string",
          "amount": "number",
          "fee_paid": "number or null"
        }
      ],
      "guarantees_without_fee_flag": "boolean"
    },
    "cash_pooling": {
      "is_participant": "boolean",
      "role": "header|participant|null",
      "details": "string from notes"
    },
    "dividends": {
      "received_from_subsidiaries": "number",
      "paid_to_parent": "number"
    }
  },

  "financial_intermediation_analysis": {
    "is_financial_intermediary": "boolean - borrows to on-lend",
    "net_ic_position": "number - receivables minus payables",
    "net_interest_margin_eur": "number - interest income IC minus interest expense IC",
    "net_interest_margin_pct": "number - margin as % of average loans",
    "margin_assessment": "string - VERY LOW/LOW/ADEQUATE/HIGH",
    "market_benchmark_spread_bps": "25-75 bps typical for treasury",
    "company_spread_vs_benchmark": "string - e.g., '0 bps vs market 25-75 bps'"
  },

  "thin_capitalisation_analysis": {
    "total_debt": "number",
    "total_equity": "number",
    "debt_to_equity_ratio": "number",
    "ic_debt": "number",
    "ic_debt_to_total_debt_pct": "number",
    "is_thin_cap_risk": "boolean - D/E > 4:1",
    "is_highly_leveraged": "boolean - D/E > 6:1",
    "equity_at_risk_assessment": "string"
  },

  "documentation_requirements": {
    "total_ic_volume": "number - sum of all IC transactions",
    "exceeds_1m_threshold": "boolean",
    "tp_policy_mentioned": "boolean",
    "tp_policy_details": "string if mentioned",
    "master_file_required": "boolean",
    "local_file_required": "boolean",
    "article_56bis_exposure": "HIGH|MEDIUM|LOW"
  },

  "notes_extraction": {
    "related_party_disclosure_full_text": "string - complete related party note",
    "accounting_policies_relevant": "string - any TP-relevant policies",
    "significant_events": "string - any significant transactions or events",
    "commitments_contingencies": "string - off-balance sheet items",
    "subsequent_events": "string if any"
  },

  "risk_indicators": {
    "ic_risk": {
      "level": "RED|AMBER|GREEN",
      "reasons": ["array of specific reasons"]
    },
    "tp_risk": {
      "level": "RED|AMBER|GREEN",
      "reasons": ["array of specific reasons"]
    },
    "doc_risk": {
      "level": "RED|AMBER|GREEN",
      "reasons": ["array of specific reasons"]
    }
  },

  "ai_analysis": {
    "executive_summary": "string - 3-4 sentences summarizing TP position",
    "key_findings": [
      {
        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
        "finding": "string - specific issue",
        "amount_involved": "number if applicable",
        "reference": "string - OECD/Luxembourg law reference"
      }
    ],
    "recommended_services": ["array of specific services to propose"],
    "engagement_estimate_eur": {
      "low": "number",
      "high": "number"
    },
    "outreach_angle": "string - suggested pitch for contacting company",
    "priority_tier": "A|B|C",
    "confidence_score": "HIGH|MEDIUM|LOW"
  },

  "extraction_metadata": {
    "language_detected": "FR|EN|DE|MIXED",
    "document_quality": "HIGH|MEDIUM|LOW",
    "pages_processed": "number",
    "extraction_notes": "string - any issues or limitations"
  }
}

TRAFFIC LIGHT RULES:
IC Risk (Intercompany):
- RED: Zero spread OR IC volume > €10M OR guarantee without fee
- AMBER: Spread < 50 bps OR IC volume €1-10M
- GREEN: Spread > 50 bps AND IC volume < €1M

TP Risk (Transfer Pricing):
- RED: Zero spread OR D/E > 4:1 OR no TP policy with IC > €1M
- AMBER: Low spread (< 25 bps) OR D/E 2-4:1
- GREEN: Adequate spread AND D/E < 2:1

DOC Risk (Documentation):
- RED: IC > €1M AND no TP policy mentioned
- AMBER: IC > €1M (documentation required)
- GREEN: IC < €1M OR TP policy exists

IMPORTANT:
- All amounts in EUR
- Interest rates as percentages (e.g., 2.5 for 2.5%)
- Spread in basis points (e.g., 50 for 0.50%)
- Calculate effective rates: annual interest / principal amount
- Market benchmark for treasury spread: 25-75 basis points
- Always extract full related party note text
- Flag any discrepancy between stated and calculated rates
"""

Also update the response parsing to:
1. Handle this new comprehensive JSON structure
2. Store all fields in appropriate database tables
3. Calculate any derived metrics if raw data exists but calculated fields are null
4. Handle partial extractions gracefully (some sections may be null)

Create or update these database tables if needed to store the new fields.

Run npm run build to verify no errors.
```

---

## PROMPT 2: DATABASE SCHEMA UPDATE

**Purpose:** Add tables for audit trail and enhanced data storage

```
Update the Supabase database schema to support the redesigned app.

Create a new migration file and run these changes:

1. ADD AUDIT TRAIL TABLE:
CREATE TABLE audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'created', 'viewed', 'contacted', 'meeting', 'proposal', 'won', 'lost', 'note_added'
  action_details JSONB,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_trail_company ON audit_trail(company_id);
CREATE INDEX idx_audit_trail_date ON audit_trail(performed_at DESC);

2. ADD OPPORTUNITY STATUS TABLE:
CREATE TABLE opportunity_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'meeting', 'proposal', 'won', 'lost'
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  estimated_value_low DECIMAL(15,2),
  estimated_value_high DECIMAL(15,2),
  next_action TEXT,
  next_action_date DATE,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

3. ADD MARKET BENCHMARKS TABLE:
CREATE TABLE market_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  benchmark_type TEXT NOT NULL, -- 'treasury_spread', 'guarantee_fee', 'management_fee'
  low_value DECIMAL(10,4),
  high_value DECIMAL(10,4),
  unit TEXT, -- 'bps', 'percent', 'eur'
  description TEXT,
  source TEXT,
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default benchmarks
INSERT INTO market_benchmarks (benchmark_type, low_value, high_value, unit, description, source) VALUES
('treasury_spread', 25, 75, 'bps', 'Typical spread for treasury/financing entities', 'Luxembourg TP Circular'),
('guarantee_fee', 25, 75, 'bps', 'Typical guarantee fee range', 'Market practice'),
('management_fee_admin', 2, 5, 'percent', 'Management fee as % of costs plus markup', 'OECD Guidelines');

4. UPDATE COMPANIES TABLE - Add new fields if not exist:
ALTER TABLE companies ADD COLUMN IF NOT EXISTS principal_activity TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_sector TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS number_of_employees INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_financial_intermediary BOOLEAN;

5. UPDATE FINANCIAL_DATA TABLE - Add new fields:
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS net_ic_position DECIMAL(20,2);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS net_interest_margin_eur DECIMAL(20,2);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS net_interest_margin_pct DECIMAL(10,4);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS spread_bps INTEGER;
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS spread_vs_benchmark TEXT;

6. UPDATE TP_ASSESSMENTS TABLE - Add traffic light fields:
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS ic_risk_level TEXT; -- RED/AMBER/GREEN
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS ic_risk_reasons TEXT[];
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS tp_risk_level TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS tp_risk_reasons TEXT[];
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS doc_risk_level TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS doc_risk_reasons TEXT[];
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS spread_vs_market TEXT;

7. ADD RLS POLICIES for new tables:
-- Audit trail
CREATE POLICY "Users can view audit trail" ON audit_trail FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert audit trail" ON audit_trail FOR INSERT TO authenticated WITH CHECK (true);

-- Opportunity status
CREATE POLICY "Users can manage opportunity status" ON opportunity_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Market benchmarks (read only for users)
CREATE POLICY "Users can view benchmarks" ON market_benchmarks FOR SELECT TO authenticated USING (true);

Create TypeScript types for all new tables in src/types/database.ts.

Run the migration and verify tables are created.
```

---

## PROMPT 3: CLEAN LAYOUT STRUCTURE

**Purpose:** Create a minimal, professional layout with simple navigation

```
Rebuild the app layout with a minimalist professional design.

1. UPDATE src/app/(dashboard)/layout.tsx:

Create a clean layout with:
- Minimal top navigation bar (not sidebar)
- White background
- Maximum content width (max-w-7xl)
- Clean typography

Structure:
┌─────────────────────────────────────────────────────────────────┐
│  TP OPPORTUNITY FINDER          [Companies] [Upload] [Settings] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      [Page Content]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

2. CREATE src/components/layout/TopNav.tsx:

- Logo/Title on left: "TP Opportunity Finder"
- Navigation links center/right: Companies, Upload, Settings
- User menu on far right: email + sign out dropdown
- Sticky top position
- Clean white background with subtle bottom border
- No icons in nav (text only)

3. UPDATE src/app/globals.css:

Set professional design system:
:root {
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #4a4a6a;
  --color-background: #ffffff;
  --color-surface: #f8f9fa;
  --color-border: #e5e7eb;
  --color-accent: #1e3a5f;
  
  --color-red: #dc2626;
  --color-amber: #f59e0b;
  --color-green: #16a34a;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-text-primary);
  background: var(--color-background);
}

/* Tabular numbers for financial data */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

4. DELETE old sidebar components if they exist

5. Remove any colorful badges, emojis in navigation, or decorative elements

The design should feel like a professional internal tool, not a consumer app.

Run npm run dev and verify the new layout appears correctly.
```

---

## PROMPT 4: COMPANIES PAGE (Main Dashboard)

**Purpose:** Create the main companies list with traffic light indicators

```
Rebuild src/app/(dashboard)/page.tsx (or /companies/page.tsx) as the main dashboard.

This is the primary view showing all analyzed companies with traffic light risk indicators.

LAYOUT:
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  COMPANIES                                                    [Filter] [Export] [Upload]│
│  X companies analyzed                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  Company              │ Group Parent        │ Revenue   │ Loans Rec. │ Loans Pay. │ IC │ TP │ DOC│
│  ─────────────────────┼─────────────────────┼───────────┼────────────┼────────────┼────┼────┼────│
│  ABC Holdings Sarl    │ German Ind. GmbH 🇩🇪 │ €2.1M     │ €45.0M     │ €42.0M     │ 🔴 │ 🔴 │ 🟠 │
│  XYZ Finance SA       │ UK Parent Ltd 🇬🇧    │ €0.5M     │ €12.3M     │ €11.8M     │ 🟠 │ 🟠 │ 🔴 │
│  123 Services Sarl    │ French Co SA 🇫🇷     │ €8.2M     │ €0.0M      │ €1.2M      │ 🟢 │ 🟢 │ 🟢 │
│                                                                                         │
│  [Showing 1-25 of 48]                                      [← Previous] [Next →]       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

COMPONENTS TO CREATE:

1. src/components/companies/CompaniesTable.tsx:
- Columns: Company, Group Parent (with country flag), Revenue, Loans Receivable, Loans Payable, IC, TP, DOC
- All financial numbers right-aligned with tabular-nums
- Format large numbers: €45.0M, €1.2M, €500K
- Traffic lights as colored circles (not emojis in production - use CSS)
- Row hover effect (subtle gray background)
- Click row to navigate to company detail
- Sortable columns (click header)

2. src/components/companies/TrafficLight.tsx:
- Simple colored circle component
- Props: level ('RED' | 'AMBER' | 'GREEN')
- Small tooltip on hover showing reasons
- CSS: width 12px, height 12px, border-radius 50%

3. src/components/companies/FilterDropdown.tsx:
- Filter by: Risk level (Any, Red only, Amber+Red), Fiscal year
- Simple dropdown, not complex multi-select
- Updates URL params for shareable links

4. src/components/companies/ExportButton.tsx:
- Export current filtered list to Excel
- Simple button, no dropdown needed

5. src/app/(dashboard)/page.tsx:
- Fetch companies with latest assessments from Supabase
- Join with financial_data and tp_assessments
- Server component with client table component
- Handle empty state: "No companies analyzed. Upload financial accounts to get started."

STYLING:
- Clean table with subtle borders
- Header row: font-medium, text-gray-600, uppercase text-xs
- Data rows: text-sm, py-3
- Hover: bg-gray-50
- No zebra striping (too busy)

Run npm run dev and verify the companies table displays correctly.
```

---

## PROMPT 5: COMPANY DETAIL PAGE

**Purpose:** Create comprehensive single-page company view

```
Rebuild src/app/(dashboard)/companies/[id]/page.tsx as a single scrollable detail page.

This page shows everything about one company - NO TABS, just scroll.

PAGE STRUCTURE (top to bottom):

1. HEADER
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Companies                              [Export PDF]  │
│                                                                 │
│  ABC HOLDINGS SARL                                              │
│  RCS B123456 │ SARL │ FY 2024                                  │
│  Parent: German Industrial GmbH (Germany)                       │
│                                                                 │
│  IC [🔴]  TP [🔴]  DOC [🟠]                                    │
└─────────────────────────────────────────────────────────────────┘

2. SECTION: COMPANY OVERVIEW (collapsible)
- Principal activity
- Group structure summary
- Directors/Management
- AI-generated summary from notes

3. SECTION: FINANCIAL POSITION
Two-column layout:
Left: Key Metrics (Total Assets, Equity, Debt, D/E Ratio)
Right: Balance Sheet Extract (IC items highlighted)

4. SECTION: INTEREST RATE ANALYSIS
┌─────────────────────────────────────────────────────────────────┐
│  LENDING (Loans Receivable)          │  BORROWING (Loans Payable)│
│  Principal: €45,000,000              │  Principal: €42,000,000   │
│  Interest Income: €1,125,000         │  Interest Expense: €1,050,000│
│  Effective Rate: 2.50%               │  Effective Rate: 2.50%    │
│  Stated Rate: "EURIBOR + margin"     │  Stated Rate: "EURIBOR + margin"│
├─────────────────────────────────────────────────────────────────┤
│  SPREAD ANALYSIS                                                │
│  Company Spread: 0 bps                                          │
│  Market Benchmark: 25-75 bps         ← Show comparison          │
│  Assessment: ZERO SPREAD - CRITICAL 🔴                          │
└─────────────────────────────────────────────────────────────────┘

5. SECTION: OTHER IC TRANSACTIONS
Simple table:
| Type | Direction | Counterparty | Amount | Notes |
| Management Fee | Paid | German Industrial GmbH | €45,000 | Admin services |
| Guarantee | Given | French Sub SA | €15,000,000 | No fee 🔴 |

6. SECTION: RELATED PARTY DISCLOSURES
- Full extracted text from notes
- List of countries involved

7. SECTION: RISK ASSESSMENT
Simple table with traffic lights:
| Risk Area | Status | Detail |
| Zero Spread | 🔴 | Lending and borrowing at identical 2.50% |
| Thin Cap | 🔴 | D/E ratio 8.1x exceeds 4:1 threshold |
| Documentation | 🔴 | IC > €1M, no TP policy mentioned |
| Guarantee Fee | 🔴 | €15M guarantee, no fee charged |

8. SECTION: RECOMMENDED APPROACH
- List of recommended services
- Engagement estimate: €XX,000 - €XX,000
- Outreach angle text with [Copy] button

9. SECTION: AUDIT TRAIL
┌─────────────────────────────────────────────────────────────────┐
│  ACTIVITY LOG                                    [Add Note]     │
│                                                                 │
│  Dec 27, 2024 14:32 - Company analyzed (auto)                  │
│  Dec 27, 2024 15:00 - Viewed by pkw1977@gmail.com              │
│  Dec 28, 2024 09:15 - Note: "Discussed with partner, proceed"  │
│  Dec 28, 2024 10:00 - Status changed to: Contacted             │
└─────────────────────────────────────────────────────────────────┘

COMPONENTS TO CREATE:

1. src/components/company/CompanyHeader.tsx
2. src/components/company/CompanyOverview.tsx
3. src/components/company/FinancialPosition.tsx
4. src/components/company/InterestRateAnalysis.tsx (with benchmark comparison)
5. src/components/company/ICTransactionsTable.tsx
6. src/components/company/RelatedPartyNotes.tsx
7. src/components/company/RiskAssessment.tsx
8. src/components/company/RecommendedApproach.tsx
9. src/components/company/AuditTrail.tsx

AUDIT TRAIL FUNCTIONALITY:
- Log when company is viewed (auto)
- Log when status changes
- Allow adding notes
- Show chronological list
- Store in audit_trail table

STYLING:
- Each section in a card (bg-white border rounded-lg p-6 mb-6)
- Section titles: text-lg font-semibold mb-4
- Collapsible sections using shadcn Collapsible
- Highlight IC amounts in accent color
- Traffic lights inline with text

Run npm run dev and verify the detail page displays all sections.
```

---

## PROMPT 6: UPLOAD PAGE

**Purpose:** Simple upload with optional metadata

```
Rebuild src/app/(dashboard)/upload/page.tsx with a clean, simple interface.

LAYOUT:
┌─────────────────────────────────────────────────────────────────┐
│  UPLOAD FINANCIAL ACCOUNTS                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │              📄 Drop PDF files here                     │   │
│  │                 or click to browse                      │   │
│  │                                                          │   │
│  │           Luxembourg annual accounts (PDF)              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OPTIONAL DETAILS (Claude will auto-detect if left blank)      │
│                                                                 │
│  Company Name  [________________________]                       │
│  RCS Number    [________________________]                       │
│  Fiscal Year   [2024 ▼]                                        │
│                                                                 │
│  [Upload & Analyze]                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RECENT UPLOADS                                                 │
│                                                                 │
│  accounts_2024.pdf    │ ✓ Complete │ ABC Holdings │ 2 hrs ago  │
│  xyz_finance.pdf      │ ✓ Complete │ XYZ Finance  │ 1 day ago  │
│  beta_annual.pdf      │ ⏳ Processing │ --        │ Just now   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

FEATURES:
1. Drag-and-drop zone
   - Dashed border by default
   - Solid border + light background on drag over
   - Accept only PDF
   - Max 50MB

2. Optional metadata form
   - All fields optional
   - Claude API will extract if not provided
   - Pre-populate if user provides

3. Recent uploads list
   - Show last 10 uploads
   - Status: Processing, Complete, Failed
   - Click to go to company (if complete)
   - Real-time status updates

4. Simple upload flow:
   - Upload file to Supabase storage
   - Create/find company record
   - Trigger extraction API
   - Show progress
   - Redirect to company detail when complete

COMPONENTS:
1. src/components/upload/DropZone.tsx (update existing)
2. src/components/upload/UploadForm.tsx (simplify)
3. src/components/upload/RecentUploads.tsx

STYLING:
- Clean, minimal
- No decorative elements
- Clear status indicators
- Professional appearance

Run npm run dev and test the upload flow.
```

---

## PROMPT 7: OPPORTUNITIES PAGE

**Purpose:** Simple filtered view of high-priority companies

```
Create src/app/(dashboard)/opportunities/page.tsx as a focused view of opportunities.

This is essentially a filtered version of the Companies page, focused on actionable opportunities.

LAYOUT:
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  OPPORTUNITIES                                                              [Export]    │
│  Companies with identified TP exposure                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [All] [🔴 High Priority] [🟠 Medium] [New] [Contacted] [In Progress]                  │
│                                                                                         │
│  Company              │ Key Issue              │ IC Volume │ Est. Value  │ Status      │
│  ─────────────────────┼────────────────────────┼───────────┼─────────────┼─────────────│
│  ABC Holdings Sarl    │ Zero spread, no docs   │ €45M      │ €45-65K     │ [New ▼]     │
│  Beta Investments SA  │ Zero spread, thin cap  │ €89M      │ €60-80K     │ [Contacted] │
│  Gamma Treasury Sarl  │ Guarantee w/o fee      │ €23M      │ €25-35K     │ [Meeting]   │
│  Delta Finance SA     │ Thin cap, no policy    │ €67M      │ €50-70K     │ [New ▼]     │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  SUMMARY                                                                                │
│  Total Opportunities: 12 │ Est. Pipeline Value: €450-650K │ High Priority: 4           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

FEATURES:
1. Filter tabs: All, High Priority (red), Medium (amber), by Status
2. Status dropdown in each row (updates opportunity_status table)
3. Click row to view company detail
4. Summary stats at bottom
5. Only shows companies with at least one red or amber indicator

STATUS OPTIONS:
- New (default)
- Contacted
- Meeting Scheduled
- Proposal Sent
- Won
- Lost

When status changes:
- Update opportunity_status table
- Add entry to audit_trail
- Show toast confirmation

COMPONENTS:
1. src/components/opportunities/OpportunitiesTable.tsx
2. src/components/opportunities/StatusDropdown.tsx
3. src/components/opportunities/FilterTabs.tsx
4. src/components/opportunities/PipelineSummary.tsx

STYLING:
- Same clean table style as Companies page
- Status dropdown styled professionally
- Subtle color coding for status

Run npm run dev and verify the opportunities page works.
```

---

## PROMPT 8: FINAL POLISH & TESTING

**Purpose:** Final cleanup, testing, and verification

```
Perform final polish and testing of the redesigned application.

1. CODE CLEANUP:
- Remove all console.log statements
- Remove unused imports
- Remove old/unused components (especially old sidebar, old dashboard)
- Verify all TypeScript types are correct
- Run: npx tsc --noEmit

2. STYLING CONSISTENCY:
- Verify all pages use consistent spacing (p-6, gap-6, mb-6)
- Verify all cards use same style (bg-white border rounded-lg shadow-sm)
- Verify all tables use same header/row styling
- Verify traffic lights are consistent size and color
- Check mobile responsiveness (tables should scroll horizontally)

3. FUNCTIONALITY TESTING:
Create a test checklist and verify each:
- [ ] Login/logout works
- [ ] Upload page accepts PDF
- [ ] Extraction runs and completes
- [ ] Companies list shows data
- [ ] Traffic lights display correctly
- [ ] Company detail page loads all sections
- [ ] Spread vs benchmark comparison shows
- [ ] Audit trail records views
- [ ] Notes can be added
- [ ] Status can be changed on opportunities
- [ ] Export to Excel works
- [ ] All navigation links work

4. ERROR HANDLING:
- Verify all API routes have proper error handling
- Verify loading states exist
- Verify error states show user-friendly messages
- Verify empty states have helpful messages

5. BUILD VERIFICATION:
- Run: npm run build
- Fix any build errors or warnings
- Verify production build works: npm run start

6. CREATE SUMMARY DOCUMENT:
Create docs/REDESIGN_SUMMARY.md with:
- List of all pages and their purpose
- List of all components created
- List of database changes made
- Any known issues or future improvements
- Screenshots or descriptions of each page

Report completion with summary of all changes made.
```

---

## EXECUTION CHECKLIST

| Prompt | Description | Status |
|--------|-------------|--------|
| 0 | Preparation & Context | ⬜ |
| 1 | Enhanced Claude API Extraction | ⬜ |
| 2 | Database Schema Update | ⬜ |
| 3 | Clean Layout Structure | ⬜ |
| 4 | Companies Page | ⬜ |
| 5 | Company Detail Page | ⬜ |
| 6 | Upload Page | ⬜ |
| 7 | Opportunities Page | ⬜ |
| 8 | Final Polish & Testing | ⬜ |

---

## POST-COMPLETION

After all prompts are executed:

1. Test the full user journey:
   - Login → Upload PDF → Wait for extraction → View company → Check opportunities

2. Verify with a real Luxembourg annual accounts PDF

3. Review the audit trail functionality

4. Export a company to verify Excel export works

5. Check mobile responsiveness

---

## NOTES FOR CLAUDE CODE

- Always run `npm run build` after major changes to catch errors early
- If a prompt is too large, split it into logical sub-tasks
- Preserve existing working functionality when modifying files
- Use the existing Supabase client utilities (don't recreate)
- Follow the patterns in .claude-rules
- Ask for clarification if any requirement is unclear

---

*Document created for TP Opportunity Finder Redesign - December 2024*
