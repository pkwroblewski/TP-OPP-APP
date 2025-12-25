# TP Opportunity Finder - Luxembourg
## Claude Code (VS Code) Master Prompt Document

**Version:** 1.0
**Created:** December 2025
**Author:** Paul (with Claude AI assistance)

---

## Project Overview

### Purpose
Build a web application that identifies commercial transfer pricing opportunities in Luxembourg by analysing publicly available financial accounts. The app enables manual upload of annual accounts (PDFs), extracts financial data, detects intercompany transactions, and scores companies based on their TP exposure and business development potential.

### Target Users
Single user (Paul) - Transfer Pricing Partner at Big Four firm in Luxembourg.

### Core Value Proposition
Proactively identify Luxembourg entities with significant intercompany transactions that may require TP advisory services, focusing on intragroup financing structures (borrowing and on-lending), which represent the majority of TP work in Luxembourg.

---

## Regulatory Framework

### Primary References (Must Be Applied Throughout)

| Source | Key Provisions | Application |
|--------|----------------|-------------|
| **OECD TP Guidelines 2022** | Chapter I (arm's length principle), Chapter X (financial transactions) | Benchmark framework for IC loan analysis |
| **Article 56 LIR** | General arm's length principle for related party transactions | Legal basis for TP adjustments |
| **Article 56bis LIR** | Documentation requirements (Master File, Local File), penalties | Identifies documentation needs |
| **LU Circular LIR n° 56/1 - 56bis/1** | Intragroup financing, cash pooling, guarantees | Reference for financing transactions |

### Important: Commercial Opportunity Identification Approach

**The goal of this tool is NOT to filter out companies but to IDENTIFY ALL companies with intercompany transactions as potential commercial opportunities.**

Every company with IC transactions is a potential lead. The analysis helps prioritise outreach and tailor the pitch, but no company should be excluded from the pipeline simply because their spreads appear "normal".

### Key Flags for Priority Attention

**CRITICAL FLAG - Zero Spread on Financing:**
- Companies that borrow and on-lend at the **same rate** (zero spread) are HIGH PRIORITY
- This indicates likely absence of TP policy
- Major compliance exposure - immediate BD opportunity

**HIGH INTEREST FLAGS:**
- Any intragroup financing transaction (loans granted or received)
- Cash pooling arrangements
- Intragroup guarantees (explicit or implicit)
- Management fees or service charges
- Royalty payments

### Luxembourg Financing Transactions - Context (Not Filtering Criteria)

The Luxembourg Circular provides guidance on intragroup financing. These are **reference points for analysis**, not filters:

**Intragroup Loans (On-lending):**
- Financing companies typically retain a spread for their functions/risks
- Zero spread = likely no TP policy = priority lead
- The actual arm's length spread depends on functions, assets, risks

**Cash Pooling:**
- Cash pool leaders should be compensated for their role
- Zero compensation = priority lead

**Intragroup Guarantees:**
- Explicit guarantees typically require a fee
- Absence of guarantee fee = priority lead

---

## Technical Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | Next.js 14 (App Router) | SSR, API routes |
| Styling | Tailwind CSS + shadcn/ui | Consistent with Paul's other projects |
| Database | Supabase (PostgreSQL) | Auth, storage, real-time |
| File Storage | Supabase Storage | PDF uploads |
| PDF Processing | pdf-parse (Node.js) | Text extraction |
| AI Analysis | Claude API (claude-sonnet-4-20250514) | Deep financial analysis |
| Deployment | Vercel | Seamless Next.js hosting |
| Authentication | Google OAuth via Supabase | Single user initially |

---

## Project Structure

```
tp-opportunity-finder/
├── .claude-rules                   # Claude AI rules (copy from below)
├── .env.local                      # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
│
├── docs/
│   └── TP_TECHNICAL_SPEC.md        # Detailed technical specification
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Landing/dashboard redirect
│   │   ├── globals.css             # Global styles
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login page
│   │   │   └── callback/
│   │   │       └── route.ts        # OAuth callback
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   │   ├── page.tsx            # Main dashboard/overview
│   │   │   │
│   │   │   ├── upload/
│   │   │   │   └── page.tsx        # Upload interface
│   │   │   │
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx        # Company list (scored)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Company detail view
│   │   │   │
│   │   │   ├── processing/
│   │   │   │   └── page.tsx        # Processing queue/status
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx        # Pipeline analytics
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx        # App settings
│   │   │
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts        # Handle PDF uploads
│   │       ├── extract/
│   │       │   └── route.ts        # PDF text extraction
│   │       ├── analyse/
│   │       │   └── route.ts        # TP analysis trigger
│   │       ├── companies/
│   │       │   └── route.ts        # Company CRUD
│   │       └── export/
│   │           └── route.ts        # Excel/CSV export
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── upload/
│   │   │   ├── DropZone.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── MetadataForm.tsx
│   │   │   └── BulkUpload.tsx
│   │   ├── companies/
│   │   │   ├── CompanyTable.tsx
│   │   │   ├── CompanyCard.tsx
│   │   │   ├── ScoreBadge.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── analysis/
│   │   │   ├── FinancialSummary.tsx
│   │   │   ├── ICTransactionList.tsx
│   │   │   ├── RiskMatrix.tsx
│   │   │   └── AIInsights.tsx
│   │   └── charts/
│   │       ├── ScoreDistribution.tsx
│   │       └── PipelineChart.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── admin.ts            # Admin client (service role)
│   │   ├── pdf/
│   │   │   ├── extractor.ts        # PDF text extraction
│   │   │   ├── parser.ts           # Financial data parsing
│   │   │   └── patterns.ts         # Regex patterns for extraction
│   │   ├── analysis/
│   │   │   ├── ic-detector.ts      # IC transaction detection
│   │   │   ├── scoring.ts          # TP risk scoring
│   │   │   ├── spread-analysis.ts  # Interest spread calculations
│   │   │   └── thin-cap.ts         # Thin capitalisation checks
│   │   ├── ai/
│   │   │   ├── claude.ts           # Claude API client
│   │   │   └── prompts.ts          # Analysis prompts
│   │   └── utils/
│   │       ├── formatters.ts       # Number/date formatting
│   │       └── validators.ts       # Input validation
│   │
│   ├── types/
│   │   ├── database.ts             # Supabase generated types
│   │   ├── company.ts              # Company-related types
│   │   ├── financial.ts            # Financial data types
│   │   └── analysis.ts             # Analysis result types
│   │
│   └── schemas/
│       ├── company.ts              # Zod schemas for companies
│       ├── financial.ts            # Zod schemas for financials
│       └── upload.ts               # Zod schemas for uploads
│
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql  # Database schema
    └── seed.sql                    # Optional seed data
```

---

## .claude-rules File

Copy this to the root of your project as `.claude-rules`:

```
# TP Opportunity Finder - Claude Code Rules

## Project Context
You are building a transfer pricing opportunity identification app for Luxembourg.
The app analyses financial accounts to detect intercompany transactions and score
companies based on their TP advisory potential.

## Tech Stack
- Next.js 14 with App Router (NOT Pages Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- pdf-parse for PDF extraction
- Claude API for AI analysis

## Code Style
- Use TypeScript with explicit types (no 'any')
- Prefer 'const' over 'let'
- Use arrow functions for components
- Use async/await over .then()
- Destructure props and state
- Use early returns for guard clauses

## File Naming
- Components: PascalCase (CompanyCard.tsx)
- Utilities: camelCase (formatCurrency.ts)
- Types: PascalCase (Company.ts)
- API routes: route.ts in folders

## Component Patterns
- Use 'use client' only when needed (interactivity, hooks)
- Server Components by default
- Collocate components with their pages when specific
- Share components in /components when reused

## Supabase Patterns
- Use server client in Server Components and API routes
- Use browser client in Client Components
- Always handle errors explicitly
- Use RLS policies for security

## TP Domain Knowledge
- All analysis must reference OECD TP Guidelines and Luxembourg law
- Focus on intragroup financing (Art. 56/56bis LIR)
- Apply Luxembourg Circular parameters for spreads
- Detect: IC loans, management fees, royalties, guarantees, cash pooling

## Financial Data Patterns
- Parse both French and English financial terms
- Handle Luxembourg statutory accounts format
- Extract: balance sheet, P&L, notes to accounts
- Key items: créances/dettes entreprises liées, intérêts, frais de gestion

## Error Handling
- Use try-catch in async functions
- Return typed error responses from API routes
- Show user-friendly error messages
- Log errors server-side

## Security
- Validate all inputs with Zod
- Sanitise file uploads
- Use parameterised queries (Supabase handles this)
- Never expose API keys client-side
```

---

## Implementation Prompts

### PROMPT 1: Project Setup

```
Create a new Next.js 14 project for the TP Opportunity Finder app.

**Requirements:**
1. Initialise Next.js 14 with App Router, TypeScript, Tailwind CSS, ESLint
2. Install and configure shadcn/ui with the following components:
   - button, input, label, card, table, badge, dialog, dropdown-menu
   - tabs, toast, progress, skeleton, separator, scroll-area
3. Install additional dependencies:
   - @supabase/supabase-js, @supabase/ssr
   - pdf-parse, @anthropic-ai/sdk
   - zod, react-hook-form, @hookform/resolvers
   - lucide-react, date-fns
   - xlsx (for export)
4. Create the folder structure as specified in the master prompt
5. Set up environment variables template (.env.local.example):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY
6. Create base layout.tsx with:
   - Metadata (title: "TP Opportunity Finder")
   - Tailwind globals
   - Toast provider
7. Create a simple landing page that redirects to /login if not authenticated

**Design:**
- Use a professional, clean design
- Primary colour: deep blue (#1e3a5f)
- Accent colour: gold (#d4a853)
- Background: off-white (#f8f9fa)
- Cards with subtle shadows

Output the complete file structure and all configuration files.
```

---

### PROMPT 2: Database Schema

```
Create the Supabase database schema for the TP Opportunity Finder.

**Requirements:**

1. Create SQL migration file with all tables:

**companies** table:
- id (UUID, primary key)
- rcs_number (VARCHAR 20, unique, not null)
- name (VARCHAR 500, not null)
- legal_form (VARCHAR 50) -- SA, SARL, SCS, etc.
- registered_address (TEXT)
- incorporation_date (DATE)
- nace_code (VARCHAR 10)
- parent_company_name (VARCHAR 500)
- parent_country_code (VARCHAR 3)
- ultimate_parent_name (VARCHAR 500)
- ultimate_parent_country (VARCHAR 3)
- is_part_of_group (BOOLEAN, default false)
- last_filing_date (DATE)
- created_at, updated_at (TIMESTAMPTZ)

**upload_batches** table:
- id (UUID, primary key)
- uploaded_by (UUID, references auth.users)
- upload_type (VARCHAR 20) -- 'manual_single', 'manual_bulk'
- total_files, processed_files, failed_files (INTEGER)
- status (VARCHAR 20, default 'pending')
- created_at, completed_at (TIMESTAMPTZ)

**uploaded_files** table:
- id (UUID, primary key)
- batch_id (UUID, references upload_batches)
- original_filename (VARCHAR 500)
- file_size_bytes (INTEGER)
- file_path (TEXT)
- extraction_status (VARCHAR 20, default 'pending')
- extraction_error (TEXT)
- detected_company_name, detected_rcs_number (VARCHAR)
- detected_fiscal_year (INTEGER)
- detected_language (VARCHAR 10)
- detection_confidence (VARCHAR 20)
- confirmed_company_id (UUID, references companies)
- confirmed_fiscal_year (INTEGER)
- user_confirmed (BOOLEAN, default false)
- filing_id (UUID, references filings)
- created_at, updated_at (TIMESTAMPTZ)

**filings** table:
- id (UUID, primary key)
- company_id (UUID, references companies)
- fiscal_year (INTEGER)
- filing_date (DATE)
- filing_type (VARCHAR 50)
- source_url (TEXT)
- pdf_stored_path (TEXT)
- extraction_status (VARCHAR 20, default 'pending')
- extracted_text (TEXT)
- created_at (TIMESTAMPTZ)
- UNIQUE(company_id, fiscal_year, filing_type)

**financial_data** table:
- id (UUID, primary key)
- filing_id (UUID, references filings)
- company_id (UUID, references companies)
- fiscal_year (INTEGER)
- Balance sheet fields:
  - total_assets, fixed_assets, financial_fixed_assets
  - ic_loans_receivable, ic_receivables_trade
  - cash_and_equivalents
  - total_equity, share_capital, retained_earnings
  - total_debt, ic_loans_payable, ic_payables_trade, third_party_debt
- P&L fields:
  - turnover, other_operating_income, ic_revenue
  - interest_income_total, interest_income_ic
  - interest_expense_total, interest_expense_ic
  - dividend_income, management_fees, royalty_expense, service_fees_ic
  - operating_result, financial_result, profit_before_tax, tax_expense, net_profit
- Calculated metrics:
  - debt_to_equity_ratio, ic_debt_to_total_debt_ratio
  - interest_coverage_ratio, net_interest_margin
- All amounts as DECIMAL(20,2)
- created_at (TIMESTAMPTZ)

**ic_transactions** table:
- id (UUID, primary key)
- company_id, filing_id (UUID references)
- fiscal_year (INTEGER)
- transaction_type (VARCHAR 50) -- 'ic_loan_granted', 'ic_loan_received', 'management_fee', 'royalty', 'guarantee', 'cash_pool', 'service_fee'
- transaction_category (VARCHAR 30) -- 'financing', 'services', 'ip', 'goods'
- principal_amount, annual_flow (DECIMAL 20,2)
- counterparty_name (VARCHAR 500)
- counterparty_country (VARCHAR 3)
- implied_interest_rate (DECIMAL 8,4)
- market_rate_benchmark (DECIMAL 8,4)
- rate_deviation_bps (INTEGER)
- is_cross_border, is_high_value, is_rate_anomaly, is_thin_cap_risk (BOOLEAN)
- source_note (TEXT)
- extraction_confidence (VARCHAR 20)
- created_at (TIMESTAMPTZ)

**tp_assessments** table:
- id (UUID, primary key)
- company_id (UUID, references companies)
- fiscal_year (INTEGER)
- assessment_date (TIMESTAMPTZ)
- total_score (INTEGER)
- priority_tier (VARCHAR 10) -- 'A', 'B', 'C'
- Component scores: financing_risk_score, services_risk_score, documentation_risk_score, materiality_score, complexity_score (INTEGER)
- Flags: has_ic_financing, has_ic_services, has_ic_royalties, has_cross_border_ic, has_thin_cap_indicators, has_rate_anomalies (BOOLEAN)
- Documentation: likely_needs_local_file, likely_needs_master_file (BOOLEAN)
- estimated_ic_volume (DECIMAL 20,2)
- AI fields: ai_summary (TEXT), ai_key_findings (JSONB), ai_recommended_approach (TEXT)
- Outreach: outreach_status (VARCHAR 20), outreach_notes (TEXT), assigned_to (VARCHAR 100)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(company_id, fiscal_year)

**tp_benchmarks** table:
- id (UUID, primary key)
- benchmark_type (VARCHAR 50) -- 'euribor', 'credit_spread', 'guarantee_fee', 'management_fee_rate'
- effective_date (DATE)
- value (DECIMAL 10,4)
- currency (VARCHAR 3)
- credit_rating (VARCHAR 10)
- tenor_years (INTEGER)
- source (VARCHAR 100)
- notes (TEXT)
- created_at (TIMESTAMPTZ)

2. Create all necessary indexes for performance
3. Create RLS policies (for now, simple: authenticated users can do all)
4. Create updated_at trigger function

Output the complete SQL migration file.
```

---

### PROMPT 3: Zod Validation Schemas

```
Create Zod validation schemas for all entities in the TP Opportunity Finder.

**Requirements:**

Create the following schema files in src/schemas/:

**company.ts:**
- companySchema: full company validation
- companyCreateSchema: for creating new companies
- companyUpdateSchema: for updates (all optional)
- Include RCS number format validation (B followed by digits)
- Validate country codes (2-3 letter ISO)

**financial.ts:**
- financialDataSchema: all financial fields
- balanceSheetSchema: balance sheet subset
- profitLossSchema: P&L subset
- calculatedMetricsSchema: derived metrics
- All amounts should be non-negative numbers or null

**upload.ts:**
- uploadMetadataSchema: company metadata from upload form
- detectedMetadataSchema: auto-detected values
- fileUploadSchema: file validation (PDF only, max 50MB)
- bulkUploadSchema: array of files

**analysis.ts:**
- icTransactionSchema: single transaction
- icTransactionCreateSchema: for creating
- tpAssessmentSchema: full assessment
- aiInsightsSchema: Claude response structure
- leadScoreSchema: scoring output

**Include:**
- Proper TypeScript type inference (z.infer)
- Custom error messages in English
- Refinements for business logic (e.g., fiscal year between 2015-2030)
- Transform functions where needed (e.g., trim strings)

Output all schema files with complete implementations.
```

---

### PROMPT 4: Authentication Setup

```
Set up Google OAuth authentication using Supabase for the TP Opportunity Finder.

**Requirements:**

1. Create Supabase client utilities in src/lib/supabase/:
   - client.ts: browser client using createBrowserClient
   - server.ts: server client using createServerClient with cookies
   - admin.ts: admin client using service role key
   - middleware.ts: auth middleware helper

2. Create authentication pages:
   - src/app/(auth)/login/page.tsx:
     - Simple login page with Google OAuth button
     - Redirect to dashboard if already authenticated
     - Professional styling matching the app theme
   
   - src/app/(auth)/callback/route.ts:
     - Handle OAuth callback
     - Exchange code for session
     - Redirect to dashboard

3. Create middleware.ts in project root:
   - Protect all routes under /(dashboard)
   - Redirect unauthenticated users to /login
   - Refresh session on each request

4. Create auth context/provider if needed for client components

5. Create useUser hook for accessing current user

**Design:**
- Login page should be centred, clean, professional
- Show app name and brief description
- Single "Sign in with Google" button
- Match the app's colour scheme (deep blue, gold accent)

Output all authentication-related files.
```

---

### PROMPT 5: Dashboard Layout

```
Create the main dashboard layout for the TP Opportunity Finder.

**Requirements:**

1. Create dashboard layout in src/app/(dashboard)/layout.tsx:
   - Sidebar navigation (collapsible on mobile)
   - Header with user info and logout
   - Main content area

2. Create layout components in src/components/layout/:

**Sidebar.tsx:**
- Navigation items:
  - Dashboard (home icon)
  - Upload (upload icon)
  - Companies (building icon)
  - Processing (loader icon)
  - Analytics (chart icon)
  - Settings (cog icon)
- Active state highlighting
- Collapsible on mobile (hamburger menu)
- App logo at top

**Header.tsx:**
- Page title (dynamic based on route)
- User avatar and name
- Dropdown with: Profile, Settings, Logout
- Notification bell (for processing status)

3. Create main dashboard page src/app/(dashboard)/page.tsx:
- Quick stats cards:
  - Total companies analysed
  - High priority leads (Tier A)
  - Pending processing
  - Recent uploads
- Recent activity list
- Quick action buttons (Upload, View Companies)

**Design:**
- Sidebar: dark background (#1e3a5f), white text
- Header: white background, subtle bottom border
- Content area: light gray background (#f8f9fa)
- Cards: white with subtle shadow
- Use Lucide icons throughout

Output all layout components and the dashboard page.
```

---

### PROMPT 6: File Upload Interface

```
Create the file upload interface for PDF annual accounts.

**Requirements:**

1. Create upload page src/app/(dashboard)/upload/page.tsx:
   - Tab interface: "Single Upload" | "Bulk Upload"
   - Clear instructions for users

2. Create upload components in src/components/upload/:

**DropZone.tsx:**
- Drag and drop zone for PDFs
- Click to browse fallback
- Visual feedback on drag over
- File type validation (PDF only)
- File size validation (max 50MB)
- Multiple file support for bulk mode

**FileList.tsx:**
- List of uploaded files
- Show: filename, size, status (pending/processing/done/error)
- Remove button for each file
- Progress indicator during upload

**MetadataForm.tsx:**
- Form for company metadata:
  - RCS Number (with format hint: B123456)
  - Company Name
  - Fiscal Year (dropdown: 2020-2024)
  - Legal Form (dropdown: SA, SARL, SCS, SCA, SE, Other)
  - Parent Company Name (optional)
  - Parent Country (searchable dropdown with flags)
- Toggle: "Extract from PDF automatically" vs "Enter manually"
- Validation using Zod schemas

**BulkUpload.tsx:**
- Multi-file dropzone
- Table showing all files with detected metadata
- Inline editing of detected values
- "Process All" button
- Individual file actions (remove, re-detect)

3. Create API route src/app/api/upload/route.ts:
   - Accept multipart form data
   - Store file in Supabase Storage
   - Create upload_batch and uploaded_files records
   - Return file IDs for subsequent processing

4. Create file upload hook src/lib/hooks/useFileUpload.ts:
   - Handle file selection
   - Upload to API
   - Track progress
   - Handle errors

**UX Requirements:**
- Show toast notifications for success/error
- Disable submit while processing
- Show clear error messages for invalid files
- Preview of detected company info before final submit

Output all upload components, API route, and hooks.
```

---

### PROMPT 7: PDF Extraction Pipeline

```
Create the PDF text extraction and financial data parsing pipeline.

**Requirements:**

1. Create PDF utilities in src/lib/pdf/:

**extractor.ts:**
- Function to extract text from PDF using pdf-parse
- Handle multi-page documents
- Return structured text with page markers
- Error handling for corrupted/encrypted PDFs

**patterns.ts:**
- Regex patterns for Luxembourg financial accounts
- Both French and English patterns
- Categories:
  - Company identification (RCS number, company name)
  - Fiscal year detection
  - Balance sheet items (assets, liabilities, equity)
  - P&L items (revenue, expenses, results)
  - Intercompany-specific patterns:
    - "créances sur entreprises liées" / "amounts owed by affiliated"
    - "dettes envers entreprises liées" / "amounts owed to affiliated"
    - "intérêts" with "entreprises liées" / "affiliated undertakings"
    - "frais de gestion" / "management fees"
    - "redevances" / "royalties"
  - Related party disclosure section markers

**parser.ts:**
- Main parsing function that takes extracted text
- Apply patterns to extract structured data
- Handle number formats:
  - European: 1.234.567,89
  - UK/US: 1,234,567.89
  - Thousands notation: 1.234 (meaning 1,234,000)
  - Parentheses for negatives: (1,234)
- Map extracted values to financial_data schema
- Calculate derived metrics (ratios)
- Return confidence scores for each extraction

2. Create API route src/app/api/extract/route.ts:
   - Accept file_id parameter
   - Retrieve PDF from Supabase Storage
   - Run extraction pipeline
   - Store extracted text in filings table
   - Parse and store in financial_data table
   - Detect and store IC transactions
   - Update extraction_status
   - Return extraction results

3. Create extraction service src/lib/services/extractionService.ts:
   - Orchestrate the full extraction flow
   - Handle errors gracefully
   - Update database records
   - Trigger next steps (analysis)

**Key Patterns to Detect:**

Balance Sheet (Assets):
- /Immobilisations financières/i
- /Financial (fixed )?assets/i
- /Créances sur (des )?entreprises liées/i
- /Amounts owed by affiliated/i
- /Prêts (à|aux) (des )?entreprises (liées|du groupe)/i

Balance Sheet (Liabilities):
- /Dettes (envers|auprès) (des )?entreprises liées/i
- /Amounts owed to affiliated/i
- /Emprunts.*entreprises liées/i

P&L (Financial Items):
- /Intérêts et produits assimilés/i
- /Interest (income|receivable)/i
- /Intérêts et charges assimilées/i
- /Interest (expense|payable)/i
- /Frais de gestion/i
- /Management fees/i
- /Redevances/i
- /Royalt(y|ies)/i

Amount Patterns:
- /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(EUR|€)?/
- /\((\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\)/ (negatives)

Output all extraction utilities and API route.
```

---

### PROMPT 8: IC Transaction Detection

```
Create the intercompany transaction detection logic.

**Requirements:**

1. Create IC detection utilities in src/lib/analysis/:

**ic-detector.ts:**
- Function to identify IC transactions from financial data
- Transaction types to detect:
  - ic_loan_granted: IC loans receivable on balance sheet + interest income
  - ic_loan_received: IC loans payable on balance sheet + interest expense
  - management_fee: Management fee charges in P&L
  - royalty: Royalty expenses/income
  - service_fee: IC service charges
  - guarantee: Identified from notes (if available)
  - cash_pool: Cash pooling arrangements (from notes)

- For each transaction, calculate:
  - principal_amount (from balance sheet)
  - annual_flow (from P&L)
  - implied_interest_rate (annual_flow / principal_amount)
  - Compare to market benchmarks
  - Flag anomalies

**spread-analysis.ts:**
- Functions for analysing interest spreads on financing transactions
- **PRIMARY PURPOSE: Identify zero-spread or low-spread situations as opportunities**
- getBenchmarkRate(date, tenor, currency): get reference rate (EURIBOR, etc.)
- calculateSpread(borrowingRate, lendingRate): calculate margin
- assessSpreadOpportunity(spread): identify BD opportunity level
  - Zero spread (0 bps): CRITICAL opportunity - no TP policy
  - Very low spread (<10 bps): HIGH opportunity - likely inadequate policy
  - Low spread (10-25 bps): MEDIUM opportunity - review warranted
  - Normal spread (>25 bps): STANDARD opportunity - documentation focus
- **NOTE: All companies are opportunities - spread analysis helps prioritise and tailor pitch**
- Return assessment with suggested services

**thin-cap.ts:**
- Thin capitalisation assessment
- Calculate debt-to-equity ratio
- Calculate IC debt to total debt ratio
- Check against typical thresholds:
  - Debt/Equity > 4:1 → Flag
  - IC Debt > 80% of total debt → Flag
- Calculate interest coverage ratio
- Check ATAD exposure (net interest > 30% EBITDA)

2. Create benchmark data utilities:
- Seed data for typical rates
- Function to lookup current benchmark
- Consider EURIBOR + credit spreads

3. Update extraction pipeline to:
- Call IC detection after financial data extraction
- Store detected transactions in ic_transactions table
- Include confidence scores

**Detection Logic Examples:**

```typescript
// IC Loan Granted Detection
if (financials.ic_loans_receivable > 0) {
  const transaction = {
    type: 'ic_loan_granted',
    principal: financials.ic_loans_receivable,
    flow: financials.interest_income_ic || 0,
    impliedRate: flow / principal,
  };
  // Compare to benchmark
  const benchmark = await getBenchmark('euribor_3m') + creditSpread;
  transaction.rateDeviation = (impliedRate - benchmark) * 10000; // bps
}
```

Output all IC detection and analysis utilities.
```

---

### PROMPT 9: TP Scoring Engine

```
Create the transfer pricing opportunity scoring engine.

**IMPORTANT CONTEXT:**
The purpose of scoring is to PRIORITISE commercial outreach, NOT to filter out companies.
Every company with IC transactions is a potential lead. The score helps determine:
- Which companies to contact first
- What angle to use in outreach
- What services to propose

**Requirements:**

1. Create scoring logic in src/lib/analysis/scoring.ts:

**Score Components (0-100 each):**

Financing Opportunity Score:
- IC loans receivable exists: +20
- IC loans > €1M: +10
- IC loans > €10M: +15
- Interest income from IC: +10
- IC loans payable exists: +15
- **CRITICAL: Zero spread on financing (same borrow/lend rate): +30**
- Very low spread (<10 bps): +20
- Thin cap indicators (D/E > 4:1): +15

Services Opportunity Score:
- Management fees exist: +30
- Management fees > €500k: +15
- IC service fees exist: +25
- Royalty charges exist: +30

Documentation Opportunity Score:
- Total IC volume > €1M: +25
- Total IC volume > €10M: +30
- Cross-border transactions: +25
- Complex structure (>3 transaction types): +15
- No visible TP policy/documentation: +20

Materiality Score:
- Based on absolute IC transaction volume
- Log scale scoring
- >€50M: max score

Group Complexity Score:
- Number of different transaction types
- Number of countries involved
- Presence of financing + services + IP

**Total Score Calculation:**
- Weighted average of components
- Weights: Financing 35%, Services 20%, Documentation 25%, Materiality 15%, Complexity 5%
- Max 100

**Priority Tiers (for outreach prioritisation):**
- A (70-100): High Priority - Immediate outreach, complex needs
- B (40-69): Medium Priority - Scheduled outreach, standard needs
- C (0-39): Lower Priority - Include in pipeline, simpler needs

**CRITICAL: No company with IC transactions should be scored 0 or excluded.**

2. Create scoring service:
- calculateTPScore(companyId, fiscalYear): full scoring
- Store results in tp_assessments table
- Generate flags based on findings

3. Create opportunity explanation generator:
- Human-readable explanation of opportunity
- Key services to propose
- Suggested outreach angle

**Key Flags to Generate:**

ZERO_SPREAD_FINANCING: "Company has intragroup financing but retains zero spread - likely no TP policy"
LOW_SPREAD_FINANCING: "Financing spread below typical range - potential pricing review needed"
HIGH_IC_VOLUME: "Significant IC transaction volume - documentation requirements likely"
CROSS_BORDER_COMPLEXITY: "Multiple jurisdictions involved - comprehensive TP strategy needed"
NO_VISIBLE_DOCUMENTATION: "No evidence of TP policy - documentation gap opportunity"
THIN_CAP_EXPOSURE: "High debt-to-equity ratio - thin cap and interest deductibility review"

**Example Output:**
```typescript
{
  totalScore: 78,
  priorityTier: 'A',
  components: {
    financingOpportunity: 85,
    servicesOpportunity: 45,
    documentationOpportunity: 90,
    materiality: 70,
    complexity: 60
  },
  keyFlags: [
    { code: 'ZERO_SPREAD_FINANCING', message: 'On-lending at zero margin detected', severity: 'critical' },
    { code: 'HIGH_IC_VOLUME', message: 'IC volume €45M - documentation required', severity: 'high' },
    { code: 'CROSS_BORDER_COMPLEXITY', message: 'Financing from German parent', severity: 'medium' }
  ],
  estimatedICVolume: 52000000,
  suggestedServices: [
    'TP documentation (Master File + Local File)',
    'Financing structure review',
    'Interest rate benchmarking'
  ],
  outreachAngle: 'Focus on compliance gap - zero spread financing is audit risk'
}
```

Output the complete scoring engine implementation.
```

---

### PROMPT 10: Claude AI Integration

```
Create the Claude API integration for deep financial analysis.

**Requirements:**

1. Create Claude client in src/lib/ai/claude.ts:
   - Initialise Anthropic client with API key
   - Create typed request/response interfaces
   - Error handling and retries
   - Rate limiting consideration

2. Create analysis prompts in src/lib/ai/prompts.ts:

**System Prompt:**
Create a comprehensive system prompt that:
- Establishes Claude as a Luxembourg TP expert
- References OECD Guidelines, Art. 56/56bis, Luxembourg Circulars
- Focuses on intragroup financing analysis
- Specifies JSON output format

**Analysis Prompt Template:**
- Input: company metadata, financial data, detected IC transactions
- Request structured analysis including:
  - Executive summary (2-3 sentences)
  - Key findings (bullet points)
  - IC transactions analysis
  - Risk assessment (High/Medium/Low with rationale)
  - Estimated IC volume
  - Documentation requirements assessment
  - BD approach recommendation

3. Create analysis service in src/lib/services/aiAnalysisService.ts:
   - analyseCompany(companyId, fiscalYear): trigger full analysis
   - Prepare context from database
   - Call Claude API
   - Parse and validate response
   - Store in tp_assessments table

4. Create API route src/app/api/analyse/route.ts:
   - Accept company_id and fiscal_year
   - Call analysis service
   - Return results
   - Handle errors gracefully

**Claude Response Schema:**
```typescript
interface AIAnalysisResponse {
  executive_summary: string;
  key_findings: string[];
  ic_transactions_analysis: {
    type: string;
    estimated_amount: number;
    counterparty_country: string;
    implied_rate?: number;
    risk_flag?: string;
    arm_length_assessment: string;
  }[];
  risk_assessment: {
    overall: 'high' | 'medium' | 'low';
    financing_risk: 'high' | 'medium' | 'low';
    documentation_risk: 'high' | 'medium' | 'low';
    rationale: string;
  };
  estimated_ic_volume: number;
  documentation_requirements: {
    master_file_likely: boolean;
    local_file_likely: boolean;
    rationale: string;
  };
  bd_approach: {
    primary_angle: string;
    key_talking_points: string[];
    potential_services: string[];
  };
}
```

Output the complete Claude integration.
```

---

### PROMPT 11: Company List View

```
Create the company list view with filtering and sorting.

**Requirements:**

1. Create company list page src/app/(dashboard)/companies/page.tsx:
   - Server Component for initial data fetch
   - Client Component wrapper for interactivity
   - Paginated table of companies
   - Search and filter functionality

2. Create components in src/components/companies/:

**CompanyTable.tsx:**
- Columns:
  - Company Name (sortable, clickable to detail)
  - RCS Number
  - Fiscal Year
  - Priority Tier (A/B/C badge)
  - Total Score (progress bar)
  - IC Volume (formatted)
  - Status (outreach status badge)
  - Actions (view, export)
- Row click navigates to detail
- Checkbox selection for bulk actions

**FilterBar.tsx:**
- Search input (searches name, RCS)
- Priority tier filter (A, B, C, All)
- Fiscal year filter (multi-select)
- Score range slider
- IC volume range
- Outreach status filter
- Clear filters button
- Save filter preset (optional)

**ScoreBadge.tsx:**
- Visual badge for priority tier
- A: Green
- B: Yellow/Orange
- C: Gray
- Shows tier letter and score

**CompanyCard.tsx:**
- Alternative card view for mobile
- Key info in compact format
- Quick actions

3. Create data fetching hooks:
   - useCompanies(filters, pagination): fetch company list
   - useCompanyFilters(): manage filter state
   - Support URL state sync for shareable filters

4. Create API route for companies:
   - GET: list with filters, sorting, pagination
   - Support complex queries

**Table Interactions:**
- Sort by any column (click header)
- Multi-column sort (shift+click)
- Bulk select for export
- Quick actions dropdown per row

Output all company list components and API.
```

---

### PROMPT 12: Company Detail View

```
Create the company detail view showing full analysis.

**Requirements:**

1. Create detail page src/app/(dashboard)/companies/[id]/page.tsx:
   - Server Component for data fetch
   - Tab-based layout for different sections
   - Breadcrumb navigation

2. Create sections/components:

**CompanyHeader:**
- Company name, RCS number, legal form
- Priority tier badge (large)
- Parent company info with country flag
- Last updated date
- Quick actions: Export, Analyse, Edit

**Tabs Structure:**

**Tab 1: Overview**
- Score breakdown card (radar chart or bar chart)
- AI executive summary
- Key findings list
- Recommended approach
- Outreach status and notes

**Tab 2: Financials**
- FinancialSummary component
- Balance sheet highlights (table)
- P&L highlights (table)
- Key ratios display
- Year-over-year comparison (if multiple years)

**Tab 3: IC Transactions**
- ICTransactionList component
- Table of all detected transactions
- For each: type, amount, counterparty, rate, assessment
- Visual indicators for anomalies
- Drill-down to transaction detail

**Tab 4: Risk Analysis**
- RiskMatrix component (visual grid)
- Detailed scoring breakdown
- Each component with explanation
- Flags and warnings
- Documentation requirements

**Tab 5: Documents**
- List of uploaded files for this company
- View/download original PDFs
- Upload additional documents

**Tab 6: Activity**
- Timeline of actions taken
- Analysis runs
- Outreach attempts
- Notes history

3. Create analysis components in src/components/analysis/:

**FinancialSummary.tsx:**
- Cards for key financial metrics
- IC assets vs IC liabilities
- Net interest margin
- Debt/equity ratio

**ICTransactionList.tsx:**
- Expandable rows for detail
- Status indicators (arm's length, anomaly)
- Links to relevant regulations

**RiskMatrix.tsx:**
- 2x2 or 3x3 grid visualisation
- Probability vs Impact
- Or Financing vs Services exposure

**AIInsights.tsx:**
- Display Claude's analysis
- Collapsible sections
- Copy to clipboard

4. Create outreach management:
- Status dropdown (new, contacted, meeting, proposal, won, lost)
- Notes field (rich text)
- Next action date
- Save changes

Output all detail view components.
```

---

### PROMPT 13: Processing Queue

```
Create the processing queue view to monitor file processing.

**Requirements:**

1. Create processing page src/app/(dashboard)/processing/page.tsx:
   - Real-time updates on processing status
   - Queue management
   - Retry failed items

2. Create components:

**ProcessingQueue.tsx:**
- List of all upload batches
- For each batch:
  - Upload date
  - Total/processed/failed count
  - Progress bar
  - Status badge
  - Expand to see individual files

**FileProcessingCard.tsx:**
- Individual file status
- Stages: Uploaded → Extracting → Parsing → Analysing → Complete
- Current stage highlighted
- Error message if failed
- Retry button for failed
- View result button for complete

**ProcessingStats.tsx:**
- Summary cards:
  - In queue
  - Processing now
  - Completed today
  - Failed today
- Processing rate (files/hour)

3. Implement real-time updates:
   - Use Supabase real-time subscriptions
   - Subscribe to upload_files and filings changes
   - Update UI automatically

4. Create retry mechanism:
   - API endpoint to retry failed extraction
   - Clear error, reset status
   - Re-trigger pipeline

5. Create batch actions:
   - Retry all failed in batch
   - Cancel pending
   - Delete batch

**Status Flow:**
uploaded → extracting → extracted → parsing → parsed → analysing → complete
                      ↓                      ↓                    ↓
                   failed ←────────────── failed ←──────────── failed

Output all processing queue components.
```

---

### PROMPT 14: Analytics Dashboard

```
Create the analytics dashboard for pipeline insights.

**Requirements:**

1. Create analytics page src/app/(dashboard)/analytics/page.tsx:
   - Overview of entire pipeline
   - Key metrics and trends
   - Interactive charts

2. Create chart components in src/components/charts/:

**ScoreDistribution.tsx:**
- Histogram of company scores
- Tier breakdown (A/B/C counts)
- Average score
- Use Recharts or similar

**PipelineChart.tsx:**
- Funnel visualisation:
  - Uploaded → Extracted → Analysed → Contacted → Won
- Conversion rates at each stage

**ICVolumeChart.tsx:**
- Bar chart of IC volume by transaction type
- Financing vs Services vs IP breakdown

**TrendChart.tsx:**
- Line chart of:
  - Uploads over time
  - High-priority leads identified
  - Outreach success rate

3. Create summary cards:
- Total companies analysed
- Total IC volume identified
- High priority leads (Tier A)
- Conversion rate (contacted → won)
- Average score
- Top industries/sectors

4. Create filters:
- Date range selector
- Fiscal year filter
- Compare periods (this month vs last month)

5. Create export functionality:
- Export analytics as PDF report
- Export raw data as Excel

**Data Aggregations:**
- Group by priority tier
- Group by transaction type
- Group by fiscal year
- Group by parent country

Output all analytics components.
```

---

### PROMPT 15: Export and Outreach Tools

```
Create export and outreach functionality.

**Requirements:**

1. Create export utilities in src/lib/export/:

**excelExport.ts:**
- Export company list to Excel
- Include all key fields
- Format numbers properly
- Add summary sheet
- Use xlsx library

**pdfReport.ts:**
- Generate company analysis report as PDF
- Include:
  - Company header
  - Financial summary
  - IC transactions
  - Risk assessment
  - AI insights
- Professional formatting

2. Create API routes:

**src/app/api/export/route.ts:**
- GET with query params: format (xlsx, csv, pdf), filters
- Generate and return file
- Handle large exports

**src/app/api/export/[companyId]/route.ts:**
- Export single company report
- PDF format
- Include all analysis

3. Create outreach components:

**OutreachPanel.tsx:**
- Side panel or modal for managing outreach
- Status dropdown
- Notes editor
- Next action date picker
- Save/cancel buttons

**EmailTemplateGenerator.tsx:**
- Generate outreach email based on analysis
- Use AI to personalise
- Template selection:
  - Initial contact
  - Follow-up
  - Meeting request
- Copy to clipboard

4. Create email templates:
- Cold outreach template
- Focus on specific findings
- Reference IC volume and risk areas
- Professional tone

5. Create bulk export:
- Select multiple companies
- Export as Excel with one row per company
- Or zip of individual PDFs

**Email Template Example:**
```
Subject: Transfer Pricing Review - [Company Name]

Dear [Contact],

I am reaching out regarding potential transfer pricing considerations 
for [Company Name]. Based on publicly available financial information, 
we have identified significant intercompany transactions that may 
warrant a review of your transfer pricing documentation.

Key observations:
- [AI-generated insight 1]
- [AI-generated insight 2]

Given the recent updates to Luxembourg's transfer pricing requirements 
under Article 56bis, we would welcome the opportunity to discuss how 
we can assist with ensuring full compliance.

Would you be available for a brief call next week?

Best regards,
[Your name]
```

Output all export and outreach components.
```

---

### PROMPT 16: Settings and Configuration

```
Create the settings page and app configuration.

**Requirements:**

1. Create settings page src/app/(dashboard)/settings/page.tsx:
   - Tabs for different settings categories
   - Save/reset functionality

2. Settings categories:

**Profile Settings:**
- User name
- Email (read-only, from Google)
- Default filters
- Notification preferences

**Analysis Settings:**
- Scoring weights (adjustable)
- Threshold for Tier A/B/C
- Default benchmark rates
- AI analysis toggle (on/off)

**Export Settings:**
- Default export format
- Company report template selection
- Include AI insights in exports

**Benchmark Data:**
- View/edit benchmark rates
- Add new benchmarks
- Import benchmark data

3. Create settings storage:
- Store in Supabase (user_settings table)
- Or use local storage for non-critical
- Provide defaults

4. Create settings hooks:
   - useSettings(): get current settings
   - updateSettings(): save changes
   - resetSettings(): restore defaults

5. Create benchmark management:
- CRUD for tp_benchmarks table
- Import from CSV
- Date-based versioning

**Scoring Weight Defaults:**
```typescript
const DEFAULT_WEIGHTS = {
  financing: 0.35,
  services: 0.20,
  documentation: 0.25,
  materiality: 0.15,
  complexity: 0.05
};

const DEFAULT_THRESHOLDS = {
  tierA: 70,
  tierB: 40
};
```

Output all settings components and configuration.
```

---

### PROMPT 17: Testing and Validation

```
Create test utilities and sample data for the TP Opportunity Finder.

**Requirements:**

1. Create sample company data for testing:
   - 5 sample companies with varying profiles:
     - High-risk financing company (Tier A)
     - Medium-risk mixed transactions (Tier B)  
     - Low-risk simple structure (Tier C)
     - Pure holding company
     - Trading company with IC services

2. Create sample financial data:
   - Realistic Luxembourg statutory accounts format
   - Both French and English examples
   - Include all IC transaction types

3. Create test utilities:

**src/lib/test/sampleData.ts:**
- Generate sample companies
- Generate sample financial data
- Generate sample IC transactions

**src/lib/test/validateExtraction.ts:**
- Compare extracted data to expected
- Calculate accuracy metrics
- Report discrepancies

4. Create seed script:
   - Populate database with sample data
   - Run via npm script: `npm run seed`

5. Create validation tools:
   - Manual review interface for extracted data
   - Side-by-side: PDF view vs extracted data
   - Edit and confirm values
   - Mark as validated

6. Document test scenarios:
   - Happy path: upload, extract, analyse, score
   - Error cases: corrupt PDF, unsupported format
   - Edge cases: multi-year filings, foreign language

**Sample Company 1 - High Risk Financing:**
```typescript
{
  name: "LuxFinCo Alpha SARL",
  rcsNumber: "B123456",
  legalForm: "SARL",
  parentCompany: "Alpha Holdings GmbH",
  parentCountry: "DE",
  financials: {
    icLoansReceivable: 50000000,
    icLoansPayable: 45000000,
    interestIncomeIC: 1250000, // 2.5% on receivable
    interestExpenseIC: 900000, // 2% on payable
    // Spread: 50bps - needs review per Circular
  },
  expectedScore: 85,
  expectedTier: 'A'
}
```

Output test utilities and sample data generators.
```

---

## Environment Variables

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment Checklist

1. [ ] Set up Supabase project
2. [ ] Configure Google OAuth in Supabase
3. [ ] Run database migrations
4. [ ] Set environment variables in Vercel
5. [ ] Deploy to Vercel
6. [ ] Test OAuth flow in production
7. [ ] Test file upload in production
8. [ ] Verify Claude API integration
9. [ ] Seed benchmark data

---

## Future Enhancements (Phase 2+)

1. **Automated Scraping** - RCS/LBR data collection with CAPTCHA handling
2. **Multi-user Support** - Team access, role-based permissions
3. **CRM Integration** - Export to Salesforce, HubSpot
4. **Email Integration** - Send outreach directly from app
5. **Benchmarking Database** - Historical rate data, automatic updates
6. **Audit Trail** - Full logging of all actions
7. **API for External Tools** - REST API for integration

---

## Support

For questions or issues during implementation, refer to:
- This master prompt document
- The .claude-rules file for coding standards
- The TP Technical Specification (to be created)
- Luxembourg TP Circular for regulatory questions

---

*Document created: December 2025*
*Last updated: December 2025*
