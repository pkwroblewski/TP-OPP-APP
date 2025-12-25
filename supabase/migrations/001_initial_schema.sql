-- TP Opportunity Finder - Initial Database Schema
-- Version: 1.0
-- Created: December 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FUNCTION: Update timestamp trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLE: companies
-- Core company information
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rcs_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    legal_form VARCHAR(50),
    registered_address TEXT,
    incorporation_date DATE,
    nace_code VARCHAR(10),
    parent_company_name VARCHAR(500),
    parent_country_code VARCHAR(3),
    ultimate_parent_name VARCHAR(500),
    ultimate_parent_country VARCHAR(3),
    is_part_of_group BOOLEAN DEFAULT false,
    last_filing_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_companies_rcs_number ON companies(rcs_number);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_parent_country ON companies(parent_country_code);

-- ============================================
-- TABLE: upload_batches
-- Track batch uploads
-- ============================================
CREATE TABLE upload_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID REFERENCES auth.users(id),
    upload_type VARCHAR(20) DEFAULT 'manual_single',
    total_files INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_upload_batches_status ON upload_batches(status);
CREATE INDEX idx_upload_batches_uploaded_by ON upload_batches(uploaded_by);

-- ============================================
-- TABLE: filings
-- Individual annual account filings
-- ============================================
CREATE TABLE filings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    filing_date DATE,
    filing_type VARCHAR(50),
    source_url TEXT,
    pdf_stored_path TEXT,
    extraction_status VARCHAR(20) DEFAULT 'pending',
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, fiscal_year, filing_type)
);

-- Indexes
CREATE INDEX idx_filings_company_id ON filings(company_id);
CREATE INDEX idx_filings_fiscal_year ON filings(fiscal_year);
CREATE INDEX idx_filings_extraction_status ON filings(extraction_status);

