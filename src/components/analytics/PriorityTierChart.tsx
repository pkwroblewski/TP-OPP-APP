'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface PriorityTierChartProps {
  data: Array<{ priority_tier: string | null }>;
}

const TIER_CONFIG = {
  A: { color: '#10b981', label: 'Tier A (High)' },
  B: { color: '#f59e0b', label: 'Tier B (Medium)' },
  C: { color: '#6b7280', label: 'Tier C (Low)' },
};

export function PriorityTierChart({ data }: PriorityTierChartProps) {
  const tierCounts = data.reduce((acc, item) => {
    const tier = item.priority_tier || 'C';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(TIER_CONFIG).map(([tier, config]) => ({
    name: config.label,
    value: tierCounts[tier] || 0,
    color: config.color,
    tier,
  })).filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <Target className="h-5 w-5" />
          Priority Tier Breakdown
        </CardTitle>
        <CardDescription>Distribution of companies by opportunity tier</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {hasData ? (
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = ((data.value / total) * 100).toFixed(1);
                      return (
                        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{data.name}</p>
                          <p className="text-sm text-gray-600">
                            {data.value} companies ({percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => {
                    const item = chartData.find(d => d.name === value);
                    const percentage = item ? ((item.value / total) * 100).toFixed(0) : 0;
                    return (
                      <span className="text-sm text-gray-700">
                        {value} <span className="text-gray-400">({percentage}%)</span>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No tier data available
          </div>
        )}

        {/* Stats below chart */}
        {hasData && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(TIER_CONFIG).map(([tier, config]) => (
              <div key={tier} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: config.color }}
                />
                <p className="text-2xl font-bold text-[#1e3a5f]">{tierCounts[tier] || 0}</p>
                <p className="text-xs text-gray-500">Tier {tier}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
