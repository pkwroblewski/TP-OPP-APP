'use client';

import { Target, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Json } from '@/types/database';

export interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  text: string;
}

interface KeyFindingsProps {
  findings: Json | null;
}

function parseFindingsFromJson(findings: Json | null): Finding[] {
  if (!findings) return [];

  // Handle array of findings
  if (Array.isArray(findings)) {
    return findings.map((f) => {
      if (typeof f === 'object' && f !== null && 'severity' in f && 'text' in f) {
        return {
          severity: (f.severity as string) || 'medium',
          text: (f.text as string) || '',
        } as Finding;
      }
      // If it's just a string, treat as medium severity
      if (typeof f === 'string') {
        return { severity: 'medium' as const, text: f };
      }
      return null;
    }).filter((f): f is Finding => f !== null);
  }

  // Handle object with findings property
  if (typeof findings === 'object' && findings !== null && 'findings' in findings) {
    return parseFindingsFromJson((findings as { findings: Json }).findings);
  }

  return [];
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    indicator: 'bg-red-500',
    label: 'CRITICAL',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    indicator: 'bg-orange-500',
    label: 'HIGH',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    indicator: 'bg-amber-500',
    label: 'MEDIUM',
  },
  low: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    indicator: 'bg-blue-500',
    label: 'LOW',
  },
};

export function KeyFindings({ findings }: KeyFindingsProps) {
  const parsedFindings = parseFindingsFromJson(findings);

  if (parsedFindings.length === 0) {
    return (
      <Card className="bg-white shadow-tp border-0 rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <Target className="h-5 w-5" />
            Key Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No key findings available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by severity: critical > high > medium > low
  const sortedFindings = [...parsedFindings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <Target className="h-5 w-5" />
          Key Findings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {sortedFindings.map((finding, index) => {
            const config = severityConfig[finding.severity] || severityConfig.medium;
            const Icon = config.icon;

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg border',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className={cn('flex-shrink-0 w-2 h-2 rounded-full mt-2', config.indicator)} />
                <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.color)} />
                <div className="flex-1 min-w-0">
                  <span className={cn('text-xs font-bold mr-2', config.color)}>
                    {config.label}:
                  </span>
                  <span className="text-gray-700">{finding.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
