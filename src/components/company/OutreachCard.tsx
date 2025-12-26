'use client';

import { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Company, TPAssessment, FinancialData } from '@/types/database';

interface OutreachCardProps {
  company: Company;
  assessment: TPAssessment | null;
  financialData: FinancialData | null;
  onGenerateEmail: () => void;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${'\u20AC'}${(absValue / 1000000).toFixed(0)}M+`;
  } else if (absValue >= 1000) {
    return `${'\u20AC'}${(absValue / 1000).toFixed(0)}K`;
  }
  return `${'\u20AC'}${value.toFixed(0)}`;
}

function generateOutreachAngle(
  company: Company,
  assessment: TPAssessment | null,
  financialData: FinancialData | null
): string {
  const icVolume = assessment?.estimated_ic_volume || financialData?.ic_loans_receivable || 0;
  const hasZeroSpread = assessment?.has_rate_anomalies;

  const parts: string[] = [];

  if (hasZeroSpread) {
    parts.push(
      'Your financing structure shows identical borrowing and lending rates, which may not reflect arm\'s length pricing per the Luxembourg TP Circular.'
    );
  } else if (icVolume > 10000000) {
    parts.push(
      'Your intercompany financing arrangements appear to involve significant volumes that may warrant a benchmarking review.'
    );
  }

  if (icVolume > 1000000) {
    parts.push(
      `Given your IC volume of ${formatCurrency(icVolume)}, documentation is required under Art. 56bis.`
    );
  }

  if (assessment?.has_thin_cap_indicators || (financialData?.debt_to_equity_ratio && financialData.debt_to_equity_ratio > 4)) {
    parts.push(
      'Additionally, your debt-to-equity structure may benefit from a thin capitalisation review.'
    );
  }

  parts.push('We can help ensure compliance and optimise your structure.');

  return parts.join(' ');
}

export function OutreachCard({
  company,
  assessment,
  financialData,
  onGenerateEmail,
}: OutreachCardProps) {
  const [copied, setCopied] = useState(false);

  const outreachAngle = generateOutreachAngle(company, assessment, financialData);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outreachAngle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Outreach Angle
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Outreach Text */}
          <div className="bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a853]/5 rounded-lg p-5 border border-[#1e3a5f]/10">
            <p className="text-gray-700 leading-relaxed italic">
              &ldquo;{outreachAngle}&rdquo;
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2 border-gray-200 hover:border-[#1e3a5f]/30"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>

            <Button
              onClick={onGenerateEmail}
              className="gap-2 bg-[#1e3a5f] hover:bg-[#2a4a7f]"
            >
              <Mail className="h-4 w-4" />
              Generate Email Draft
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
