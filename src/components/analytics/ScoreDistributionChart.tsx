'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface ScoreDistributionChartProps {
  data: Array<{ total_score: number | null }>;
}

const SCORE_RANGES = [
  { range: '0-20', min: 0, max: 20, color: '#10b981' },
  { range: '21-40', min: 21, max: 40, color: '#84cc16' },
  { range: '41-60', min: 41, max: 60, color: '#eab308' },
  { range: '61-80', min: 61, max: 80, color: '#f97316' },
  { range: '81-100', min: 81, max: 100, color: '#ef4444' },
];

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const distribution = SCORE_RANGES.map((range) => ({
    range: range.range,
    count: data.filter(
      (item) =>
        item.total_score !== null &&
        item.total_score >= range.min &&
        item.total_score <= range.max
    ).length,
    color: range.color,
  }));

  const hasData = distribution.some((d) => d.count > 0);

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Score Distribution
        </CardTitle>
        <CardDescription>Companies by opportunity score range</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            Score {payload[0].payload.range}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payload[0].value} companies
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No score data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
