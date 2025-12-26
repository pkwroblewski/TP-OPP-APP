'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExecutiveSummaryProps {
  summary: string | null;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  if (!summary) {
    return (
      <Card className="bg-white shadow-tp border-0 rounded-xl">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No executive summary available yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload and process financial accounts to generate an AI summary.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-tp border-0 rounded-xl">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a853]/5 rounded-lg p-5 border border-[#1e3a5f]/10">
          <p className="text-gray-700 leading-relaxed italic">
            &ldquo;{summary}&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
