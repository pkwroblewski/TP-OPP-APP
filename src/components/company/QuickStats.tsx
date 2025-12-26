'use client';

import { Wallet, TrendingUp, Gauge, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TPAssessment, FinancialData } from '@/types/database';

interface QuickStatsProps {
  assessment: TPAssessment | null;
  financialData: FinancialData | null;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${'\u20AC'}${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `${'\u20AC'}${(absValue / 1000).toFixed(0)}K`;
  }
  return `${'\u20AC'}${value.toFixed(0)}`;
}

export function QuickStats({ assessment, financialData }: QuickStatsProps) {
  const icVolume = assessment?.estimated_ic_volume || (
    (financialData?.ic_loans_receivable || 0) +
    Math.abs(financialData?.management_fees || 0) +
    Math.abs(financialData?.service_fees_ic || 0)
  );

  const deRatio = financialData?.debt_to_equity_ratio;
  const deRatioStr = deRatio !== null && deRatio !== undefined ? `${deRatio.toFixed(1)}:1` : '-';

  // Calculate spread in bps
  const loansReceivable = financialData?.ic_loans_receivable || 0;
  const loansPayable = financialData?.ic_loans_payable || 0;
  const interestIncomeIC = financialData?.interest_income_ic || 0;
  const interestExpenseIC = financialData?.interest_expense_ic || 0;

  const impliedLendingRate = loansReceivable > 0 ? interestIncomeIC / loansReceivable : 0;
  const impliedBorrowingRate = loansPayable > 0 ? interestExpenseIC / loansPayable : 0;
  const spreadBps = Math.round((impliedLendingRate - impliedBorrowingRate) * 10000);

  // Count flags from assessment
  const flags = [
    assessment?.has_rate_anomalies,
    assessment?.has_thin_cap_indicators,
    assessment?.has_cross_border_ic,
    assessment?.has_ic_financing && assessment.financing_risk_score && assessment.financing_risk_score > 70,
    assessment?.documentation_risk_score && assessment.documentation_risk_score > 70,
  ].filter(Boolean).length;

  const stats = [
    {
      label: 'Total IC Volume',
      value: formatCurrency(icVolume),
      icon: Wallet,
      color: 'text-[#1e3a5f]',
      bgColor: 'bg-[#1e3a5f]/10',
    },
    {
      label: 'D/E Ratio',
      value: deRatioStr,
      icon: TrendingUp,
      color: deRatio && deRatio > 4 ? 'text-amber-600' : 'text-[#1e3a5f]',
      bgColor: deRatio && deRatio > 4 ? 'bg-amber-100' : 'bg-[#1e3a5f]/10',
      warning: deRatio && deRatio > 4,
    },
    {
      label: 'Spread',
      value: `${spreadBps} bps`,
      icon: Gauge,
      color: spreadBps === 0 ? 'text-red-600' : spreadBps < 25 ? 'text-amber-600' : 'text-emerald-600',
      bgColor: spreadBps === 0 ? 'bg-red-100' : spreadBps < 25 ? 'bg-amber-100' : 'bg-emerald-100',
    },
    {
      label: 'Flags',
      value: flags.toString(),
      icon: AlertTriangle,
      color: flags > 2 ? 'text-red-600' : flags > 0 ? 'text-amber-600' : 'text-gray-600',
      bgColor: flags > 2 ? 'bg-red-100' : flags > 0 ? 'bg-amber-100' : 'bg-gray-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white shadow-tp border-0 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
