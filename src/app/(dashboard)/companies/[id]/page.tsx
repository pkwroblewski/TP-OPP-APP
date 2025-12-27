'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Copy,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  TrafficLight,
  TrafficLightWithReasons,
} from '@/components/ui/traffic-light';
import { cn } from '@/lib/utils';
import type {
  Company,
  FinancialData,
  TPAssessment,
  ICTransaction,
  AuditTrail,
  OpportunityStatus,
  RiskLevel,
  AuditActionType,
  ExtractionValidationWarning,
  ExtractionTPFlag,
  ExtractionQualityMetrics,
  Filing,
} from '@/types/database';
import {
  ValidationWarnings,
  TPOpportunities,
  ExtractionQualityBadge,
} from '@/components/validation';

// ============================================
// Types
// ============================================

interface CompanyData {
  company: Company;
  financialData: FinancialData | null;
  assessment: TPAssessment | null;
  transactions: ICTransaction[];
  auditTrail: AuditTrail[];
  opportunityStatus: OpportunityStatus | null;
  filing: Filing | null;
}

// Parse validation data from filing's enhanced_extraction JSON
interface EnhancedExtraction {
  validation?: {
    warnings?: ExtractionValidationWarning[];
    flags?: ExtractionTPFlag[];
    qualityMetrics?: ExtractionQualityMetrics;
  };
}

