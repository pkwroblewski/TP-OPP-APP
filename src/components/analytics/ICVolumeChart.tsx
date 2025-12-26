'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

interface ICVolumeChartProps {
  data: {
    financing: number;
    services: number;
    royalties: number;
    guarantees: number;
  };
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${'\u20AC'}${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${'\u20AC'}${(value / 1000).toFixed(0)}K`;
  }
  return `${'\u20AC'}${value.toFixed(0)}`;
}

export function ICVolumeChart({ data }: ICVolumeChartProps) {
  const chartData = [
    { name: 'Financing', value: data.financing, color: '#1e3a5f' },
    { name: 'Services', value: data.services, color: '#d4a853' },
    { name: 'Royalties', value: data.royalties, color: '#7c3aed' },
    { name: 'Guarantees', value: data.guarantees, color: '#0ea5e9' },
  ].filter((item) => item.value > 0);

  const hasData = chartData.length > 0;

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          IC Volume by Type
        </CardTitle>
        <CardDescription>Aggregate intercompany transaction volumes</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 80, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                  width={80}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#1e3a5f">
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(value) => formatCurrency(value as number)}
                    style={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No IC volume data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
