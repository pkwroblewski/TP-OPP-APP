'use client';

import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TPAssessment, FinancialData } from '@/types/database';

interface RiskAnalysisProps {
  assessment: TPAssessment | null;
  financialData: FinancialData | null;
}

interface RiskCategory {
  name: string;
  score: number;
  factors: string[];
}

function RiskProgressBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getColor())}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-900 w-16 text-right">
          {score}/100
        </span>
      </div>
    </div>
  );
}

export function RiskAnalysis({ assessment, financialData }: RiskAnalysisProps) {
  if (!assessment) {
    return (
      <Card className="bg-white shadow-tp border-0 rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Risk Scoring Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No risk assessment available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build risk categories with their scores and factors
  const deRatio = financialData?.debt_to_equity_ratio;
  const icVolume = assessment.estimated_ic_volume || 0;

  const riskCategories: RiskCategory[] = [
    {
      name: 'Financing Risk',
      score: assessment.financing_risk_score || 0,
      factors: [
        ...(assessment.has_rate_anomalies ? ['Zero or anomalous spread on IC financing'] : []),
        ...(icVolume > 10000000 ? [`High IC loan volumes (>${'\u20AC'}10M threshold)`] : []),
        ...(assessment.has_ic_financing ? ['Intercompany financing structure present'] : []),
      ],
    },
    {
      name: 'Documentation Risk',
      score: assessment.documentation_risk_score || 0,
      factors: [
        ...(icVolume > 1000000 ? [`IC volume exceeds ${'\u20AC'}1M (Art. 56bis threshold)`] : []),
        ...(assessment.likely_needs_local_file ? ['Local File documentation likely required'] : []),
        ...(assessment.likely_needs_master_file ? ['Master File documentation may be required'] : []),
      ],
    },
    {
      name: 'Services Risk',
      score: assessment.services_risk_score || 0,
      factors: [
        ...(assessment.has_ic_services ? ['Management/service fees present'] : []),
        ...(assessment.has_ic_royalties ? ['Royalty payments detected'] : []),
      ],
    },
    {
      name: 'Thin Capitalisation Risk',
      score: assessment.has_thin_cap_indicators ? 70 : (deRatio && deRatio > 4 ? 50 : 20),
      factors: [
        ...(deRatio && deRatio > 4 ? [`D/E ratio: ${deRatio.toFixed(1)}:1 (threshold: 4:1)`] : []),
        ...(assessment.has_thin_cap_indicators ? ['Potential interest deduction limitation'] : []),
      ],
    },
  ];

  const getOverallColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPriorityBadge = (tier: string | null) => {
    if (!tier) return null;
    const config: Record<string, { bg: string; text: string; label: string }> = {
      A: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'HIGH OPPORTUNITY' },
      B: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'MEDIUM OPPORTUNITY' },
      C: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'LOW OPPORTUNITY' },
    };
    const c = config[tier] || config.C;
    return (
      <Badge className={cn(c.bg, c.text, 'font-bold px-3 py-1')}>
        {tier} - {c.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Risk Scoring Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Individual Risk Categories */}
          {riskCategories.map((category, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{category.name}</h4>
              </div>
              <RiskProgressBar score={category.score} />
              {category.factors.length > 0 && (
                <ul className="space-y-1 pl-1">
                  {category.factors.map((factor, factorIndex) => (
                    <li key={factorIndex} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Overall Score Section */}
          <div className="pt-6 mt-6 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">OVERALL OPPORTUNITY SCORE</h4>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getOverallColor(assessment.total_score || 0)
                    )}
                    style={{ width: `${assessment.total_score || 0}%` }}
                  />
                </div>
                <span className="text-xl font-bold text-[#1e3a5f] w-20 text-right">
                  {assessment.total_score || 0}/100
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Priority Tier:</span>
                {getPriorityBadge(assessment.priority_tier)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>0-39: Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>40-69: Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>70-100: High Opportunity</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
