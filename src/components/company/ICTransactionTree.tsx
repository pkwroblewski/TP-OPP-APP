'use client';

import { Wallet, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ICTransaction, FinancialData } from '@/types/database';

interface ICTransactionTreeProps {
  transactions: ICTransaction[];
  financialData: FinancialData | null;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${value < 0 ? '-' : ''}€${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `${value < 0 ? '-' : ''}€${(absValue / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(2)}%`;
}

interface ICCategory {
  name: string;
  total: number;
  items: Array<{
    label: string;
    amount: number | null;
    subItems?: Array<{ label: string; value: string }>;
    highlight?: boolean;
  }>;
  netSpreadBps?: number | null;
}

export function ICTransactionTree({ transactions, financialData }: ICTransactionTreeProps) {
  // Calculate totals from financial data and transactions
  const loansReceivable = financialData?.ic_loans_receivable || 0;
  const loansPayable = financialData?.ic_loans_payable || 0;
  const interestIncomeIC = financialData?.interest_income_ic || 0;
  const interestExpenseIC = financialData?.interest_expense_ic || 0;
  const managementFees = financialData?.management_fees || 0;
  const serviceFees = financialData?.service_fees_ic || 0;
  const royaltyExpense = financialData?.royalty_expense || 0;

  // Calculate implied rates
  const impliedLendingRate = loansReceivable > 0 ? interestIncomeIC / loansReceivable : 0;
  const impliedBorrowingRate = loansPayable > 0 ? interestExpenseIC / loansPayable : 0;

  // Calculate spread in basis points
  const spreadBps = Math.round((impliedLendingRate - impliedBorrowingRate) * 10000);

  // Calculate totals by category
  const financingTotal = loansReceivable + loansPayable;
  const servicesTotal = Math.abs(managementFees) + Math.abs(serviceFees);

  // Find guarantee transactions
  const guarantees = transactions.filter((t) => t.transaction_type === 'guarantee');
  const guaranteeTotal = guarantees.reduce((sum, t) => sum + (t.principal_amount || 0), 0);

  const totalICVolume = loansReceivable + Math.abs(managementFees) + Math.abs(serviceFees);

  // Build category structure
  const categories: ICCategory[] = [
    {
      name: 'FINANCING',
      total: financingTotal,
      netSpreadBps: spreadBps,
      items: [
        {
          label: 'IC Loans Receivable',
          amount: loansReceivable,
          highlight: true,
          subItems: [
            { label: 'Interest Income', value: formatCurrency(interestIncomeIC) },
            { label: 'Implied Rate', value: formatPercentage(impliedLendingRate) },
          ],
        },
        {
          label: 'IC Loans Payable',
          amount: loansPayable,
          highlight: true,
          subItems: [
            { label: 'Interest Expense', value: formatCurrency(interestExpenseIC) },
            { label: 'Implied Rate', value: formatPercentage(impliedBorrowingRate) },
          ],
        },
      ],
    },
    {
      name: 'SERVICES',
      total: servicesTotal,
      items: [
        {
          label: 'Management Fees Paid',
          amount: managementFees,
        },
        {
          label: 'Service Charges Received',
          amount: serviceFees,
        },
      ],
    },
  ];

  // Add OTHER category if there are guarantees or royalties
  if (guaranteeTotal > 0 || royaltyExpense > 0) {
    categories.push({
      name: 'OTHER',
      total: guaranteeTotal + Math.abs(royaltyExpense),
      items: [
        ...(guaranteeTotal > 0
          ? [
              {
                label: 'Guarantees Given *',
                amount: guaranteeTotal,
              },
            ]
          : []),
        ...(royaltyExpense !== 0
          ? [
              {
                label: 'Royalties',
                amount: royaltyExpense,
              },
            ]
          : []),
      ],
    });
  }

  const getSpreadColor = (bps: number | null | undefined) => {
    if (bps === null || bps === undefined) return 'text-gray-500';
    if (bps === 0) return 'text-red-600';
    if (bps < 25) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getSpreadBadge = (bps: number | null | undefined) => {
    if (bps === null || bps === undefined) return null;
    if (bps === 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <AlertCircle className="h-3 w-3" />
          0 bps
        </Badge>
      );
    }
    if (bps < 25) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          {bps} bps
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        {bps} bps
      </Badge>
    );
  };

  if (!financialData && transactions.length === 0) {
    return (
      <Card className="bg-white shadow-tp border-0 rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Intercompany Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No intercompany transactions detected.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Intercompany Transactions
          </CardTitle>
          <Badge variant="outline" className="bg-[#1e3a5f]/5 text-[#1e3a5f] border-[#1e3a5f]/20 font-semibold">
            Total: {formatCurrency(totalICVolume)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6 font-mono text-sm">
          {categories.map((category, catIndex) => (
            <div key={catIndex} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="font-bold text-gray-900">{category.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#1e3a5f]">
                    {formatCurrency(category.total)}
                  </span>
                </div>
              </div>

              {/* Category Items */}
              <div className="pl-4 space-y-1">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {/* Main Item */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">├──</span>
                      <span className={cn(
                        item.highlight ? 'text-[#1e3a5f] font-medium' : 'text-gray-700'
                      )}>
                        {item.label}
                      </span>
                      <span className="flex-1 border-b border-dotted border-gray-300 mx-2" />
                      <span className={cn(
                        'font-medium',
                        item.highlight ? 'text-[#1e3a5f]' : 'text-gray-900'
                      )}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    {/* Sub Items */}
                    {item.subItems && (
                      <div className="pl-8 space-y-0.5">
                        {item.subItems.map((subItem, subIndex) => (
                          <div key={subIndex} className="flex items-center gap-2 text-gray-500">
                            <span className="text-gray-300">│</span>
                            <ChevronRight className="h-3 w-3 text-gray-300" />
                            <span>{subItem.label}</span>
                            <span className="flex-1 border-b border-dotted border-gray-200 mx-2" />
                            <span className="text-gray-600">{subItem.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Net Spread for Financing */}
                {category.netSpreadBps !== undefined && (
                  <div className="flex items-center gap-2 pt-2 mt-2 border-t border-dashed border-gray-200">
                    <span className="text-gray-400">└──</span>
                    <span className="font-semibold text-gray-700">NET SPREAD</span>
                    <span className="flex-1" />
                    <span className={cn('font-bold', getSpreadColor(category.netSpreadBps))}>
                      {getSpreadBadge(category.netSpreadBps)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Off-balance sheet note */}
          {guaranteeTotal > 0 && (
            <p className="text-xs text-gray-500 italic pt-2 border-t border-gray-100">
              * Off-balance sheet items
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
