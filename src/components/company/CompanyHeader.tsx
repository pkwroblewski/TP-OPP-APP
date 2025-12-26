'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Globe, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/companies/PriorityBadge';
import { ScoreBar } from '@/components/companies/ScoreBar';
import type { Company, TPAssessment } from '@/types/database';

interface CompanyHeaderProps {
  company: Company;
  assessment: TPAssessment | null;
  onExport?: () => void;
}

// Country flag emoji helper
function getCountryFlag(countryCode: string | null): string {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  const flagMap: Record<string, string> = {
    DE: '\u{1F1E9}\u{1F1EA}',
    FR: '\u{1F1EB}\u{1F1F7}',
    BE: '\u{1F1E7}\u{1F1EA}',
    NL: '\u{1F1F3}\u{1F1F1}',
    LU: '\u{1F1F1}\u{1F1FA}',
    GB: '\u{1F1EC}\u{1F1E7}',
    US: '\u{1F1FA}\u{1F1F8}',
    CH: '\u{1F1E8}\u{1F1ED}',
    IT: '\u{1F1EE}\u{1F1F9}',
    ES: '\u{1F1EA}\u{1F1F8}',
  };
  return flagMap[code] || '';
}

export function CompanyHeader({ company, assessment, onExport }: CompanyHeaderProps) {
  const priorityLabel = assessment?.priority_tier === 'A'
    ? 'HIGH OPPORTUNITY'
    : assessment?.priority_tier === 'B'
    ? 'MEDIUM OPPORTUNITY'
    : 'LOW OPPORTUNITY';

  return (
    <div className="space-y-4">
      {/* Back Link */}
      <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-[#1e3a5f] -ml-2">
        <Link href="/companies">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Link>
      </Button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-tp border-0 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Side - Company Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] flex items-center justify-center flex-shrink-0 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[#1e3a5f]">{company.name}</h1>

              {/* Info badges row */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <code className="bg-gray-100 px-2.5 py-1 rounded font-mono text-[#1e3a5f]">
                  RCS: {company.rcs_number}
                </code>
                {company.legal_form && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{company.legal_form}</span>
                  </>
                )}
                {assessment?.fiscal_year && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>Fiscal Year: {assessment.fiscal_year}</span>
                  </>
                )}
              </div>

              {/* Parent Company */}
              {company.parent_company_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Parent:</span>
                  <span className="font-medium text-gray-900">{company.parent_company_name}</span>
                  {company.parent_country_code && (
                    <span className="text-lg" title={company.parent_country_code}>
                      {getCountryFlag(company.parent_country_code)}
                    </span>
                  )}
                </div>
              )}

              {/* Priority & Score */}
              {assessment && (
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Priority:</span>
                    {assessment.priority_tier && (
                      <PriorityBadge tier={assessment.priority_tier} size="md" showLabel />
                    )}
                    <span className="text-sm font-semibold text-gray-700">{priorityLabel}</span>
                  </div>

                  {assessment.total_score !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Score:</span>
                      <div className="w-40">
                        <ScoreBar score={assessment.total_score} size="md" showValue />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Export Button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="border-gray-200 hover:border-[#1e3a5f]/30 hover:bg-gray-50 gap-2"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