// ============================================
// Helper Functions
// ============================================

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (absAmount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (absAmount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(2)}%`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionLabel(action: AuditActionType): string {
  const labels: Record<AuditActionType, string> = {
    created: 'Company created',
    viewed: 'Viewed',
    contacted: 'Contacted',
    meeting: 'Meeting scheduled',
    proposal: 'Proposal sent',
    won: 'Marked as won',
    lost: 'Marked as lost',
    note_added: 'Note added',
    status_changed: 'Status changed',
    analyzed: 'Analysis completed',
    exported: 'Exported',
  };
  return labels[action] || action;
}

function getCountryFlag(code: string | null | undefined): string {
  if (!code) return '';
  const codeUpper = code.toUpperCase();
  const offset = 127397;
  return codeUpper.split('').map((c) => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
}

// ============================================
// Collapsible Section Component
// ============================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ============================================
// 1. COMPANY HEADER
// ============================================

interface CompanyHeaderProps {
  company: Company;
  assessment: TPAssessment | null;
  financialData: FinancialData | null;
}

function CompanyHeader({ company, assessment, financialData }: CompanyHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 uppercase">
            {company.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-slate-500">
            <span>RCS {company.rcs_number}</span>
            {company.legal_form && (
              <>
                <span className="text-slate-300">|</span>
                <span>{company.legal_form}</span>
              </>
            )}
            {financialData?.fiscal_year && (
              <>
                <span className="text-slate-300">|</span>
                <span>FY {financialData.fiscal_year}</span>
              </>
            )}
          </div>
          {company.parent_company_name && (
            <p className="mt-3 text-sm text-slate-600">
              <span className="text-slate-400">Parent:</span>{' '}
              {company.parent_company_name}{' '}
              {company.parent_country_code && (
                <span>
                  ({getCountryFlag(company.parent_country_code)} {company.parent_country_code})
                </span>
              )}
            </p>
          )}
        </div>

        {/* Traffic Lights */}
        <div className="flex items-start gap-6 lg:gap-8">
          <TrafficLightWithReasons
            level={assessment?.ic_risk_level as RiskLevel}
            reasons={assessment?.ic_risk_reasons}
            label="IC Risk"
            size="lg"
          />
          <TrafficLightWithReasons
            level={assessment?.tp_risk_level as RiskLevel}
            reasons={assessment?.tp_risk_reasons}
            label="TP Risk"
            size="lg"
          />
          <TrafficLightWithReasons
            level={assessment?.doc_risk_level as RiskLevel}
            reasons={assessment?.doc_risk_reasons}
            label="DOC Risk"
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2. COMPANY OVERVIEW SECTION
// ============================================

interface CompanyOverviewProps {
  company: Company;
  assessment: TPAssessment | null;
}

function CompanyOverview({ company, assessment }: CompanyOverviewProps) {
  return (
    <Section title="Company Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoRow label="Principal Activity" value={company.principal_activity || 'Not extracted'} />
          <InfoRow label="Industry Sector" value={company.industry_sector} />
          <InfoRow label="Registered Address" value={company.registered_address} />
          <InfoRow label="Incorporation Date" value={formatDate(company.incorporation_date)} />
        </div>
        <div className="space-y-4">
          <InfoRow
            label="Ultimate Parent"
            value={
              company.ultimate_parent_name
                ? `${company.ultimate_parent_name} ${company.ultimate_parent_country ? `(${getCountryFlag(company.ultimate_parent_country)} ${company.ultimate_parent_country})` : ''}`
                : null
            }
          />
          <InfoRow label="Auditor" value={company.auditor} />
          <InfoRow label="Management Company" value={company.management_company} />
          <InfoRow label="Employees" value={company.number_of_employees?.toString()} />
        </div>
      </div>
      {assessment?.ai_summary && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">AI Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{assessment.ai_summary}</p>
        </div>
      )}
    </Section>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-slate-500 uppercase">{label}</span>
      <p className="text-sm text-slate-900 mt-0.5">{value || '-'}</p>
    </div>
  );
}

// ============================================
// 3. FINANCIAL POSITION SECTION
// ============================================

interface FinancialPositionProps {
  financialData: FinancialData | null;
}

function FinancialPosition({ financialData }: FinancialPositionProps) {
  if (!financialData) {
    return (
      <Section title="Financial Position">
        <p className="text-sm text-slate-500">No financial data available</p>
      </Section>
    );
  }

  const deRatio = financialData.debt_to_equity_ratio;
  const isThinCap = deRatio !== null && deRatio > 4;

  return (
    <Section title="Financial Position">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Assets" value={formatCurrency(financialData.total_assets)} prefix="EUR" />
        <MetricCard label="Total Equity" value={formatCurrency(financialData.total_equity)} prefix="EUR" />
        <MetricCard label="Total Debt" value={formatCurrency(financialData.total_debt)} prefix="EUR" />
        <MetricCard
          label="D/E Ratio"
          value={deRatio?.toFixed(1) || '-'}
          suffix="x"
          highlight={isThinCap}
        />
      </div>

      {/* Balance Sheet Extract */}
      <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">Balance Sheet Extract</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Assets</h4>
          <div className="space-y-1">
            <FinancialLine label="Financial Fixed Assets" value={financialData.financial_fixed_assets} />
            <FinancialLine label="IC Loans Receivable" value={financialData.ic_loans_receivable} highlight />
            <FinancialLine label="IC Trade Receivables" value={financialData.ic_receivables_trade} highlight />
            <FinancialLine label="Cash & Equivalents" value={financialData.cash_and_equivalents} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Liabilities & Equity</h4>
          <div className="space-y-1">
            <FinancialLine label="Share Capital" value={financialData.share_capital} />
            <FinancialLine label="Retained Earnings" value={financialData.retained_earnings} />
            <FinancialLine label="IC Loans Payable" value={financialData.ic_loans_payable} highlight />
            <FinancialLine label="IC Trade Payables" value={financialData.ic_payables_trade} highlight />
          </div>
        </div>
      </div>
    </Section>
  );
}

function MetricCard({
  label,
  value,
  prefix,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('p-4 rounded-lg border', highlight ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
      <span className="text-[10px] uppercase text-slate-500">{label}</span>
      <div className="flex items-baseline gap-1 mt-1">
        {prefix && <span className="text-xs text-slate-400">{prefix}</span>}
        <span className={cn('text-xl font-bold tabular-nums', highlight ? 'text-red-600' : 'text-slate-900')}>
          {value}
        </span>
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

function FinancialLine({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
      <span className={cn('text-sm', highlight ? 'text-blue-600 font-medium' : 'text-slate-600')}>{label}</span>
      <span className={cn('text-sm tabular-nums', highlight ? 'text-blue-600 font-medium' : 'text-slate-900')}>
        EUR {formatCurrency(value)}
      </span>
    </div>
  );
}

// ============================================
// 4. INTEREST RATE ANALYSIS SECTION
// ============================================

interface InterestRateAnalysisProps {
  financialData: FinancialData | null;
}

function InterestRateAnalysis({ financialData }: InterestRateAnalysisProps) {
  if (!financialData) return null;

  const hasLoans = financialData.ic_loans_receivable || financialData.ic_loans_payable;
  if (!hasLoans) return null;

  const isZeroSpread = financialData.is_zero_spread;
  const isLowSpread = financialData.is_low_spread;
  const spreadBps = financialData.spread_bps;

  return (
    <Section title="Interest Rate Analysis">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Lending */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-xs font-medium text-slate-500 uppercase mb-4">Lending (Loans Receivable)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Principal</span>
              <span className="text-sm font-medium tabular-nums">EUR {formatCurrency(financialData.ic_loans_receivable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Interest Income (IC)</span>
              <span className="text-sm font-medium tabular-nums">EUR {formatCurrency(financialData.interest_income_ic)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-sm text-slate-600">Effective Rate</span>
              <span className="text-sm font-semibold">{formatPercentage(financialData.average_lending_rate)}</span>
            </div>
          </div>
        </div>

        {/* Borrowing */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-xs font-medium text-slate-500 uppercase mb-4">Borrowing (Loans Payable)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Principal</span>
              <span className="text-sm font-medium tabular-nums">EUR {formatCurrency(financialData.ic_loans_payable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Interest Expense (IC)</span>
              <span className="text-sm font-medium tabular-nums">EUR {formatCurrency(financialData.interest_expense_ic)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-sm text-slate-600">Effective Rate</span>
              <span className="text-sm font-semibold">{formatPercentage(financialData.average_borrowing_rate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spread Analysis */}
      <div
        className={cn(
          'p-4 rounded-lg border-2',
          isZeroSpread ? 'bg-red-50 border-red-300' : isLowSpread ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'
        )}
      >
        <h3 className="text-xs font-medium text-slate-700 uppercase mb-4">Spread Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-xs text-slate-500">Company Spread</span>
            <p className={cn('text-2xl font-bold', isZeroSpread ? 'text-red-600' : isLowSpread ? 'text-amber-600' : 'text-green-600')}>
              {spreadBps !== null ? `${spreadBps} bps` : '-'}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Market Benchmark</span>
            <p className="text-2xl font-bold text-slate-700">25-75 bps</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Assessment</span>
            <div className="flex items-center gap-2 mt-1">
              <TrafficLight level={isZeroSpread ? 'RED' : isLowSpread ? 'AMBER' : 'GREEN'} size="lg" />
              <span className={cn('text-sm font-semibold', isZeroSpread ? 'text-red-600' : isLowSpread ? 'text-amber-600' : 'text-green-600')}>
                {isZeroSpread ? 'ZERO SPREAD - CRITICAL' : isLowSpread ? 'LOW SPREAD' : 'ADEQUATE'}
              </span>
            </div>
          </div>
        </div>
        {financialData.spread_vs_benchmark && (
          <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-200">{financialData.spread_vs_benchmark}</p>
        )}
      </div>
    </Section>
  );
}

// ============================================
// 5. OTHER IC TRANSACTIONS SECTION
// ============================================

// IC Transaction built from financial_data for display
interface DisplayICTransaction {
  id: string;
  type: string;
  direction: string;
  counterparty: string;
  amount: number;
  status: 'verified' | 'unverified' | 'tp_opportunity' | 'unknown';
  source: string;
  hasWarning?: boolean;
  hasTPFlag?: boolean;
}

interface ICTransactionsSectionProps {
  financialData: FinancialData | null;
  warnings?: ExtractionValidationWarning[];
  tpFlags?: ExtractionTPFlag[];
}

// Helper to get status badge styling
function getStatusBadge(status: string, hasWarning?: boolean, hasTPFlag?: boolean) {
  if (hasTPFlag) {
    return {
      color: 'text-red-600 bg-red-50 border-red-200',
      label: 'TP Flag'
    };
  }

  if (hasWarning || status === 'unverified') {
    return {
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      label: 'Unverified'
    };
  }

  if (status === 'verified') {
    return {
      color: 'text-green-600 bg-green-50 border-green-200',
      label: 'Verified'
    };
  }

  return {
    color: 'text-slate-500 bg-slate-50 border-slate-200',
    label: 'Unknown'
  };
}

// Build IC transactions from financial_data
function buildICTransactions(
  financialData: FinancialData | null,
  warnings: ExtractionValidationWarning[] = [],
  tpFlags: ExtractionTPFlag[] = []
): DisplayICTransaction[] {
  if (!financialData) return [];

  const transactions: DisplayICTransaction[] = [];

  // Helper to check for warnings on a field
  const hasWarningForField = (fieldName: string) =>
    warnings.some(w => w.field.toLowerCase().includes(fieldName.toLowerCase()));

  // Helper to check for TP flags on a transaction type
  const hasTPFlagForType = (typeName: string) =>
    tpFlags.some(f =>
      f.type.toLowerCase().includes(typeName.toLowerCase()) ||
      f.reference?.toLowerCase().includes(typeName.toLowerCase())
    );

  // 1. IC Loans Receivable (Loans Provided to affiliates)
  if (financialData.ic_loans_receivable && financialData.ic_loans_receivable !== 0) {
    const hasWarning = hasWarningForField('ic_loans_receivable') || hasWarningForField('loan');
    const hasTPFlag = hasTPFlagForType('loan') || hasTPFlagForType('financing');
    transactions.push({
      id: 'ic_loans_receivable',
      type: 'IC Loan Provided',
      direction: 'Financing (Outbound)',
      counterparty: 'Affiliated undertakings',
      amount: financialData.ic_loans_receivable,
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'Balance Sheet - Financial Fixed Assets',
      hasWarning,
      hasTPFlag
    });
  }

  // 2. IC Loans Payable (Loans Received from affiliates)
  if (financialData.ic_loans_payable && financialData.ic_loans_payable !== 0) {
    const hasWarning = hasWarningForField('ic_loans_payable') || hasWarningForField('loan');
    const hasTPFlag = hasTPFlagForType('loan') || hasTPFlagForType('financing');
    transactions.push({
      id: 'ic_loans_payable',
      type: 'IC Loan Received',
      direction: 'Financing (Inbound)',
      counterparty: 'Affiliated undertakings',
      amount: financialData.ic_loans_payable,
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'Balance Sheet - Liabilities',
      hasWarning,
      hasTPFlag
    });
  }

  // 3. IC Trade Receivables
  if (financialData.ic_receivables_trade && financialData.ic_receivables_trade !== 0) {
    const hasWarning = hasWarningForField('ic_receivables_trade') || hasWarningForField('trade');
    const hasTPFlag = hasTPFlagForType('trade');
    transactions.push({
      id: 'ic_receivables_trade',
      type: 'IC Trade Receivables',
      direction: 'Trading (Outbound)',
      counterparty: 'Affiliated undertakings',
      amount: financialData.ic_receivables_trade,
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'Balance Sheet - Current Assets',
      hasWarning,
      hasTPFlag
    });
  }

  // 4. IC Interest Income
  if (financialData.interest_income_ic && financialData.interest_income_ic !== 0) {
    const hasWarning = hasWarningForField('interest_income') || hasWarningForField('item10') || hasWarningForField('item11');
    const hasTPFlag = hasTPFlagForType('interest') || hasTPFlagForType('rate');
    transactions.push({
      id: 'interest_income_ic',
      type: 'IC Interest Income',
      direction: 'Financing (Inbound)',
      counterparty: 'Affiliated undertakings',
      amount: financialData.interest_income_ic,
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'P&L - Financial Income (Items 10a/11a)',
      hasWarning,
      hasTPFlag
    });
  }

  // 5. IC Interest Expense
  if (financialData.interest_expense_ic && financialData.interest_expense_ic !== 0) {
    const hasWarning = hasWarningForField('interest_expense') || hasWarningForField('item14');
    const hasTPFlag = hasTPFlagForType('interest') || hasTPFlagForType('rate');
    transactions.push({
      id: 'interest_expense_ic',
      type: 'IC Interest Expense',
      direction: 'Financing (Outbound)',
      counterparty: 'Affiliated undertakings',
      amount: Math.abs(financialData.interest_expense_ic),
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'P&L - Financial Charges (Item 14a)',
      hasWarning,
      hasTPFlag
    });
  }

  // 6. Dividend Income
  if (financialData.dividend_income && financialData.dividend_income !== 0) {
    const hasWarning = hasWarningForField('dividend');
    const hasTPFlag = hasTPFlagForType('dividend');
    transactions.push({
      id: 'dividend_income',
      type: 'Dividend Income',
      direction: 'Investment (Inbound)',
      counterparty: 'Affiliated undertakings',
      amount: financialData.dividend_income,
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'P&L - Financial Income',
      hasWarning,
      hasTPFlag
    });
  }

  // 7. Other Operating Income (Item 4) - often includes IC services
  if (financialData.other_operating_income && financialData.other_operating_income !== 0) {
    const hasWarning = hasWarningForField('other_operating_income') || hasWarningForField('item4');
    const hasTPFlag = hasTPFlagForType('operating') || hasTPFlagForType('service');
    transactions.push({
      id: 'other_operating_income',
      type: 'Other Operating Income (Item 4)',
      direction: 'Services (Inbound)',
      counterparty: 'May include affiliates',
      amount: financialData.other_operating_income,
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'unknown',
      source: 'P&L - Item 4',
      hasWarning,
      hasTPFlag
    });
  }

  // 8. Management Fees
  if (financialData.management_fees && financialData.management_fees !== 0) {
    const hasWarning = hasWarningForField('management_fee');
    const hasTPFlag = hasTPFlagForType('management') || hasTPFlagForType('fee');
    transactions.push({
      id: 'management_fees',
      type: 'Management Fees',
      direction: 'Services',
      counterparty: 'Affiliated undertakings',
      amount: Math.abs(financialData.management_fees),
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'P&L - Operating Expenses',
      hasWarning,
      hasTPFlag
    });
  }

  // 9. Service Fees IC
  if (financialData.service_fees_ic && financialData.service_fees_ic !== 0) {
    const hasWarning = hasWarningForField('service_fee');
    const hasTPFlag = hasTPFlagForType('service') || hasTPFlagForType('fee');
    transactions.push({
      id: 'service_fees_ic',
      type: 'IC Service Fees',
      direction: 'Services',
      counterparty: 'Affiliated undertakings',
      amount: Math.abs(financialData.service_fees_ic),
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'P&L - Operating Expenses',
      hasWarning,
      hasTPFlag
    });
  }

  // 10. Royalty Expense
  if (financialData.royalty_expense && financialData.royalty_expense !== 0) {
    const hasWarning = hasWarningForField('royalty');
    const hasTPFlag = hasTPFlagForType('royalty') || hasTPFlagForType('ip');
    transactions.push({
      id: 'royalty_expense',
      type: 'Royalty Expense',
      direction: 'IP (Outbound)',
      counterparty: 'Affiliated undertakings',
      amount: Math.abs(financialData.royalty_expense),
      status: hasTPFlag ? 'tp_opportunity' : hasWarning ? 'unverified' : 'verified',
      source: 'P&L - Operating Expenses',
      hasWarning,
      hasTPFlag
    });
  }

  return transactions;
}

function ICTransactionsSection({ financialData, warnings = [], tpFlags = [] }: ICTransactionsSectionProps) {
  const transactions = buildICTransactions(financialData, warnings, tpFlags);

  if (transactions.length === 0) {
    return (
      <Section title="Other IC Transactions" defaultOpen={false}>
        <p className="text-sm text-slate-500">No IC transactions extracted</p>
      </Section>
    );
  }

  return (
    <Section title="Other IC Transactions">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Direction</th>
              <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Counterparty</th>
              <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="text-center py-2 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Source</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const badge = getStatusBadge(tx.status, tx.hasWarning, tx.hasTPFlag);
              return (
                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 text-slate-900">{tx.type}</td>
                  <td className="py-3 text-slate-600">{tx.direction}</td>
                  <td className="py-3 text-slate-600">{tx.counterparty}</td>
                  <td className="py-3 text-right tabular-nums text-slate-900">EUR {formatCurrency(tx.amount)}</td>
                  <td className="py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', badge.color)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-slate-500 max-w-[150px] truncate" title={tx.source}>
                    {tx.source}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ============================================
// 7. RISK ASSESSMENT SECTION
// ============================================

interface RiskAssessmentProps {
  assessment: TPAssessment | null;
  financialData: FinancialData | null;
}

function RiskAssessment({ assessment, financialData }: RiskAssessmentProps) {
  type RiskItem = { risk: string; level: RiskLevel; detail: string };
  const riskItems: RiskItem[] = [];

  if (financialData?.is_zero_spread) {
    riskItems.push({ risk: 'Zero Spread', level: 'RED', detail: 'Lending and borrowing at identical rates - no margin retained' });
  } else if (financialData?.is_low_spread) {
    riskItems.push({ risk: 'Low Spread', level: 'AMBER', detail: `Spread of ${financialData.spread_bps} bps below market benchmark of 25-75 bps` });
  }

  if (financialData?.debt_to_equity_ratio && financialData.debt_to_equity_ratio > 4) {
    riskItems.push({ risk: 'Thin Capitalisation', level: 'RED', detail: `D/E ratio of ${financialData.debt_to_equity_ratio.toFixed(1)}x exceeds 4:1 threshold` });
  }

  if (assessment?.doc_risk_level === 'RED') {
    riskItems.push({ risk: 'TP Documentation', level: 'RED', detail: 'IC transactions exceed threshold with no TP policy mentioned' });
  }

  assessment?.ic_risk_reasons?.forEach((reason) => {
    if (!riskItems.some((item) => item.detail.includes(reason.substring(0, 20)))) {
      riskItems.push({ risk: 'IC Risk', level: (assessment.ic_risk_level as RiskLevel) || 'AMBER', detail: reason });
    }
  });

  return (
    <Section title="Risk Assessment">
      {riskItems.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <TrafficLight level="GREEN" size="lg" />
          <span className="text-sm text-green-700 font-medium">No significant risk indicators identified</span>
        </div>
      ) : (
        <div className="space-y-3">
          {riskItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border',
                item.level === 'RED' ? 'bg-red-50 border-red-200' : item.level === 'AMBER' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
              )}
            >
              <TrafficLight level={item.level} size="md" />
              <div>
                <span className="text-sm font-semibold text-slate-900">{item.risk}</span>
                <p className="text-sm text-slate-600 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ============================================
// 8. RECOMMENDED APPROACH SECTION
// ============================================

interface RecommendedApproachProps {
  assessment: TPAssessment | null;
}

function RecommendedApproach({ assessment }: RecommendedApproachProps) {
  const [copied, setCopied] = useState(false);

  if (!assessment) return null;

  const hasContent = assessment.recommended_services?.length || assessment.outreach_angle || assessment.engagement_estimate_low;
  if (!hasContent) return null;

  const handleCopy = () => {
    if (assessment.outreach_angle) {
      navigator.clipboard.writeText(assessment.outreach_angle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Section title="Recommended Approach">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessment.recommended_services && assessment.recommended_services.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">Recommended Services</h3>
            <ul className="space-y-2">
              {assessment.recommended_services.map((service, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(assessment.engagement_estimate_low || assessment.engagement_estimate_high) && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">Engagement Estimate</h3>
            <p className="text-2xl font-bold text-slate-900">
              EUR {formatCurrency(assessment.engagement_estimate_low)}
              {assessment.engagement_estimate_high && <span> - {formatCurrency(assessment.engagement_estimate_high)}</span>}
            </p>
          </div>
        )}
      </div>

      {assessment.outreach_angle && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-slate-500 uppercase">Outreach Angle</h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleCopy}>
              {copied ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
            </Button>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{assessment.outreach_angle}</p>
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================
// 9. AUDIT TRAIL SECTION
// ============================================

interface AuditTrailSectionProps {
  auditTrail: AuditTrail[];
  companyId: string;
  onAddNote: (note: string) => Promise<void>;
}

function AuditTrailSection({ auditTrail, onAddNote }: AuditTrailSectionProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitNote = async () => {
    if (!noteText.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote(noteText);
      setNoteText('');
      setShowNoteInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section title="Activity Log">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">{auditTrail.length} entries</span>
        <Button variant="outline" size="sm" className="h-8" onClick={() => setShowNoteInput(!showNoteInput)}>
          <Plus className="h-4 w-4 mr-1" /> Add Note
        </Button>
      </div>

      {showNoteInput && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <Textarea placeholder="Enter your note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="mb-3 min-h-[80px]" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowNoteInput(false); setNoteText(''); }}>Cancel</Button>
            <Button size="sm" onClick={handleSubmitNote} disabled={!noteText.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {auditTrail.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet</p>
        ) : (
          auditTrail.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-400 w-36 flex-shrink-0 tabular-nums">{formatDateTime(entry.performed_at)}</span>
              <div className="flex-1">
                <span className="text-sm text-slate-700">{getActionLabel(entry.action_type)}</span>
                {entry.notes && <p className="text-sm text-slate-500 mt-0.5">&quot;{entry.notes}&quot;</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch company
      const { data: company, error: companyError } = await supabase.from('companies').select('*').eq('id', companyId).single();

      if (companyError || !company) {
        setError('Company not found');
        return;
      }

      // Fetch related data in parallel
      const [financialRes, assessmentRes, transactionsRes, auditRes, statusRes, filingRes] = await Promise.all([
        supabase.from('financial_data').select('*').eq('company_id', companyId).order('fiscal_year', { ascending: false }).limit(1).single(),
        supabase.from('tp_assessments').select('*').eq('company_id', companyId).order('assessment_date', { ascending: false }).limit(1).single(),
        supabase.from('ic_transactions').select('*').eq('company_id', companyId).order('fiscal_year', { ascending: false }),
        supabase.from('audit_trail').select('*').eq('company_id', companyId).order('performed_at', { ascending: false }).limit(50),
        supabase.from('opportunity_status').select('*').eq('company_id', companyId).single(),
        supabase.from('filings').select('*').eq('company_id', companyId).order('fiscal_year', { ascending: false }).limit(1).single(),
      ]);

      setData({
        company,
        financialData: financialRes.data,
        assessment: assessmentRes.data,
        transactions: transactionsRes.data || [],
        auditTrail: auditRes.data || [],
        opportunityStatus: statusRes.data,
        filing: filingRes.data,
      });

      // Log view in audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_trail').insert({ company_id: companyId, action_type: 'viewed', performed_by: user.id });
      }
    } catch {
      setError('Failed to load company data');
    } finally {
      setLoading(false);
    }
  }, [companyId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async (note: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from('audit_trail').insert({
      company_id: companyId,
      action_type: 'note_added',
      notes: note,
      performed_by: user.id,
    });

    if (!insertError) {
      const { data: newAudit } = await supabase.from('audit_trail').select('*').eq('company_id', companyId).order('performed_at', { ascending: false }).limit(50);
      if (newAudit) {
        setData((prev) => (prev ? { ...prev, auditTrail: newAudit } : prev));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading company data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Building2 className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-sm text-slate-500 mb-4">{error || 'Company not found'}</p>
        <Button variant="outline" onClick={() => router.push('/companies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
        </Button>
      </div>
    );
  }

  // Parse validation data from filing's enhanced_extraction
  const enhancedExtraction = data.filing?.enhanced_extraction as EnhancedExtraction | null;
  const validationWarnings = enhancedExtraction?.validation?.warnings || [];
  const tpFlags = enhancedExtraction?.validation?.flags || [];
  const extractionQuality = enhancedExtraction?.validation?.qualityMetrics;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/companies" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Companies
        </Link>
      </div>

      {/* 1. Header with Traffic Lights */}
      <CompanyHeader company={data.company} assessment={data.assessment} financialData={data.financialData} />

      {/* Extraction Quality Badge */}
      {extractionQuality && (
        <ExtractionQualityBadge quality={extractionQuality} className="mb-6" />
      )}

      {/* TP Opportunities Section - High Priority */}
      {tpFlags.length > 0 && (
        <TPOpportunities flags={tpFlags} />
      )}

      {/* Validation Warnings Section */}
      {validationWarnings.length > 0 && (
        <ValidationWarnings warnings={validationWarnings} />
      )}

      {/* 2. Company Overview */}
      <CompanyOverview company={data.company} assessment={data.assessment} />

      {/* 3. Financial Position */}
      <FinancialPosition financialData={data.financialData} />

      {/* 4. Interest Rate Analysis */}
      <InterestRateAnalysis financialData={data.financialData} />

      {/* 5. Other IC Transactions */}
      <ICTransactionsSection
        financialData={data.financialData}
        warnings={validationWarnings}
        tpFlags={tpFlags}
      />

      {/* 7. Risk Assessment */}
      <RiskAssessment assessment={data.assessment} financialData={data.financialData} />

      {/* 8. Recommended Approach */}
      <RecommendedApproach assessment={data.assessment} />

      {/* 9. Audit Trail */}
      <AuditTrailSection auditTrail={data.auditTrail} companyId={companyId} onAddNote={handleAddNote} />
    </div>
  );
}
