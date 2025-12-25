# TP Opportunity Finder - Implementation Steps for Claude Code (VS Code)

## Overview

This guide provides sequenced prompts to build the TP Opportunity Finder app efficiently using Claude Code in VS Code. Each step is designed to:
- Keep context manageable (not overwhelm Claude)
- Build incrementally (each step depends on the previous)
- Allow verification before moving on

**Your Setup:**
- Folder: `TP Opp App`
- Files uploaded: `.claude-rules`, `TP_OPPORTUNITY_FINDER_MASTER_PROMPT.md`

---

## PHASE 1: Project Foundation (Steps 1-4)

### Step 1: Initialize Next.js Project

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Initialize a new Next.js 14 project in this folder with the following configuration:

- App Router (not Pages Router)
- TypeScript (strict mode)
- Tailwind CSS
- ESLint
- src/ directory

Use these exact settings when prompted:
- Project name: tp-opportunity-finder
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- src/ directory: Yes
- App Router: Yes
- Import alias: @/*

After initialization, verify the project runs with npm run dev.
```

**✅ Verify:** Open browser at http://localhost:3000 - you should see the Next.js welcome page.

---

### Step 2: Install Dependencies

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Install the following dependencies for the TP Opportunity Finder project:

Core dependencies:
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk

Form and validation:
npm install zod react-hook-form @hookform/resolvers

Utilities:
npm install lucide-react date-fns xlsx pdf-parse

Dev dependencies:
npm install -D @types/pdf-parse

After installation, show me the updated package.json dependencies section.
```

**✅ Verify:** Check package.json has all dependencies listed.

---

### Step 3: Setup shadcn/ui

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Initialize shadcn/ui in this project and install the following components:

First, run: npx shadcn@latest init

When prompted, select:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then install these components:
npx shadcn@latest add button input label card table badge dialog dropdown-menu tabs toast progress skeleton separator scroll-area select textarea checkbox alert sheet

After installation, verify the components folder exists at src/components/ui/
```

**✅ Verify:** Check that `src/components/ui/` folder exists with component files.

---

### Step 4: Create Project Folder Structure

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the folder structure for the TP Opportunity Finder app. Create these folders and placeholder files:

src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx (create empty placeholder)
│   │   └── callback/
│   │       └── route.ts (create empty placeholder)
│   ├── (dashboard)/
│   │   ├── layout.tsx (create empty placeholder)
│   │   ├── page.tsx (create empty placeholder)
│   │   ├── upload/
│   │   │   └── page.tsx (create empty placeholder)
│   │   ├── companies/
│   │   │   ├── page.tsx (create empty placeholder)
│   │   │   └── [id]/
│   │   │       └── page.tsx (create empty placeholder)
│   │   ├── processing/
│   │   │   └── page.tsx (create empty placeholder)
│   │   ├── analytics/
│   │   │   └── page.tsx (create empty placeholder)
│   │   └── settings/
│   │       └── page.tsx (create empty placeholder)
│   └── api/
│       ├── upload/
│       │   └── route.ts (create empty placeholder)
│       ├── extract/
│       │   └── route.ts (create empty placeholder)
│       ├── analyse/
│       │   └── route.ts (create empty placeholder)
│       ├── companies/
│       │   └── route.ts (create empty placeholder)
│       └── export/
│           └── route.ts (create empty placeholder)
├── components/
│   ├── layout/
│   ├── upload/
│   ├── companies/
│   ├── analysis/
│   └── charts/
├── lib/
│   ├── supabase/
│   ├── pdf/
│   ├── analysis/
│   ├── ai/
│   └── utils/
├── types/
└── schemas/

Also create:
- .env.local.example with placeholder environment variables
- docs/ folder and move the master prompt document there if not already

Each placeholder file should just export a simple component or function that returns null or an empty response, so the app compiles.
```

**✅ Verify:** Run `npm run dev` - app should still compile without errors.

---

## PHASE 2: Database & Environment (Steps 5-7)

### Step 5: Environment Setup

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the environment configuration files:

1. Update .env.local.example with:
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

2. Create .env.local (copy of example - I will fill in real values)

3. Update .gitignore to include:
.env.local
.env*.local

4. Create src/lib/env.ts with a typed environment config that validates required variables at runtime.
```

**⏸️ Pause here:** You need to create a Supabase project and get your API keys before continuing. Go to supabase.com, create a project, and copy your credentials into `.env.local`.

---

### Step 6: Database Schema

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Read the Database Schema section (PROMPT 2) from the master prompt document in the docs folder (TP_OPPORTUNITY_FINDER_MASTER_PROMPT.md).

Create a SQL migration file at supabase/migrations/001_initial_schema.sql with the complete database schema including:

1. All tables: companies, upload_batches, uploaded_files, filings, financial_data, ic_transactions, tp_assessments, tp_benchmarks

2. All indexes for performance

3. Updated_at trigger function

4. Basic RLS policies (allow authenticated users full access for now)

Make sure to include all the fields specified in the master prompt, especially:
- Financial fields as DECIMAL(20,2)
- Proper foreign key relationships
- UNIQUE constraints where specified
- Default values

Output the complete SQL file.
```

**⏸️ Pause here:** 
1. Go to Supabase Dashboard > SQL Editor
2. Copy and run the migration SQL
3. Verify tables are created in Table Editor

---

### Step 7: Supabase Client Setup

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the Supabase client utilities in src/lib/supabase/:

1. client.ts - Browser client using createBrowserClient from @supabase/ssr
   - For use in Client Components ('use client')

2. server.ts - Server client using createServerClient from @supabase/ssr
   - For use in Server Components and API routes
   - Must handle cookies properly for Next.js App Router

3. admin.ts - Admin client using service role key
   - For server-side operations that bypass RLS
   - Never import this in client code

4. middleware.ts - Helper for auth middleware
   - Function to refresh session
   - Function to check if user is authenticated

Also create src/types/database.ts with TypeScript types that match our database schema. Include types for:
- Company, Filing, FinancialData, ICTransaction, TPAssessment
- Insert and Update variants where needed

Follow Next.js 14 App Router patterns and the @supabase/ssr documentation.
```

**✅ Verify:** No TypeScript errors in the supabase files.

---

## PHASE 3: Authentication (Steps 8-9)

### Step 8: Auth Pages

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the authentication flow:

1. src/app/(auth)/login/page.tsx:
   - Clean, professional login page
   - App title "TP Opportunity Finder" at top
   - Brief description: "Identify transfer pricing opportunities in Luxembourg"
   - Single "Sign in with Google" button using Supabase OAuth
   - Redirect to /dashboard if already authenticated
   - Use the app's colour scheme: deep blue (#1e3a5f), gold accent (#d4a853)

2. src/app/(auth)/callback/route.ts:
   - Handle OAuth callback from Google
   - Exchange code for session
   - Redirect to dashboard on success
   - Handle errors gracefully

3. Update src/app/page.tsx (root page):
   - Check if user is authenticated
   - If yes, redirect to /dashboard
   - If no, redirect to /login

Use Supabase Auth with Google OAuth provider. The login should use supabase.auth.signInWithOAuth with provider: 'google'.
```

**⏸️ Pause here:** 
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Configure OAuth credentials from Google Cloud Console
4. Add redirect URL to Google OAuth config

---

### Step 9: Auth Middleware

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the authentication middleware:

1. src/middleware.ts (in project root, not in src/app):
   - Protect all routes under /(dashboard)
   - Allow public access to /(auth) routes and root
   - Refresh session on each request
   - Redirect unauthenticated users to /login

2. Create src/lib/hooks/useUser.ts:
   - Custom hook to get current user
   - Return user object, loading state, and error
   - Use Supabase auth state listener

3. Create src/components/providers/AuthProvider.tsx:
   - Context provider for auth state (if needed)
   - Wrap the app to provide auth context

Update src/app/layout.tsx to include any necessary providers.

Follow the Next.js 14 middleware patterns and Supabase SSR documentation.
```

**✅ Verify:** 
1. Run app, you should be redirected to /login
2. Sign in with Google
3. Should redirect to dashboard after auth

---

## PHASE 4: Dashboard Layout (Steps 10-11)

### Step 10: Dashboard Layout & Sidebar

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the dashboard layout:

1. src/app/(dashboard)/layout.tsx:
   - Sidebar on the left (fixed, 250px wide on desktop)
   - Header at top of main content area
   - Main content area with padding
   - Responsive: sidebar collapses to hamburger on mobile

2. src/components/layout/Sidebar.tsx:
   - App logo/name at top: "TP Opportunity Finder"
   - Navigation items with Lucide icons:
     - Dashboard (LayoutDashboard icon) -> /
     - Upload (Upload icon) -> /upload
     - Companies (Building2 icon) -> /companies
     - Processing (Loader icon) -> /processing
     - Analytics (BarChart3 icon) -> /analytics
     - Settings (Settings icon) -> /settings
   - Active state highlighting (based on current route)
   - Dark background (#1e3a5f), white text
   - Gold accent (#d4a853) for active/hover states

3. src/components/layout/Header.tsx:
   - Page title (passed as prop or from route)
   - User avatar and name on right
   - Dropdown menu: Settings, Sign Out
   - Sign out should call supabase.auth.signOut()

Use shadcn/ui components where appropriate (DropdownMenu, Button, etc.)
```

**✅ Verify:** Navigate to dashboard, see sidebar and header rendered.

---

### Step 11: Dashboard Home Page

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the main dashboard home page at src/app/(dashboard)/page.tsx:

1. Stats Cards Row (4 cards):
   - Total Companies Analysed (placeholder: 0)
   - High Priority Leads (Tier A) (placeholder: 0)
   - Pending Processing (placeholder: 0)
   - This Month's Uploads (placeholder: 0)
   - Each card with icon, number, and label
   - Use shadcn Card component

2. Quick Actions Section:
   - "Upload Financial Accounts" button (links to /upload)
   - "View All Companies" button (links to /companies)
   - Styled with primary colours

3. Recent Activity Section (placeholder):
   - Empty state: "No recent activity. Upload your first financial accounts to get started."
   - Will show recent uploads and analyses later

4. Pipeline Summary (placeholder):
   - Simple text showing: "0 companies in pipeline"
   - Tier breakdown: "A: 0 | B: 0 | C: 0"

Use Server Component for initial render. Style with Tailwind, matching the app's colour scheme.
The page should look professional and clean, not cluttered.
```

**✅ Verify:** Dashboard shows stats cards and quick actions.

---

## PHASE 5: Upload Functionality (Steps 12-14)

### Step 12: Upload Page UI

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the file upload interface:

1. src/app/(dashboard)/upload/page.tsx:
   - Page title: "Upload Financial Accounts"
   - Tab interface: "Single Upload" | "Bulk Upload" (use shadcn Tabs)
   - Instructions text explaining what to upload

2. src/components/upload/DropZone.tsx:
   - Drag and drop zone for PDFs
   - Click to browse fallback
   - Visual feedback: 
     - Default: dashed border, light background
     - Drag over: solid border, highlighted background
   - Accept only PDF files
   - Max file size: 50MB
   - Show upload icon and text "Drop PDF files here or click to browse"

3. src/components/upload/MetadataForm.tsx:
   - Form fields using react-hook-form and Zod validation:
     - RCS Number (text input, pattern: B followed by digits)
     - Company Name (text input, required)
     - Fiscal Year (select: 2020-2025)
     - Legal Form (select: SA, SARL, SCS, SCA, SE, Other)
     - Parent Company Name (optional text)
     - Parent Country (select with country list)
   - Submit button: "Upload & Analyse"
   - Loading state during upload

4. Create Zod schema in src/schemas/upload.ts for form validation

For now, the form submit can just console.log the data - we'll connect the API next.
```

**✅ Verify:** Upload page shows dropzone and form, validation works.

---

### Step 13: File Upload API

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the file upload API and connect it to the UI:

1. src/app/api/upload/route.ts:
   - POST endpoint accepting multipart/form-data
   - Validate file type (PDF only) and size (max 50MB)
   - Upload file to Supabase Storage (bucket: 'financial-accounts')
   - Create records in database:
     - upload_batches (new batch)
     - uploaded_files (file record)
     - companies (find or create by RCS number)
     - filings (new filing record)
   - Return success with file_id and company_id

2. src/lib/hooks/useFileUpload.ts:
   - Custom hook for handling file uploads
   - Manages: selected file, upload progress, loading state, error state
   - Function to trigger upload to API
   - Returns upload function and states

3. Update src/components/upload/DropZone.tsx:
   - Integrate with useFileUpload hook
   - Show selected file name after selection
   - Show progress during upload

4. Connect MetadataForm to submit to API
   - On success, show toast notification
   - Redirect to /processing or company detail page

Create the Supabase Storage bucket 'financial-accounts' if it doesn't exist (note: you may need to do this in Supabase dashboard).
```

**⏸️ Pause here:**
1. Go to Supabase Dashboard > Storage
2. Create bucket called 'financial-accounts'
3. Set it to private (authenticated users only)

**✅ Verify:** Upload a test PDF, check it appears in Supabase Storage.

---

### Step 14: Zod Schemas

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create comprehensive Zod validation schemas in src/schemas/:

1. src/schemas/company.ts:
   - companySchema: full company with all fields
   - companyCreateSchema: for creating (required fields only)
   - companyUpdateSchema: for updates (all optional)
   - Validate RCS number format: starts with B, followed by digits
   - Validate country codes: 2-3 letter ISO codes

2. src/schemas/financial.ts:
   - financialDataSchema: all financial fields from database
   - All amount fields: non-negative numbers or null
   - balanceSheetSchema: subset for balance sheet
   - profitLossSchema: subset for P&L
   - Fiscal year validation: 2015-2030

3. src/schemas/analysis.ts:
   - icTransactionSchema: single IC transaction
   - Transaction types enum: 'ic_loan_granted', 'ic_loan_received', 'management_fee', 'royalty', 'guarantee', 'cash_pool', 'service_fee'
   - tpAssessmentSchema: full assessment with scores
   - Priority tier enum: 'A', 'B', 'C'

4. src/schemas/upload.ts (update existing):
   - Complete file validation
   - Metadata form validation

Export TypeScript types using z.infer<> for each schema.
Include custom error messages in English.
```

**✅ Verify:** No TypeScript errors, schemas importable.

---

## PHASE 6: PDF Processing (Steps 15-17)

### Step 15: PDF Text Extraction

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the PDF text extraction utilities:

1. src/lib/pdf/extractor.ts:
   - Function: extractTextFromPDF(buffer: Buffer): Promise<ExtractedPDF>
   - Use pdf-parse library
   - Return structured data:
     - text: full extracted text
     - numPages: page count
     - metadata: PDF metadata if available
   - Handle errors (corrupted, encrypted PDFs)

2. src/lib/pdf/patterns.ts:
   - Regex patterns for Luxembourg financial accounts
   - Both French and English patterns
   
   Company identification:
   - RCS number: /R\.?C\.?S\.?\s*:?\s*(B\d+)/i
   - Company name patterns
   
   Balance sheet (IC items):
   - /créances sur (des )?entreprises liées/i
   - /amounts owed by affiliated/i
   - /dettes envers (des )?entreprises liées/i
   - /amounts owed to affiliated/i
   
   P&L (financial items):
   - /intérêts.*entreprises liées/i
   - /interest.*affiliated/i
   - /frais de gestion/i
   - /management fees/i
   - /redevances/i
   - /royalt(y|ies)/i
   
   Amount patterns:
   - European format: /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/
   - UK/US format: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
   - Negative in parentheses: /\((\d[\d.,]*)\)/

3. Create types in src/types/pdf.ts for extraction results

Export all patterns as named constants for reuse.
```

**✅ Verify:** Can import and use patterns without errors.

---

### Step 16: Financial Data Parser

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the financial data parser:

1. src/lib/pdf/parser.ts:
   - Function: parseFinancialData(text: string): ParsedFinancials
   - Apply patterns from patterns.ts to extract:
     - Company name and RCS (if found)
     - Fiscal year (if found)
     - Balance sheet items (focus on IC items)
     - P&L items (focus on interest, fees)
   
   - Number parsing function that handles:
     - European format: 1.234.567,89 -> 1234567.89
     - UK format: 1,234,567.89 -> 1234567.89
     - Thousands notation: 1.234 (in context) -> 1234000
     - Parentheses for negatives: (1,234) -> -1234
   
   - Return structure matching financial_data table:
     - All extracted values with confidence scores
     - 'high' if clear pattern match
     - 'medium' if contextual inference
     - 'low' if uncertain
   
   - Calculate derived metrics:
     - debt_to_equity_ratio
     - ic_debt_to_total_debt_ratio
     - net_interest_margin (if applicable)

2. Create helper function to detect document language (French/English)

3. Create function to extract related party notes section specifically

Handle cases where data isn't found - return null for those fields, don't throw errors.
```

**✅ Verify:** Test with sample text, verify parsing works.

---

### Step 17: Extraction API

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the extraction API endpoint:

1. src/app/api/extract/route.ts:
   - POST endpoint accepting { file_id: string }
   - Steps:
     1. Get file record from database
     2. Download PDF from Supabase Storage
     3. Extract text using extractor
     4. Parse financial data using parser
     5. Update filings table with extracted_text
     6. Insert/update financial_data record
     7. Update extraction_status to 'completed' or 'failed'
   - Return extracted data summary

2. Update the upload flow to trigger extraction:
   - After successful upload, call /api/extract
   - Or add to a processing queue for background processing

3. Create src/lib/services/extractionService.ts:
   - Orchestrate the full extraction flow
   - Handle errors at each step
   - Update database status appropriately
   - Return structured results

4. Add error handling:
   - Corrupted PDF -> status 'failed' with error message
   - No data found -> status 'completed' with empty financials
   - Partial extraction -> status 'completed' with what was found

For now, extraction happens synchronously when called. We can add background processing later.
```

**✅ Verify:** Upload PDF, verify extraction runs and data appears in database.

---

## PHASE 7: IC Detection & Scoring (Steps 18-20)

### Step 18: IC Transaction Detection

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the IC transaction detection logic:

1. src/lib/analysis/ic-detector.ts:
   - Function: detectICTransactions(financialData: FinancialData): ICTransaction[]
   
   Detection rules:
   
   IC Loan Granted:
   - If ic_loans_receivable > 0
   - Calculate implied rate: interest_income_ic / ic_loans_receivable
   - Flag if rate is 0 (ZERO_SPREAD - critical flag)
   
   IC Loan Received:
   - If ic_loans_payable > 0
   - Calculate implied rate: interest_expense_ic / ic_loans_payable
   
   Management Fee:
   - If management_fees > 0
   - Type: 'management_fee', category: 'services'
   
   Royalty:
   - If royalty_expense > 0
   - Type: 'royalty', category: 'ip'
   
   Service Fee:
   - If service_fees_ic > 0
   - Type: 'service_fee', category: 'services'

2. For each detected transaction, populate:
   - transaction_type, transaction_category
   - principal_amount (for loans) or annual_flow (for fees)
   - implied_interest_rate (for financing)
   - is_high_value: amount > 1,000,000
   - is_cross_border: based on parent country != 'LU'

3. src/lib/analysis/spread-analysis.ts:
   - Function: analyzeSpread(borrowRate, lendRate): SpreadAnalysis
   - Calculate spread in basis points
   - Classify:
     - spread = 0: 'ZERO_SPREAD' (critical)
     - spread < 10 bps: 'VERY_LOW_SPREAD' (high priority)
     - spread < 25 bps: 'LOW_SPREAD' (medium priority)
     - spread >= 25 bps: 'NORMAL_SPREAD' (standard)

Remember: The goal is to IDENTIFY opportunities, not filter. All companies with IC transactions are leads.
```

**✅ Verify:** Test detection with mock financial data.

---

### Step 19: Thin Cap & ATAD Analysis

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create additional analysis modules:

1. src/lib/analysis/thin-cap.ts:
   - Function: assessThinCap(financialData: FinancialData): ThinCapAssessment
   
   Calculate:
   - Debt to Equity ratio: total_debt / total_equity
   - IC Debt to Total Debt: ic_loans_payable / total_debt
   
   Flags:
   - is_thin_cap_risk: D/E > 4.0
   - is_highly_leveraged: D/E > 6.0
   - is_ic_debt_dominant: IC debt > 80% of total
   
   Return assessment with ratios and flags

2. src/lib/analysis/atad-check.ts:
   - Function: checkATADExposure(financialData: FinancialData): ATADAssessment
   
   Calculate:
   - Net interest expense: interest_expense_total - interest_income_total
   - EBITDA proxy: operating_result + (estimated depreciation if available)
   - Interest/EBITDA ratio
   
   Flag:
   - is_atad_exposed: net interest expense > 30% of EBITDA
   - exceeding_amount: how much over the limit
   
   Note: This is a simplified check - actual ATAD is more complex

3. Create combined analysis function:
   - src/lib/analysis/index.ts
   - Function: runFullAnalysis(companyId, fiscalYear): FullAnalysis
   - Orchestrates: IC detection + spread analysis + thin cap + ATAD
   - Returns combined results
```

**✅ Verify:** Run analysis on test data, verify flags are set correctly.

---

### Step 20: TP Scoring Engine

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the TP opportunity scoring engine:

1. src/lib/analysis/scoring.ts:
   - Function: calculateTPScore(companyId, fiscalYear): TPAssessment

   Score Components (0-100 each):

   Financing Opportunity Score:
   - IC loans receivable exists: +20
   - IC loans > €1M: +10
   - IC loans > €10M: +15
   - IC loans payable exists: +15
   - ZERO spread (critical!): +30
   - Very low spread (<10 bps): +20
   - Thin cap indicators: +15

   Services Opportunity Score:
   - Management fees exist: +30
   - Management fees > €500k: +15
   - IC service fees exist: +25
   - Royalty charges exist: +30

   Documentation Opportunity Score:
   - Total IC volume > €1M: +25
   - Total IC volume > €10M: +30
   - Cross-border transactions: +25
   - Multiple transaction types (>3): +15

   Materiality Score:
   - Log scale based on total IC volume
   - €100k-€1M: 20, €1M-€5M: 40, €5M-€20M: 60, €20M-€50M: 80, >€50M: 100

   Total Score:
   - Weighted: Financing 35%, Services 20%, Documentation 25%, Materiality 15%, Complexity 5%

   Priority Tier:
   - A (70-100): High Priority
   - B (40-69): Medium Priority  
   - C (1-39): Lower Priority
   - Note: Score 0 only if NO IC transactions detected

2. Generate key flags array with severity levels

3. Generate suggested services based on detected transactions

4. Store results in tp_assessments table
```

**✅ Verify:** Score test company, verify tier assignment.

---

## PHASE 8: Company Views (Steps 21-23)

### Step 21: Company List Page

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the company list view:

1. src/app/(dashboard)/companies/page.tsx:
   - Server Component for initial data fetch
   - Fetch companies with their latest tp_assessments
   - Pass to client component for interactivity

2. src/components/companies/CompanyTable.tsx (Client Component):
   - Table using shadcn Table component
   - Columns:
     - Company Name (clickable, links to detail)
     - RCS Number
     - Fiscal Year
     - Priority Tier (A/B/C badge)
     - Total Score (number with progress bar)
     - Est. IC Volume (formatted currency)
     - Status (outreach status badge)
   - Sortable columns (click header to sort)
   - Row click navigates to /companies/[id]

3. src/components/companies/FilterBar.tsx:
   - Search input (filters by name, RCS)
   - Priority tier filter (checkboxes: A, B, C)
   - Score range filter (slider or inputs)
   - Clear filters button
   - Filters update URL params for shareable links

4. src/components/companies/ScoreBadge.tsx:
   - Visual badge for priority tier
   - A: Green background
   - B: Amber/Orange background
   - C: Gray background
   - Shows letter and score

5. Empty state when no companies:
   - Message: "No companies analysed yet"
   - CTA button: "Upload Financial Accounts"
```

**✅ Verify:** Companies page shows table (empty or with test data).

---

### Step 22: Company Detail Page

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the company detail view:

1. src/app/(dashboard)/companies/[id]/page.tsx:
   - Server Component fetching company data
   - Fetch: company, financial_data, ic_transactions, tp_assessment
   - Tab-based layout using shadcn Tabs

2. Company Header section:
   - Company name, RCS number, legal form
   - Priority tier badge (large)
   - Parent company with country flag
   - Quick actions: Export, Re-analyse

3. Tab 1: Overview
   - Score breakdown (component scores displayed)
   - Key flags with severity indicators
   - AI summary (if available, otherwise placeholder)
   - Suggested services list
   - Outreach angle recommendation

4. Tab 2: Financials
   - src/components/analysis/FinancialSummary.tsx
   - Key metrics cards:
     - Total Assets, Total Equity
     - IC Assets, IC Liabilities
     - Net Interest (IC)
     - D/E Ratio
   - Balance sheet highlights table
   - P&L highlights table

5. Tab 3: IC Transactions
   - src/components/analysis/ICTransactionList.tsx
   - Table of all detected transactions
   - Columns: Type, Amount, Rate, Counterparty, Flags
   - Visual indicator for anomalies (zero spread, etc.)

6. Tab 4: Risk Analysis
   - Detailed scoring breakdown
   - Each component with bar chart
   - Flag explanations
   - Documentation requirements assessment
```

**✅ Verify:** Navigate to company detail, see all tabs render.

---

### Step 23: Analysis Trigger API

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the analysis API endpoint:

1. src/app/api/analyse/route.ts:
   - POST endpoint accepting { company_id: string, fiscal_year: number }
   - Steps:
     1. Get company and financial_data from database
     2. Run IC detection
     3. Run spread analysis
     4. Run thin cap assessment
     5. Run ATAD check
     6. Calculate TP score
     7. Store results in ic_transactions and tp_assessments tables
     8. Return full analysis results

2. Add "Re-analyse" functionality:
   - Button on company detail page
   - Calls /api/analyse
   - Shows loading state
   - Refreshes page on completion

3. Update extraction flow:
   - After extraction completes successfully
   - Automatically trigger analysis
   - So upload -> extract -> analyse runs in sequence

4. Create analysis status tracking:
   - Add analysis_status to filings or tp_assessments
   - Track: 'pending', 'analysing', 'completed', 'failed'
   - Show status in UI
```

**✅ Verify:** Upload file, verify full pipeline runs: upload -> extract -> analyse.

---

## PHASE 9: AI Integration (Steps 24-25)

### Step 24: Claude API Integration

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the Claude API integration for AI-powered analysis:

1. src/lib/ai/claude.ts:
   - Initialize Anthropic client with API key from env
   - Function: analyseCompanyWithAI(context: AnalysisContext): Promise<AIAnalysis>
   - Use claude-sonnet-4-20250514 model
   - Handle rate limiting and errors
   - Timeout handling (30 second max)

2. src/lib/ai/prompts.ts:
   - System prompt establishing Claude as Luxembourg TP expert
   - Reference OECD Guidelines, Art. 56/56bis, Luxembourg Circulars
   - Focus on opportunity identification, not filtering
   - Emphasize zero-spread financing as critical flag

   - Analysis prompt template:
     Input: company metadata, financial summary, IC transactions, scores
     Request:
       - Executive summary (2-3 sentences)
       - Key findings (3-5 bullet points)
       - Specific IC transaction observations
       - Suggested services to propose
       - Recommended outreach angle
     Output: JSON format

3. Create response parser:
   - Parse Claude's response
   - Validate against expected schema
   - Handle partial/malformed responses

4. Update /api/analyse to optionally call Claude:
   - Add query param: ?includeAI=true
   - Store AI results in tp_assessments: ai_summary, ai_key_findings, ai_recommended_approach
```

**✅ Verify:** Trigger analysis with AI, verify response stored.

---

### Step 25: AI Insights Display

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the AI insights display component:

1. src/components/analysis/AIInsights.tsx:
   - Display AI-generated analysis
   - Sections:
     - Executive Summary (highlighted box)
     - Key Findings (bullet list)
     - Recommended Approach (card)
     - Suggested Services (tags/badges)
   - "Regenerate Analysis" button
   - Loading state while AI is processing
   - Empty state if no AI analysis yet

2. Update company detail Overview tab:
   - Include AIInsights component
   - Show placeholder if AI not run yet
   - Button to trigger AI analysis

3. Create AI analysis loading indicator:
   - Show in header when AI is processing
   - Animated indicator
   - "Analysing with AI..." message

4. Handle AI errors gracefully:
   - Show error message if AI fails
   - Allow retry
   - Don't block other functionality
```

**✅ Verify:** AI insights display correctly on company detail page.

---

## PHASE 10: Export & Polish (Steps 26-28)

### Step 26: Export Functionality

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create export functionality:

1. src/lib/export/excel.ts:
   - Function: exportCompaniesToExcel(companies: CompanyWithAssessment[]): Buffer
   - Use xlsx library
   - Columns: All key fields
   - Format numbers as numbers (not strings)
   - Format dates properly
   - Add header row styling

2. src/app/api/export/route.ts:
   - GET endpoint with query params for filters
   - format=xlsx or format=csv
   - Apply same filters as company list
   - Return file download

3. Add export button to company list:
   - "Export" dropdown button
   - Options: "Export to Excel", "Export to CSV"
   - Exports currently filtered list

4. src/app/api/export/[companyId]/route.ts:
   - Export single company report
   - Include all analysis details
   - Format as Excel with multiple sheets:
     - Summary sheet
     - Financial data sheet
     - IC transactions sheet
```

**✅ Verify:** Export companies to Excel, open file successfully.

---

### Step 27: Processing Queue Page

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the processing queue view:

1. src/app/(dashboard)/processing/page.tsx:
   - Show all upload batches
   - Show individual file processing status
   - Real-time updates using Supabase realtime (optional) or polling

2. src/components/processing/ProcessingQueue.tsx:
   - List of upload batches
   - For each batch:
     - Upload date
     - File count (processed/total)
     - Progress bar
     - Status badge
   - Expandable to show individual files

3. src/components/processing/FileStatus.tsx:
   - Show processing stages:
     - Uploaded ✓
     - Extracting...
     - Extracted ✓
     - Analysing...
     - Complete ✓
   - Or: Failed ✗ with error message
   - Retry button for failed items

4. Add processing stats:
   - Files in queue
   - Currently processing
   - Completed today
   - Failed today
```

**✅ Verify:** Processing page shows upload history and statuses.

---

### Step 28: Analytics Dashboard

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the analytics dashboard:

1. src/app/(dashboard)/analytics/page.tsx:
   - Overview of entire pipeline
   - Key metrics and charts

2. Summary Cards:
   - Total companies analysed
   - Total IC volume identified (sum)
   - High priority leads (Tier A count)
   - Average score

3. src/components/charts/ScoreDistribution.tsx:
   - Bar chart showing score distribution
   - Buckets: 0-20, 21-40, 41-60, 61-80, 81-100
   - Colour coded by tier

4. src/components/charts/TierBreakdown.tsx:
   - Pie or donut chart
   - Tier A, B, C percentages
   - Click to filter company list

5. IC Volume by Type:
   - Bar chart
   - Financing vs Services vs IP
   - Show totals

6. Use simple implementations:
   - Can use basic divs/CSS for charts initially
   - Or install recharts if needed: npm install recharts

Keep it simple but informative. This page helps Paul see the overall pipeline health.
```

**✅ Verify:** Analytics page shows charts with data (or empty states).

---

## PHASE 11: Final Polish (Steps 29-30)

### Step 29: Settings Page

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Create the settings page:

1. src/app/(dashboard)/settings/page.tsx:
   - Simple settings interface
   - Sections using shadcn Card

2. Profile Section:
   - Display user email (from Google, read-only)
   - Display user name

3. Analysis Settings (store in localStorage for now):
   - Toggle: "Include AI analysis automatically"
   - Scoring weight adjustments (advanced, collapsible)

4. About Section:
   - App version: 1.0.0
   - Brief description
   - Link to documentation

5. Danger Zone:
   - "Sign Out" button
   - Confirmation dialog before sign out

Keep settings minimal for MVP. Can expand later.
```

**✅ Verify:** Settings page loads and sign out works.

---

### Step 30: Final Review & Testing

**Mode:** Agent (Opus 4.5)

**Prompt:**
```
Perform a final review of the application:

1. Check all routes work:
   - / (redirects appropriately)
   - /login (shows login page)
   - /dashboard (shows dashboard)
   - /upload (shows upload form)
   - /companies (shows company list)
   - /companies/[id] (shows company detail)
   - /processing (shows queue)
   - /analytics (shows charts)
   - /settings (shows settings)

2. Check all API routes:
   - POST /api/upload
   - POST /api/extract
   - POST /api/analyse
   - GET /api/companies
   - GET /api/export

3. Fix any TypeScript errors

4. Fix any console errors

5. Verify mobile responsiveness:
   - Sidebar collapses
   - Tables scroll horizontally
   - Forms are usable

6. Add any missing loading states

7. Add any missing error handling

Create a summary of any issues found and fixes applied.
```

**✅ Final Verify:** Complete user journey works: Login -> Upload PDF -> See extraction -> View company -> Export

---

## Quick Reference: Command Summary

| Step | Description | Mode |
|------|-------------|------|
| 1 | Init Next.js | Agent |
| 2 | Install deps | Agent |
| 3 | Setup shadcn | Agent |
| 4 | Folder structure | Agent |
| 5 | Environment | Agent |
| 6 | Database schema | Agent + Manual SQL |
| 7 | Supabase clients | Agent |
| 8 | Auth pages | Agent |
| 9 | Auth middleware | Agent |
| 10 | Dashboard layout | Agent |
| 11 | Dashboard home | Agent |
| 12 | Upload UI | Agent |
| 13 | Upload API | Agent |
| 14 | Zod schemas | Agent |
| 15 | PDF extraction | Agent |
| 16 | Financial parser | Agent |
| 17 | Extraction API | Agent |
| 18 | IC detection | Agent |
| 19 | Thin cap/ATAD | Agent |
| 20 | Scoring engine | Agent |
| 21 | Company list | Agent |
| 22 | Company detail | Agent |
| 23 | Analysis API | Agent |
| 24 | Claude API | Agent |
| 25 | AI display | Agent |
| 26 | Export | Agent |
| 27 | Processing queue | Agent |
| 28 | Analytics | Agent |
| 29 | Settings | Agent |
| 30 | Final review | Agent |

---

## Tips for Success

1. **Run `npm run dev` after each step** - catch errors early

2. **Commit to git after each phase** - easy to rollback if needed

3. **If Claude gets confused**, start a new chat and reference the step number

4. **For complex steps**, you can split into smaller prompts

5. **If something breaks**, describe the error to Claude and ask it to fix

6. **Test with a real PDF** after Step 17 to verify extraction works

---

*Good luck with the build, Paul! 🚀*
