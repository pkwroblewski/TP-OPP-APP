'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TPAssessment, FinancialData } from '@/types/database';

interface RecommendedServicesProps {
  assessment: TPAssessment | null;
  financialData: FinancialData | null;
}

interface ServiceRecommendation {
  priority: 'immediate' | 'secondary';
  service: string;
  checked?: boolean;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function estimateEngagementValue(icVolume: number, score: number): string {
  // Simple heuristic for engagement value
  let baseValue = 20000;

  if (icVolume > 50000000) baseValue = 80000;
  else if (icVolume > 20000000) baseValue = 60000;
  else if (icVolume > 10000000) baseValue = 45000;
  else if (icVolume > 5000000) baseValue = 35000;

  // Adjust for complexity score
  const multiplier = 1 + (score / 100) * 0.5;
  const estimated = baseValue * multiplier;

  const low = Math.round(estimated * 0.8 / 5000) * 5000;
  const high = Math.round(estimated * 1.2 / 5000) * 5000;

  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

export function RecommendedServices({ assessment, financialData }: RecommendedServicesProps) {
  if (!assessment) {
    return (
      <Card className="bg-white shadow-tp border-0 rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recommended Services
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No recommendations available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate recommendations based on assessment
  const recommendations: ServiceRecommendation[] = [];

  // Immediate (High Priority) recommendations
  if (assessment.has_rate_anomalies) {
    recommendations.push({
      priority: 'immediate',
      service: 'IC financing structure review - zero spread remediation',
    });
  }

  if (assessment.likely_needs_local_file || assessment.likely_needs_master_file) {
    recommendations.push({
      priority: 'immediate',
      service: 'TP documentation (Master File + Local File)',
    });
  }

  if (assessment.has_ic_financing && assessment.financing_risk_score && assessment.financing_risk_score > 50) {
    recommendations.push({
      priority: 'immediate',
      service: 'Interest rate benchmarking study',
    });
  }

  // Secondary recommendations
  if (assessment.has_thin_cap_indicators || (financialData?.debt_to_equity_ratio && financialData.debt_to_equity_ratio > 4)) {
    recommendations.push({
      priority: 'secondary',
      service: 'Thin capitalisation analysis & restructuring',
    });
  }

  if (assessment.has_ic_services) {
    recommendations.push({
      priority: 'secondary',
      service: 'Management fee benchmarking',
    });
  }

  if (assessment.has_ic_financing && financialData?.interest_expense_ic) {
    recommendations.push({
      priority: 'secondary',
      service: 'ATAD interest limitation impact assessment',
    });
  }

  if (assessment.has_cross_border_ic) {
    recommendations.push({
      priority: 'secondary',
      service: 'Cross-border transaction documentation',
    });
  }

  const immediateServices = recommendations.filter((r) => r.priority === 'immediate');
  const secondaryServices = recommendations.filter((r) => r.priority === 'secondary');

  const icVolume = assessment.estimated_ic_volume || 0;
  const engagementValue = estimateEngagementValue(icVolume, assessment.total_score || 0);

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Recommended Services
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Immediate Priority */}
          {immediateServices.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 text-xs">High Priority</Badge>
                Immediate
              </h4>
              <ul className="space-y-2">
                {immediateServices.map((service, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{service.service}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Secondary */}
          {secondaryServices.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Secondary</Badge>
              </h4>
              <ul className="space-y-2">
                {secondaryServices.map((service, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{service.service}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No recommendations */}
          {recommendations.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No specific service recommendations identified.
            </div>
          )}

          {/* Estimated Value */}
          {recommendations.length > 0 && (
            <div className="pt-4 mt-4 border-t border-dashed border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  ESTIMATED ENGAGEMENT VALUE:
                </span>
                <span className="text-lg font-bold text-[#1e3a5f]">
                  {engagementValue}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on IC volume and complexity
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
