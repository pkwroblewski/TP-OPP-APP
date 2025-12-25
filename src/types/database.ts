/**
 * Database types for Supabase
 * These types match the schema defined in supabase/migrations/001_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          rcs_number: string;
          name: string;
          legal_form: string | null;
          registered_address: string | null;
          incorporation_date: string | null;
          nace_code: string | null;
          parent_company_name: string | null;
          parent_country_code: string | null;
          ultimate_parent_name: string | null;
          ultimate_parent_country: string | null;
          is_part_of_group: boolean;
          last_filing_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rcs_number: string;
          name: string;
          legal_form?: string | null;
          registered_address?: string | null;
          incorporation_date?: string | null;
          nace_code?: string | null;
          parent_company_name?: string | null;
          parent_country_code?: string | null;
          ultimate_parent_name?: string | null;
          ultimate_parent_country?: string | null;
          is_part_of_group?: boolean;
          last_filing_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rcs_number?: string;
          name?: string;
          legal_form?: string | null;
          registered_address?: string | null;
          incorporation_date?: string | null;
          nace_code?: string | null;
          parent_company_name?: string | null;
          parent_country_code?: string | null;
          ultimate_parent_name?: string | null;
          ultimate_parent_country?: string | null;
          is_part_of_group?: boolean;
          last_filing_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      upload_batches: {
        Row: {
          id: string;
          uploaded_by: string | null;
          upload_type: string;
          total_files: number;
          processed_files: number;
          failed_files: number;
          status: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          uploaded_by?: string | null;
          upload_type?: string;
          total_files?: number;
          processed_files?: number;
          failed_files?: number;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          uploaded_by?: string | null;
          upload_type?: string;
          total_files?: number;
          processed_files?: number;
          failed_files?: number;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      uploaded_files: {
        Row: {
          id: string;
          batch_id: string | null;
          original_filename: string | null;
          file_size_bytes: number | null;
          file_path: string | null;
          extraction_status: string;
          extraction_error: string | null;
          detected_company_name: string | null;
          detected_rcs_number: string | null;
          detected_fiscal_year: number | null;
          detected_language: string | null;
          detection_confidence: string | null;
          confirmed_company_id: string | null;
          confirmed_fiscal_year: number | null;
          user_confirmed: boolean;
          filing_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id?: string | null;
          original_filename?: string | null;
          file_size_bytes?: number | null;
          file_path?: string | null;
          extraction_status?: string;
          extraction_error?: string | null;
          detected_company_name?: string | null;
          detected_rcs_number?: string | null;
          detected_fiscal_year?: number | null;
          detected_language?: string | null;
          detection_confidence?: string | null;
          confirmed_company_id?: string | null;
          confirmed_fiscal_year?: number | null;
          user_confirmed?: boolean;
          filing_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string | null;
          original_filename?: string | null;
          file_size_bytes?: number | null;
          file_path?: string | null;
          extraction_status?: string;
          extraction_error?: string | null;
          detected_company_name?: string | null;
          detected_rcs_number?: string | null;
          detected_fiscal_year?: number | null;
          detected_language?: string | null;
          detection_confidence?: string | null;
          confirmed_company_id?: string | null;
          confirmed_fiscal_year?: number | null;
          user_confirmed?: boolean;
          filing_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "uploaded_files_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "upload_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "uploaded_files_filing_id_fkey";
            columns: ["filing_id"];
            isOneToOne: false;
            referencedRelation: "filings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "uploaded_files_confirmed_company_id_fkey";
            columns: ["confirmed_company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      filings: {
        Row: {
          id: string;
          company_id: string | null;
          fiscal_year: number;
          filing_date: string | null;
          filing_type: string | null;
          source_url: string | null;
          pdf_stored_path: string | null;
          extraction_status: string;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          fiscal_year: number;
          filing_date?: string | null;
          filing_type?: string | null;
          source_url?: string | null;
          pdf_stored_path?: string | null;
          extraction_status?: string;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          fiscal_year?: number;
          filing_date?: string | null;
          filing_type?: string | null;
          source_url?: string | null;
          pdf_stored_path?: string | null;
          extraction_status?: string;
          extracted_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "filings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      financial_data: {
        Row: {
          id: string;
          filing_id: string | null;
          company_id: string | null;
          fiscal_year: number;
          total_assets: number | null;
          fixed_assets: number | null;
          financial_fixed_assets: number | null;
          ic_loans_receivable: number | null;
          ic_receivables_trade: number | null;
          cash_and_equivalents: number | null;
          total_equity: number | null;
          share_capital: number | null;
          retained_earnings: number | null;
          total_debt: number | null;
          ic_loans_payable: number | null;
          ic_payables_trade: number | null;
          third_party_debt: number | null;
          turnover: number | null;
          other_operating_income: number | null;
          ic_revenue: number | null;
          interest_income_total: number | null;
          interest_income_ic: number | null;
          interest_expense_total: number | null;
          interest_expense_ic: number | null;
          dividend_income: number | null;
          management_fees: number | null;
          royalty_expense: number | null;
          service_fees_ic: number | null;
          operating_result: number | null;
          financial_result: number | null;
          profit_before_tax: number | null;
          tax_expense: number | null;
          net_profit: number | null;
          debt_to_equity_ratio: number | null;
          ic_debt_to_total_debt_ratio: number | null;
          interest_coverage_ratio: number | null;
          net_interest_margin: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          filing_id?: string | null;
          company_id?: string | null;
          fiscal_year: number;
          total_assets?: number | null;
          fixed_assets?: number | null;
          financial_fixed_assets?: number | null;
          ic_loans_receivable?: number | null;
          ic_receivables_trade?: number | null;
          cash_and_equivalents?: number | null;
          total_equity?: number | null;
          share_capital?: number | null;
          retained_earnings?: number | null;
          total_debt?: number | null;
          ic_loans_payable?: number | null;
          ic_payables_trade?: number | null;
          third_party_debt?: number | null;
          turnover?: number | null;
          other_operating_income?: number | null;
          ic_revenue?: number | null;
          interest_income_total?: number | null;
          interest_income_ic?: number | null;
          interest_expense_total?: number | null;
          interest_expense_ic?: number | null;
          dividend_income?: number | null;
          management_fees?: number | null;
          royalty_expense?: number | null;
          service_fees_ic?: number | null;
          operating_result?: number | null;
          financial_result?: number | null;
          profit_before_tax?: number | null;
          tax_expense?: number | null;
          net_profit?: number | null;
          debt_to_equity_ratio?: number | null;
          ic_debt_to_total_debt_ratio?: number | null;
          interest_coverage_ratio?: number | null;
          net_interest_margin?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          filing_id?: string | null;
          company_id?: string | null;
          fiscal_year?: number;
          total_assets?: number | null;
          fixed_assets?: number | null;
          financial_fixed_assets?: number | null;
          ic_loans_receivable?: number | null;
          ic_receivables_trade?: number | null;
          cash_and_equivalents?: number | null;
          total_equity?: number | null;
          share_capital?: number | null;
          retained_earnings?: number | null;
          total_debt?: number | null;
          ic_loans_payable?: number | null;
          ic_payables_trade?: number | null;
          third_party_debt?: number | null;
          turnover?: number | null;
          other_operating_income?: number | null;
          ic_revenue?: number | null;
          interest_income_total?: number | null;
          interest_income_ic?: number | null;
          interest_expense_total?: number | null;
          interest_expense_ic?: number | null;
          dividend_income?: number | null;
          management_fees?: number | null;
          royalty_expense?: number | null;
          service_fees_ic?: number | null;
          operating_result?: number | null;
          financial_result?: number | null;
          profit_before_tax?: number | null;
          tax_expense?: number | null;
          net_profit?: number | null;
          debt_to_equity_ratio?: number | null;
          ic_debt_to_total_debt_ratio?: number | null;
          interest_coverage_ratio?: number | null;
          net_interest_margin?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_data_filing_id_fkey";
            columns: ["filing_id"];
            isOneToOne: false;
            referencedRelation: "filings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_data_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      ic_transactions: {
        Row: {
          id: string;
          company_id: string | null;
          filing_id: string | null;
          fiscal_year: number;
          transaction_type: string;
          transaction_category: string | null;
          principal_amount: number | null;
          annual_flow: number | null;
          counterparty_name: string | null;
          counterparty_country: string | null;
          implied_interest_rate: number | null;
          market_rate_benchmark: number | null;
          rate_deviation_bps: number | null;
          is_cross_border: boolean;
          is_high_value: boolean;
          is_rate_anomaly: boolean;
          is_thin_cap_risk: boolean;
          source_note: string | null;
          extraction_confidence: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          filing_id?: string | null;
          fiscal_year: number;
          transaction_type: string;
          transaction_category?: string | null;
          principal_amount?: number | null;
          annual_flow?: number | null;
          counterparty_name?: string | null;
          counterparty_country?: string | null;
          implied_interest_rate?: number | null;
          market_rate_benchmark?: number | null;
          rate_deviation_bps?: number | null;
          is_cross_border?: boolean;
          is_high_value?: boolean;
          is_rate_anomaly?: boolean;
          is_thin_cap_risk?: boolean;
          source_note?: string | null;
          extraction_confidence?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          filing_id?: string | null;
          fiscal_year?: number;
          transaction_type?: string;
          transaction_category?: string | null;
          principal_amount?: number | null;
          annual_flow?: number | null;
          counterparty_name?: string | null;
          counterparty_country?: string | null;
          implied_interest_rate?: number | null;
          market_rate_benchmark?: number | null;
          rate_deviation_bps?: number | null;
          is_cross_border?: boolean;
          is_high_value?: boolean;
          is_rate_anomaly?: boolean;
          is_thin_cap_risk?: boolean;
          source_note?: string | null;
          extraction_confidence?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ic_transactions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ic_transactions_filing_id_fkey";
            columns: ["filing_id"];
            isOneToOne: false;
            referencedRelation: "filings";
            referencedColumns: ["id"];
          }
        ];
      };
      tp_assessments: {
        Row: {
          id: string;
          company_id: string | null;
          fiscal_year: number;
          assessment_date: string;
          total_score: number | null;
          priority_tier: string | null;
          financing_risk_score: number | null;
          services_risk_score: number | null;
          documentation_risk_score: number | null;
          materiality_score: number | null;
          complexity_score: number | null;
          has_ic_financing: boolean;
          has_ic_services: boolean;
          has_ic_royalties: boolean;
          has_cross_border_ic: boolean;
          has_thin_cap_indicators: boolean;
          has_rate_anomalies: boolean;
          likely_needs_local_file: boolean;
          likely_needs_master_file: boolean;
          estimated_ic_volume: number | null;
          ai_summary: string | null;
          ai_key_findings: Json | null;
          ai_recommended_approach: string | null;
          outreach_status: string;
          outreach_notes: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          fiscal_year: number;
          assessment_date?: string;
          total_score?: number | null;
          priority_tier?: string | null;
          financing_risk_score?: number | null;
          services_risk_score?: number | null;
          documentation_risk_score?: number | null;
          materiality_score?: number | null;
          complexity_score?: number | null;
          has_ic_financing?: boolean;
          has_ic_services?: boolean;
          has_ic_royalties?: boolean;
          has_cross_border_ic?: boolean;
          has_thin_cap_indicators?: boolean;
          has_rate_anomalies?: boolean;
          likely_needs_local_file?: boolean;
          likely_needs_master_file?: boolean;
          estimated_ic_volume?: number | null;
          ai_summary?: string | null;
          ai_key_findings?: Json | null;
          ai_recommended_approach?: string | null;
          outreach_status?: string;
          outreach_notes?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          fiscal_year?: number;
          assessment_date?: string;
          total_score?: number | null;
          priority_tier?: string | null;
          financing_risk_score?: number | null;
          services_risk_score?: number | null;
          documentation_risk_score?: number | null;
          materiality_score?: number | null;
          complexity_score?: number | null;
          has_ic_financing?: boolean;
          has_ic_services?: boolean;
          has_ic_royalties?: boolean;
          has_cross_border_ic?: boolean;
          has_thin_cap_indicators?: boolean;
          has_rate_anomalies?: boolean;
          likely_needs_local_file?: boolean;
          likely_needs_master_file?: boolean;
          estimated_ic_volume?: number | null;
          ai_summary?: string | null;
          ai_key_findings?: Json | null;
          ai_recommended_approach?: string | null;
          outreach_status?: string;
          outreach_notes?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tp_assessments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      tp_benchmarks: {
        Row: {
          id: string;
          benchmark_type: string;
          effective_date: string;
          value: number;
          currency: string;
          credit_rating: string | null;
          tenor_years: number | null;
          source: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          benchmark_type: string;
          effective_date: string;
          value: number;
          currency?: string;
          credit_rating?: string | null;
          tenor_years?: number | null;
          source?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          benchmark_type?: string;
          effective_date?: string;
          value?: number;
          currency?: string;
          credit_rating?: string | null;
          tenor_years?: number | null;
          source?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience type aliases
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export type UploadBatch = Database['public']['Tables']['upload_batches']['Row'];
export type UploadBatchInsert = Database['public']['Tables']['upload_batches']['Insert'];

export type UploadedFile = Database['public']['Tables']['uploaded_files']['Row'];
export type UploadedFileInsert = Database['public']['Tables']['uploaded_files']['Insert'];

export type Filing = Database['public']['Tables']['filings']['Row'];
export type FilingInsert = Database['public']['Tables']['filings']['Insert'];

export type FinancialData = Database['public']['Tables']['financial_data']['Row'];
export type FinancialDataInsert = Database['public']['Tables']['financial_data']['Insert'];

export type ICTransaction = Database['public']['Tables']['ic_transactions']['Row'];
export type ICTransactionInsert = Database['public']['Tables']['ic_transactions']['Insert'];

export type TPAssessment = Database['public']['Tables']['tp_assessments']['Row'];
export type TPAssessmentInsert = Database['public']['Tables']['tp_assessments']['Insert'];

export type TPBenchmark = Database['public']['Tables']['tp_benchmarks']['Row'];
export type TPBenchmarkInsert = Database['public']['Tables']['tp_benchmarks']['Insert'];

// Transaction type literals
export type TransactionType =
  | 'ic_loan_granted'
  | 'ic_loan_received'
  | 'management_fee'
  | 'royalty'
  | 'guarantee'
  | 'cash_pool'
  | 'service_fee';

export type TransactionCategory = 'financing' | 'services' | 'ip' | 'goods';

export type PriorityTier = 'A' | 'B' | 'C';

export type OutreachStatus =
  | 'new'
  | 'contacted'
  | 'meeting'
  | 'proposal'
  | 'won'
  | 'lost'
  | 'on_hold';

export type ExtractionStatus = 'pending' | 'extracting' | 'completed' | 'failed';

// Helper type for Supabase Tables utility
type PublicSchema = Database['public'];

export type Tables<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Row'];

export type TablesInsert<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Insert'];

export type TablesUpdate<
  TableName extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][TableName]['Update'];
