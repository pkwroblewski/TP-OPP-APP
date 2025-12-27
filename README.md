# TP Opportunity Finder

A transfer pricing opportunity identification application for Luxembourg that analyses financial accounts to detect intercompany transactions and score companies based on their TP advisory potential.

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL, Auth, Storage)
- **PDF Processing:** pdf-parse
- **AI Analysis:** Claude API (Anthropic)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

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

- EUR 91.3M Item 4 correctly flagged as "unverified" (Note 15 inaccessible)
- EUR 67.8M IC interest income extracted (Items 10a + 11a) - was missing before
- EUR 378.7M IC interest expense extracted (Item 14a) - was missing before
- 100% source tracking - zero hallucinations
- TP opportunities auto-detected (121.8% rate flagged)

### Quality Metrics

Every extraction provides:
- **Confidence Level:** HIGH/MEDIUM/LOW
- **Source Tracking:** All values sourced: Yes/No
- **Cross-Validation:** Loans vs Interest reconciled
- **TP Opportunities:** Automatically flagged

### Anti-Hallucination Guarantees

1. No value extracted without explicit source reference
2. Item 4 "Other Operating Income" flagged if note inaccessible
3. IC nature only confirmed with explicit keywords ("affiliated undertakings", "entreprises liées")
4. Impossible values detected and flagged
5. Zero-spread opportunities automatically identified

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard routes
│   │   ├── companies/      # Company management
│   │   ├── opportunities/  # Opportunity tracking
│   │   └── upload/         # PDF upload
│   └── api/                # API routes
│       ├── extract/        # Extraction endpoint
│       └── upload/         # Upload endpoint
├── components/             # React components
│   ├── layout/             # Layout components
│   ├── ui/                 # shadcn/ui components
│   └── validation/         # Validation display components
├── lib/
│   ├── services/           # Business logic
│   │   ├── luxembourgPatterns.ts      # Layer 0: Pattern library
│   │   ├── structuredExtractor.ts     # Layer 1: Structured extraction
│   │   ├── noteParser.ts              # Layer 2: Note parsing
│   │   ├── extractionValidator.ts     # Layer 3: Validation
│   │   ├── luxembourgExtractor.ts     # Integration layer
│   │   └── pdfExtractor.ts            # Main extraction orchestrator
│   └── utils/              # Utility functions
├── types/                  # TypeScript types
└── schemas/                # Zod validation schemas
```

## Key Features

- **PDF Upload:** Upload Luxembourg annual accounts in PDF format
- **Automatic Extraction:** 3-layer anti-hallucination extraction system
- **IC Transaction Detection:** Identifies all intercompany transactions
- **TP Opportunity Scoring:** Flags companies with TP advisory potential
- **Validation Dashboard:** Shows extraction quality and warnings
- **Traffic Light System:** Visual risk indicators for IC/TP/Documentation risk

## Documentation

- [Extraction Architecture](docs/extraction-architecture.md) - Technical documentation for the 3-layer system
- [Luxembourg Balance Sheet Structure](docs/lu-balance-sheet-structure.md) - Balance sheet extraction guide
- [Luxembourg P&L Structure](docs/lu-pnl-structure.md) - P&L extraction guide
- [IC Identification Guide](docs/lu-intercompany-identification-guide.md) - IC transaction identification

## Testing

Run the extraction test against the APERAM PDF:

```bash
npx tsx scripts/test-full-extraction.ts
```

Expected output: 8/8 checks passed

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OECD Transfer Pricing Guidelines](https://www.oecd.org/tax/transfer-pricing/)

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
