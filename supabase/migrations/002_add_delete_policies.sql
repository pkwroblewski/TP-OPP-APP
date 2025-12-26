-- Add DELETE policies for tables that were missing them

-- Filings
CREATE POLICY "Authenticated users can delete filings"
  ON filings
  FOR DELETE
  TO authenticated
  USING (true);

-- Financial data
CREATE POLICY "Authenticated users can delete financial_data"
  ON financial_data
  FOR DELETE
  TO authenticated
  USING (true);

-- IC Transactions
CREATE POLICY "Authenticated users can delete ic_transactions"
  ON ic_transactions
  FOR DELETE
  TO authenticated
  USING (true);

-- TP Assessments
CREATE POLICY "Authenticated users can delete tp_assessments"
  ON tp_assessments
  FOR DELETE
  TO authenticated
  USING (true);

-- Uploaded files
CREATE POLICY "Users can delete uploaded files"
  ON uploaded_files
  FOR DELETE
  TO authenticated
  USING (true);

-- Upload batches
CREATE POLICY "Users can delete upload batches"
  ON upload_batches
  FOR DELETE
  TO authenticated
  USING (true);
