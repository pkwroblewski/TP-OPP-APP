'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface UploadTrendsChartProps {
  data: Array<{ date: string; count: number }>;
}

export function UploadTrendsChart({ data }: UploadTrendsChartProps) {
  const hasData = data.length > 0 && data.some(d => d.count > 0);

  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Upload Trends
        </CardTitle>
        <CardDescription>Files uploaded over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-600">
                            {payload[0].value} uploads
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  fill="url(#uploadGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No upload data available for the last 30 days
          </div>
        )}
      </CardContent>
    </Card>
  );
}
