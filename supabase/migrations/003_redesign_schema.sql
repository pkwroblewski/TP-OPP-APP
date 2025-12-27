-- TP Opportunity Finder - Redesign Schema Update
-- Version: 2.0
-- Created: December 2024
-- Purpose: Add audit trail, opportunity status, market benchmarks, and enhanced fields

-- ============================================
-- TABLE: audit_trail
-- Track all actions on companies
-- ============================================
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_details JSONB,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraint for action types
    CONSTRAINT valid_action_type CHECK (
        action_type IN (
            'created',
            'viewed',
            'contacted',
            'meeting',
            'proposal',
            'won',
            'lost',
            'note_added',
            'status_changed',
            'analyzed',
            'exported'
        )
    )
);

-- Indexes for audit trail
CREATE INDEX idx_audit_trail_company ON audit_trail(company_id);
CREATE INDEX idx_audit_trail_date ON audit_trail(performed_at DESC);
CREATE INDEX idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX idx_audit_trail_performed_by ON audit_trail(performed_by);

-- ============================================
-- TABLE: opportunity_status
-- Track opportunity pipeline status for each company
-- ============================================
CREATE TABLE opportunity_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'medium',
    estimated_value_low DECIMAL(15,2),
    estimated_value_high DECIMAL(15,2),
    next_action TEXT,
    next_action_date DATE,
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraint for status values
    CONSTRAINT valid_opportunity_status CHECK (
        status IN (
            'new',
            'contacted',
            'meeting',
            'proposal',
            'won',
            'lost',
            'on_hold'
        )
    ),

    -- Constraint for priority values
    CONSTRAINT valid_opportunity_priority CHECK (
        priority IN (
            'high',
            'medium',
            'low'
        )
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_opportunity_status_updated_at
    BEFORE UPDATE ON opportunity_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX idx_opportunity_status_status ON opportunity_status(status);
CREATE INDEX idx_opportunity_status_priority ON opportunity_status(priority);

-- ============================================
-- TABLE: market_benchmarks
-- Market benchmark rates for comparison
-- ============================================
CREATE TABLE market_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_type TEXT NOT NULL,
    low_value DECIMAL(10,4),
    high_value DECIMAL(10,4),
    unit TEXT,
    description TEXT,
    source TEXT,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraint for benchmark types
    CONSTRAINT valid_market_benchmark_type CHECK (
        benchmark_type IN (
            'treasury_spread',
            'guarantee_fee',
            'management_fee_admin',
            'royalty_rate',
            'service_fee_markup'
        )
    ),

    -- Constraint for units
    CONSTRAINT valid_benchmark_unit CHECK (
        unit IN (
            'bps',
            'percent',
            'eur'
        )
    )
);

-- Insert default market benchmarks
INSERT INTO market_benchmarks (benchmark_type, low_value, high_value, unit, description, source, effective_date) VALUES
    ('treasury_spread', 25, 75, 'bps', 'Typical spread for treasury/financing entities', 'Luxembourg TP Circular', CURRENT_DATE),
    ('guarantee_fee', 25, 75, 'bps', 'Typical guarantee fee range', 'Market practice', CURRENT_DATE),
    ('management_fee_admin', 2, 5, 'percent', 'Management fee as % of costs plus markup', 'OECD Guidelines', CURRENT_DATE),
    ('royalty_rate', 1, 5, 'percent', 'Typical royalty rate range', 'Market practice', CURRENT_DATE),
    ('service_fee_markup', 5, 10, 'percent', 'Typical cost plus markup for services', 'OECD Guidelines', CURRENT_DATE);

-- Index
CREATE INDEX idx_market_benchmarks_type ON market_benchmarks(benchmark_type);

-- ============================================
-- ALTER TABLE: companies - Add new fields
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS principal_activity TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_sector TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS number_of_employees INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_financial_intermediary BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auditor TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS management_company TEXT;

