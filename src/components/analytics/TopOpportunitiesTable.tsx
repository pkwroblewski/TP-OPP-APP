'use client';

import Link from 'next/link';
import { ChevronRight, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Opportunity {
  id: string;
  companyName: string;
  score: number;
  tier: string;
  icVolume: number;
  keyFinding: string;
}

interface TopOpportunitiesTableProps {
  data: Opportunity[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${'\u20AC'}${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${'\u20AC'}${(value / 1000).toFixed(0)}K`;
  }
  return `${'\u20AC'}${value.toFixed(0)}`;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-red-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getTierConfig(tier: string): { bg: string; text: string } {
  const config: Record<string, { bg: string; text: string }> = {
    A: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    B: { bg: 'bg-amber-100', text: 'text-amber-700' },
    C: { bg: 'bg-gray-100', text: 'text-gray-600' },
  };
  return config[tier] || config.C;
}

export function TopOpportunitiesTable({ data }: TopOpportunitiesTableProps) {
  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top 10 Opportunities
            </CardTitle>
            <CardDescription>Highest scoring companies by opportunity potential</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/opportunities">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">#</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Company</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Priority</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Score</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">IC Volume</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm">Key Finding</th>
                  <th className="text-left p-4 font-semibold text-gray-700 text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((opp, index) => {
                  const tierConfig = getTierConfig(opp.tier);
                  return (
                    <tr
                      key={opp.id}
                      className="border-b hover:bg-[#1e3a5f]/5 transition-colors"
                    >
                      <td className="p-4">
                        <span className="w-6 h-6 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/companies/${opp.id}`}
                          className="font-medium text-[#1e3a5f] hover:underline"
                        >
                          {opp.companyName}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Badge className={cn(tierConfig.bg, tierConfig.text, 'font-semibold')}>
                          Tier {opp.tier}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', getScoreColor(opp.score))}
                              style={{ width: `${opp.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{opp.score}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-700">
                          {formatCurrency(opp.icVolume)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{opp.keyFinding}</span>
                      </td>
                      <td className="p-4">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/companies/${opp.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            No opportunities found. Upload and analyze company accounts to discover opportunities.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
