'use client';

import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FinancialData } from '@/types/database';

interface FinancialSummaryProps {
  financialData: FinancialData | null;
}

function formatCurrency(value: number | null, showSign = false): string {
  if (value === null || value === undefined) return '-';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  if (showSign && value < 0) {
    return `(${formatted})`;
  }
  return formatted;
}

function formatRatio(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}x`;
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(0)}%`;
}

interface LineItemProps {
  label: string;
  value: number | null;
  isNegative?: boolean;
  isHighlight?: boolean;
  isSubtotal?: boolean;
  indent?: number;
}

function LineItem({ label, value, isNegative, isHighlight, isSubtotal, indent = 0 }: LineItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-1.5',
        isSubtotal && 'border-t border-gray-200 pt-2 mt-1',
        isHighlight && 'bg-[#1e3a5f]/5 -mx-2 px-2 rounded'
      )}
      style={{ paddingLeft: `${indent * 16}px` }}
    >
      <span className={cn(
        'text-sm',
        isHighlight ? 'text-[#1e3a5f] font-medium' : 'text-gray-700',
        isSubtotal && 'font-semibold'
      )}>
        {isHighlight && <span className="text-[#d4a853] mr-1">▶</span>}
        {label}
      </span>
      <span className={cn(
        'text-sm font-medium tabular-nums',
        isHighlight ? 'text-[#1e3a5f]' : 'text-gray-900',
        isSubtotal && 'font-semibold'
      )}>
        {formatCurrency(value, isNegative)}
      </span>
    </div>
  );
}

export function FinancialSummary({ financialData }: FinancialSummaryProps) {
  if (!financialData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Balance Sheet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No financial data available.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Profit & Loss
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No financial data available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate derived values
  const totalICDebt = (financialData.ic_loans_payable || 0);
  const totalDebt = financialData.total_debt || 0;
  const icDebtPercentage = totalDebt > 0 ? totalICDebt / totalDebt : 0;
  const netICPosition = (financialData.ic_loans_receivable || 0) - (financialData.ic_loans_payable || 0);
  const deRatio = financialData.debt_to_equity_ratio;
  const isDERatioHigh = deRatio !== null && deRatio > 4;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Sheet */}
        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <Badge variant="outline" className="text-gray-500">
                31 Dec {financialData.fiscal_year}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Assets Section */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Assets
                </h4>
                <div className="space-y-0.5">
                  <LineItem label="Total Assets" value={financialData.total_assets} isSubtotal />
                  <LineItem label="Financial Fixed Assets" value={financialData.financial_fixed_assets} indent={1} />
                  <LineItem
                    label="IC Loans Receivable"
                    value={financialData.ic_loans_receivable}
                    isHighlight
                    indent={1}
                  />
                  <LineItem label="Cash & Equivalents" value={financialData.cash_and_equivalents} indent={1} />
                </div>
              </div>

              {/* Equity & Liabilities Section */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Equity & Liabilities
                </h4>
                <div className="space-y-0.5">
                  <LineItem label="Total Equity" value={financialData.total_equity} isSubtotal />
                  <LineItem
                    label="IC Loans Payable"
                    value={financialData.ic_loans_payable}
                    isHighlight
                    indent={1}
                  />
                  <LineItem label="Third Party Debt" value={financialData.third_party_debt} indent={1} />
                  <LineItem label="Trade Payables" value={financialData.ic_payables_trade} indent={1} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit & Loss */}
        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Profit & Loss
              </CardTitle>
              <Badge variant="outline" className="text-gray-500">
                FY {financialData.fiscal_year}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-0.5">
              <LineItem label="Revenue / Turnover" value={financialData.turnover} />
              <LineItem label="Other Operating Income" value={financialData.other_operating_income} />
              <LineItem label="Operating Result" value={financialData.operating_result} isSubtotal />
              <LineItem
                label="Interest Income (IC)"
                value={financialData.interest_income_ic}
                isHighlight
                indent={1}
              />
              <LineItem
                label="Interest Expense (IC)"
                value={financialData.interest_expense_ic}
                isNegative
                isHighlight
                indent={1}
              />
              <LineItem label="Net Financial Income" value={financialData.financial_result} />
              <LineItem label="Tax Expense" value={financialData.tax_expense} isNegative />
              <LineItem label="Net Profit" value={financialData.net_profit} isSubtotal />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={cn(
          'bg-white shadow-tp border-0 rounded-xl',
          isDERatioHigh && 'ring-2 ring-amber-300'
        )}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">D/E Ratio</p>
                <p className={cn(
                  'text-2xl font-bold',
                  isDERatioHigh ? 'text-amber-600' : 'text-[#1e3a5f]'
                )}>
                  {formatRatio(deRatio)}
                </p>
              </div>
              {isDERatioHigh && (
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              )}
            </div>
            {isDERatioHigh && (
              <p className="text-xs text-amber-600 mt-2">
                Above 4:1 threshold
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardContent className="p-5">
            <div>
              <p className="text-sm text-gray-500">IC as % of Debt</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">
                {formatPercentage(icDebtPercentage)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardContent className="p-5">
            <div>
              <p className="text-sm text-gray-500">Net IC Position</p>
              <p className={cn(
                'text-2xl font-bold',
                netICPosition >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {formatCurrency(netICPosition)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
