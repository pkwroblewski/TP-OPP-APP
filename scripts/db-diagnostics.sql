-- ============================================
-- DATABASE DIAGNOSTICS FOR APERAM DATA
-- Run these queries in Supabase SQL Editor
-- ============================================

-- 1. Check all APERAM-related companies
SELECT id, name, rcs_number, created_at, is_part_of_group
FROM companies
WHERE name ILIKE '%APERAM%' OR rcs_number = 'B155908'
ORDER BY created_at DESC;

-- 2. Check all filings for these companies
SELECT
  f.id,
  f.company_id,
  f.company_name,
  f.rcs_number,
  f.fiscal_year,
  f.extraction_status,
  f.created_at,
  f.enhanced_extraction IS NOT NULL as has_enhanced_extraction,
  CASE
    WHEN f.enhanced_extraction->'validation'->'warnings' IS NOT NULL
    THEN jsonb_array_length(f.enhanced_extraction->'validation'->'warnings')
    ELSE 0
  END as warning_count,
  CASE
    WHEN f.enhanced_extraction->'tpOpportunities' IS NOT NULL
    THEN jsonb_array_length(f.enhanced_extraction->'tpOpportunities')
    ELSE 0
  END as tp_flag_count
FROM filings f
WHERE f.company_name ILIKE '%APERAM%' OR f.rcs_number = 'B155908'
ORDER BY f.created_at DESC;

-- 3. Check IC transactions (the source of hallucinated data)
SELECT
  t.id,
  t.company_id,
  t.filing_id,
  t.transaction_type,
  t.transaction_category,
  t.principal_amount,
  t.annual_flow,
  t.source_note,
  t.extraction_confidence,
  t.is_rate_anomaly,
  t.created_at
FROM ic_transactions t
JOIN companies c ON t.company_id = c.id
WHERE c.name ILIKE '%APERAM%' OR c.rcs_number = 'B155908'
ORDER BY t.created_at DESC;

-- 4. Check enhanced_extraction details for latest filing
SELECT
  company_name,
  enhanced_extraction->'extractionQuality' as quality,
  enhanced_extraction->'validation'->'warnings' as warnings,
  enhanced_extraction->'tpOpportunities' as tp_opportunities,
  enhanced_extraction->'balanceSheet'->'icLoansProvidedLongTerm' as loans_provided,
  enhanced_extraction->'profitAndLoss'->'item10aInterestFromAffiliates' as item_10a,
  enhanced_extraction->'profitAndLoss'->'item14aInterestToAffiliates' as item_14a
FROM filings
WHERE (company_name ILIKE '%APERAM%' OR rcs_number = 'B155908')
  AND enhanced_extraction IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- CLEANUP SCRIPT (Run after diagnostics)
-- ============================================

-- Delete all APERAM data to allow fresh extraction
DO $$
DECLARE
  company_ids uuid[];
BEGIN
  -- Get all APERAM company IDs
  SELECT ARRAY_AGG(id) INTO company_ids
  FROM companies
  WHERE name ILIKE '%APERAM%' OR rcs_number = 'B155908';

  IF company_ids IS NOT NULL AND array_length(company_ids, 1) > 0 THEN
    -- Delete in order (respecting foreign keys)
    DELETE FROM audit_trail WHERE company_id = ANY(company_ids);
    DELETE FROM ic_transactions WHERE company_id = ANY(company_ids);
    DELETE FROM tp_assessments WHERE company_id = ANY(company_ids);
    DELETE FROM financial_data WHERE company_id = ANY(company_ids);
    DELETE FROM opportunity_status WHERE company_id = ANY(company_ids);
    DELETE FROM filings WHERE company_id = ANY(company_ids);
    DELETE FROM uploaded_files WHERE confirmed_company_id = ANY(company_ids);
    DELETE FROM companies WHERE id = ANY(company_ids);

    RAISE NOTICE 'Deleted all data for % APERAM companies', array_length(company_ids, 1);
  ELSE
    RAISE NOTICE 'No APERAM data found to delete';
  END IF;
END $$;

-- Verify cleanup
SELECT COUNT(*) as remaining_aperam_companies
FROM companies
WHERE name ILIKE '%APERAM%' OR rcs_number = 'B155908';