-- ============================================
-- ALTER TABLE: financial_data - Add enhanced fields
-- ============================================
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS net_ic_position DECIMAL(20,2);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS net_interest_margin_eur DECIMAL(20,2);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS net_interest_margin_pct DECIMAL(10,4);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS spread_bps INTEGER;
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS spread_vs_benchmark TEXT;
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS average_lending_rate DECIMAL(10,4);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS average_borrowing_rate DECIMAL(10,4);
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS is_zero_spread BOOLEAN DEFAULT false;
ALTER TABLE financial_data ADD COLUMN IF NOT EXISTS is_low_spread BOOLEAN DEFAULT false;

-- ============================================
-- ALTER TABLE: tp_assessments - Add traffic light fields
-- ============================================
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS ic_risk_level TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS ic_risk_reasons TEXT[];
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS tp_risk_level TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS tp_risk_reasons TEXT[];
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS doc_risk_level TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS doc_risk_reasons TEXT[];
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS spread_vs_market TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS engagement_estimate_low DECIMAL(15,2);
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS engagement_estimate_high DECIMAL(15,2);
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS outreach_angle TEXT;
ALTER TABLE tp_assessments ADD COLUMN IF NOT EXISTS recommended_services TEXT[];

-- Add check constraints for risk levels
ALTER TABLE tp_assessments ADD CONSTRAINT valid_ic_risk_level CHECK (
    ic_risk_level IS NULL OR ic_risk_level IN ('RED', 'AMBER', 'GREEN')
);
ALTER TABLE tp_assessments ADD CONSTRAINT valid_tp_risk_level CHECK (
    tp_risk_level IS NULL OR tp_risk_level IN ('RED', 'AMBER', 'GREEN')
);
ALTER TABLE tp_assessments ADD CONSTRAINT valid_doc_risk_level CHECK (
    doc_risk_level IS NULL OR doc_risk_level IN ('RED', 'AMBER', 'GREEN')
);

-- ============================================
-- ALTER TABLE: filings - Add enhanced extraction data
-- ============================================
ALTER TABLE filings ADD COLUMN IF NOT EXISTS enhanced_extraction JSONB;
ALTER TABLE filings ADD COLUMN IF NOT EXISTS extraction_confidence TEXT;
ALTER TABLE filings ADD COLUMN IF NOT EXISTS document_quality TEXT;
ALTER TABLE filings ADD COLUMN IF NOT EXISTS related_party_notes TEXT;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES for new tables
-- ============================================

-- Enable RLS on new tables
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_benchmarks ENABLE ROW LEVEL SECURITY;

-- Audit trail policies
CREATE POLICY "Users can view audit trail"
    ON audit_trail FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert audit trail"
    ON audit_trail FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Opportunity status policies
CREATE POLICY "Users can view opportunity status"
    ON opportunity_status FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert opportunity status"
    ON opportunity_status FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update opportunity status"
    ON opportunity_status FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete opportunity status"
    ON opportunity_status FOR DELETE
    TO authenticated
    USING (true);

-- Market benchmarks policies (read only for regular users)
CREATE POLICY "Users can view market benchmarks"
    ON market_benchmarks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert market benchmarks"
    ON market_benchmarks FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE audit_trail IS 'Full audit trail of all actions on companies for tracking outreach';
COMMENT ON TABLE opportunity_status IS 'Pipeline status tracking for each company opportunity';
COMMENT ON TABLE market_benchmarks IS 'Market benchmark rates for spread comparison analysis';

COMMENT ON COLUMN tp_assessments.ic_risk_level IS 'Traffic light: RED/AMBER/GREEN for intercompany risk';
COMMENT ON COLUMN tp_assessments.tp_risk_level IS 'Traffic light: RED/AMBER/GREEN for transfer pricing risk';
COMMENT ON COLUMN tp_assessments.doc_risk_level IS 'Traffic light: RED/AMBER/GREEN for documentation risk';
COMMENT ON COLUMN financial_data.spread_bps IS 'Calculated spread in basis points between lending and borrowing rates';
COMMENT ON COLUMN financial_data.is_zero_spread IS 'Flag: true if company has zero spread on IC financing';
