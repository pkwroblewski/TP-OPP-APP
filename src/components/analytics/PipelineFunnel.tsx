'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineFunnelProps {
  data: {
    uploaded: number;
    extracted: number;
    analysed: number;
    contacted: number;
    won: number;
  };
}

const STAGES = [
  { key: 'uploaded', label: 'Uploaded', color: 'bg-slate-400' },
  { key: 'extracted', label: 'Extracted', color: 'bg-blue-500' },
  { key: 'analysed', label: 'Analysed', color: 'bg-amber-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-purple-500' },
  { key: 'won', label: 'Won', color: 'bg-emerald-500' },
];

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const { uploaded, extracted, analysed, contacted, won } = data;
  const values: Record<string, number> = {
    uploaded,
    extracted,
    analysed,
    contacted,
    won,
  };

  const maxValue = Math.max(...Object.values(values), 1);

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pipeline Funnel
        </CardTitle>
        <CardDescription>Conversion through processing stages</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {STAGES.map((stage, index) => {
            const value = values[stage.key];
            const prevValue = index > 0 ? values[STAGES[index - 1].key] : value;
            const conversionRate = prevValue > 0 ? ((value / prevValue) * 100).toFixed(0) : '0';
            const widthPercentage = Math.max((value / maxValue) * 100, 8);

            return (
              <div key={stage.key} className="relative">
                {/* Connector line */}
                {index > 0 && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                    {conversionRate}%
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-600 text-right">
                    {stage.label}
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className={cn(
                        'h-10 rounded-lg flex items-center justify-end px-4 transition-all',
                        stage.color
                      )}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      <span className="text-white font-bold text-sm">{value}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1e3a5f]">
              {uploaded > 0 ? ((won / uploaded) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500">Overall Conversion</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{won}</p>
            <p className="text-xs text-gray-500">Total Won</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