-- ============================================
-- TABLE: uploaded_files
-- Track individual uploaded files
-- ============================================
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES upload_batches(id) ON DELETE CASCADE,
    original_filename VARCHAR(500),
    file_size_bytes INTEGER,
    file_path TEXT,
    extraction_status VARCHAR(20) DEFAULT 'pending',
    extraction_error TEXT,
    detected_company_name VARCHAR(500),
    detected_rcs_number VARCHAR(20),
    detected_fiscal_year INTEGER,
    detected_language VARCHAR(10),
    detection_confidence VARCHAR(20),
    confirmed_company_id UUID REFERENCES companies(id),
    confirmed_fiscal_year INTEGER,
    user_confirmed BOOLEAN DEFAULT false,
    filing_id UUID REFERENCES filings(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE TRIGGER update_uploaded_files_updated_at
    BEFORE UPDATE ON uploaded_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_uploaded_files_batch_id ON uploaded_files(batch_id);
CREATE INDEX idx_uploaded_files_extraction_status ON uploaded_files(extraction_status);

-- ============================================
-- TABLE: financial_data
-- Extracted financial information
-- ============================================
CREATE TABLE financial_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filing_id UUID REFERENCES filings(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,

    -- Balance Sheet - Assets
    total_assets DECIMAL(20,2),
    fixed_assets DECIMAL(20,2),
    financial_fixed_assets DECIMAL(20,2),
    ic_loans_receivable DECIMAL(20,2),
    ic_receivables_trade DECIMAL(20,2),
    cash_and_equivalents DECIMAL(20,2),

    -- Balance Sheet - Equity & Liabilities
    total_equity DECIMAL(20,2),
    share_capital DECIMAL(20,2),
    retained_earnings DECIMAL(20,2),
    total_debt DECIMAL(20,2),
    ic_loans_payable DECIMAL(20,2),
    ic_payables_trade DECIMAL(20,2),
    third_party_debt DECIMAL(20,2),

    -- P&L - Revenue
    turnover DECIMAL(20,2),
    other_operating_income DECIMAL(20,2),
    ic_revenue DECIMAL(20,2),

    -- P&L - Financial Items
    interest_income_total DECIMAL(20,2),
    interest_income_ic DECIMAL(20,2),
    interest_expense_total DECIMAL(20,2),
    interest_expense_ic DECIMAL(20,2),
    dividend_income DECIMAL(20,2),

    -- P&L - Fees and Services
    management_fees DECIMAL(20,2),
    royalty_expense DECIMAL(20,2),
    service_fees_ic DECIMAL(20,2),

    -- P&L - Results
    operating_result DECIMAL(20,2),
    financial_result DECIMAL(20,2),
    profit_before_tax DECIMAL(20,2),
    tax_expense DECIMAL(20,2),
    net_profit DECIMAL(20,2),

    -- Calculated Metrics
    debt_to_equity_ratio DECIMAL(10,4),
    ic_debt_to_total_debt_ratio DECIMAL(10,4),
    interest_coverage_ratio DECIMAL(10,4),
    net_interest_margin DECIMAL(10,4),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_financial_data_filing_id ON financial_data(filing_id);
CREATE INDEX idx_financial_data_company_id ON financial_data(company_id);
CREATE INDEX idx_financial_data_fiscal_year ON financial_data(fiscal_year);

-- ============================================
-- TABLE: ic_transactions
-- Detected intercompany transactions
-- ============================================
CREATE TABLE ic_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    filing_id UUID REFERENCES filings(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,

    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL,
    transaction_category VARCHAR(30),
    principal_amount DECIMAL(20,2),
    annual_flow DECIMAL(20,2),
    counterparty_name VARCHAR(500),
    counterparty_country VARCHAR(3),

    -- Rate Analysis
    implied_interest_rate DECIMAL(8,4),
    market_rate_benchmark DECIMAL(8,4),
    rate_deviation_bps INTEGER,

    -- Flags
    is_cross_border BOOLEAN DEFAULT false,
    is_high_value BOOLEAN DEFAULT false,
    is_rate_anomaly BOOLEAN DEFAULT false,
    is_thin_cap_risk BOOLEAN DEFAULT false,

    -- Extraction Metadata
    source_note TEXT,
    extraction_confidence VARCHAR(20),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraint for transaction types
    CONSTRAINT valid_transaction_type CHECK (
        transaction_type IN (
            'ic_loan_granted',
            'ic_loan_received',
            'management_fee',
            'royalty',
            'guarantee',
            'cash_pool',
            'service_fee'
        )
    ),

    -- Constraint for transaction categories
    CONSTRAINT valid_transaction_category CHECK (
        transaction_category IN (
            'financing',
            'services',
            'ip',
            'goods'
        )
    )
);

-- Indexes
CREATE INDEX idx_ic_transactions_company_id ON ic_transactions(company_id);
CREATE INDEX idx_ic_transactions_fiscal_year ON ic_transactions(fiscal_year);
CREATE INDEX idx_ic_transactions_type ON ic_transactions(transaction_type);
CREATE INDEX idx_ic_transactions_is_rate_anomaly ON ic_transactions(is_rate_anomaly);

-- ============================================
-- TABLE: tp_assessments
-- Transfer pricing opportunity assessments
-- ============================================
CREATE TABLE tp_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    assessment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Scores
    total_score INTEGER,
    priority_tier VARCHAR(10),
    financing_risk_score INTEGER,
    services_risk_score INTEGER,
    documentation_risk_score INTEGER,
    materiality_score INTEGER,
    complexity_score INTEGER,

    -- Flags
    has_ic_financing BOOLEAN DEFAULT false,
    has_ic_services BOOLEAN DEFAULT false,
    has_ic_royalties BOOLEAN DEFAULT false,
    has_cross_border_ic BOOLEAN DEFAULT false,
    has_thin_cap_indicators BOOLEAN DEFAULT false,
    has_rate_anomalies BOOLEAN DEFAULT false,

    -- Documentation Requirements
    likely_needs_local_file BOOLEAN DEFAULT false,
    likely_needs_master_file BOOLEAN DEFAULT false,

    -- Volume
    estimated_ic_volume DECIMAL(20,2),

    -- AI Analysis
    ai_summary TEXT,
    ai_key_findings JSONB,
    ai_recommended_approach TEXT,

    -- Outreach Management
    outreach_status VARCHAR(20) DEFAULT 'new',
    outreach_notes TEXT,
    assigned_to VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint
    UNIQUE(company_id, fiscal_year),

    -- Priority tier constraint
    CONSTRAINT valid_priority_tier CHECK (
        priority_tier IN ('A', 'B', 'C')
    ),

    -- Outreach status constraint
    CONSTRAINT valid_outreach_status CHECK (
        outreach_status IN (
            'new',
            'contacted',
            'meeting',
            'proposal',
            'won',
            'lost',
            'on_hold'
        )
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_tp_assessments_updated_at
    BEFORE UPDATE ON tp_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_tp_assessments_company_id ON tp_assessments(company_id);
CREATE INDEX idx_tp_assessments_fiscal_year ON tp_assessments(fiscal_year);
CREATE INDEX idx_tp_assessments_priority_tier ON tp_assessments(priority_tier);
CREATE INDEX idx_tp_assessments_total_score ON tp_assessments(total_score);
CREATE INDEX idx_tp_assessments_outreach_status ON tp_assessments(outreach_status);

-- ============================================
-- TABLE: tp_benchmarks
-- Market rate benchmarks for comparison
-- ============================================
CREATE TABLE tp_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_type VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    credit_rating VARCHAR(10),
    tenor_years INTEGER,
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraint for benchmark types
    CONSTRAINT valid_benchmark_type CHECK (
        benchmark_type IN (
            'euribor_1m',
            'euribor_3m',
            'euribor_6m',
            'euribor_12m',
            'credit_spread_aaa',
            'credit_spread_aa',
            'credit_spread_a',
            'credit_spread_bbb',
            'credit_spread_bb',
            'guarantee_fee',
            'management_fee_rate'
        )
    )
);

-- Indexes
CREATE INDEX idx_tp_benchmarks_type ON tp_benchmarks(benchmark_type);
CREATE INDEX idx_tp_benchmarks_date ON tp_benchmarks(effective_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Basic policies for authenticated users
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ic_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tp_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tp_benchmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all data
CREATE POLICY "Authenticated users can read companies"
    ON companies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert companies"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
    ON companies FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete companies"
    ON companies FOR DELETE
    TO authenticated
    USING (true);

-- Upload batches - users can only see their own
CREATE POLICY "Users can read own upload batches"
    ON upload_batches FOR SELECT
    TO authenticated
    USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert own upload batches"
    ON upload_batches FOR INSERT
    TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own upload batches"
    ON upload_batches FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid());

-- Uploaded files - users can see files from their batches
CREATE POLICY "Users can read own uploaded files"
    ON uploaded_files FOR SELECT
    TO authenticated
    USING (
        batch_id IN (
            SELECT id FROM upload_batches WHERE uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert uploaded files"
    ON uploaded_files FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update uploaded files"
    ON uploaded_files FOR UPDATE
    TO authenticated
    USING (true);

-- Filings - all authenticated users can access
CREATE POLICY "Authenticated users can read filings"
    ON filings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert filings"
    ON filings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update filings"
    ON filings FOR UPDATE
    TO authenticated
    USING (true);

-- Financial data - all authenticated users can access
CREATE POLICY "Authenticated users can read financial_data"
    ON financial_data FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert financial_data"
    ON financial_data FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update financial_data"
    ON financial_data FOR UPDATE
    TO authenticated
    USING (true);

-- IC transactions - all authenticated users can access
CREATE POLICY "Authenticated users can read ic_transactions"
    ON ic_transactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert ic_transactions"
    ON ic_transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update ic_transactions"
    ON ic_transactions FOR UPDATE
    TO authenticated
    USING (true);

-- TP assessments - all authenticated users can access
CREATE POLICY "Authenticated users can read tp_assessments"
    ON tp_assessments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert tp_assessments"
    ON tp_assessments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update tp_assessments"
    ON tp_assessments FOR UPDATE
    TO authenticated
    USING (true);

-- Benchmarks - all authenticated users can read
CREATE POLICY "Authenticated users can read tp_benchmarks"
    ON tp_benchmarks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert tp_benchmarks"
    ON tp_benchmarks FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- SEED DATA: Initial benchmarks
-- ============================================
INSERT INTO tp_benchmarks (benchmark_type, effective_date, value, currency, source, notes) VALUES
    ('euribor_3m', '2024-01-01', 3.9080, 'EUR', 'ECB', 'EURIBOR 3-month rate'),
    ('euribor_6m', '2024-01-01', 3.8610, 'EUR', 'ECB', 'EURIBOR 6-month rate'),
    ('euribor_12m', '2024-01-01', 3.5310, 'EUR', 'ECB', 'EURIBOR 12-month rate'),
    ('credit_spread_aaa', '2024-01-01', 0.2500, 'EUR', 'Market data', 'AAA corporate spread'),
    ('credit_spread_aa', '2024-01-01', 0.5000, 'EUR', 'Market data', 'AA corporate spread'),
    ('credit_spread_a', '2024-01-01', 0.7500, 'EUR', 'Market data', 'A corporate spread'),
    ('credit_spread_bbb', '2024-01-01', 1.2500, 'EUR', 'Market data', 'BBB corporate spread'),
    ('credit_spread_bb', '2024-01-01', 2.5000, 'EUR', 'Market data', 'BB corporate spread'),
    ('guarantee_fee', '2024-01-01', 0.5000, 'EUR', 'OECD guidance', 'Typical guarantee fee range'),
    ('management_fee_rate', '2024-01-01', 5.0000, 'EUR', 'Market practice', 'Management fee as % of costs');

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE companies IS 'Core company information for TP analysis';
COMMENT ON TABLE upload_batches IS 'Track batch uploads of financial accounts';
COMMENT ON TABLE uploaded_files IS 'Individual uploaded PDF files';
COMMENT ON TABLE filings IS 'Annual account filings linked to companies';
COMMENT ON TABLE financial_data IS 'Extracted financial data from filings';
COMMENT ON TABLE ic_transactions IS 'Detected intercompany transactions';
COMMENT ON TABLE tp_assessments IS 'Transfer pricing opportunity assessments and scores';
COMMENT ON TABLE tp_benchmarks IS 'Market rate benchmarks for TP analysis';
