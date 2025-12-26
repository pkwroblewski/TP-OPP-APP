'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CompanyRow } from './CompanyTable';

interface ExportDropdownProps {
  companies: CompanyRow[];
  fileName?: string;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '';
  return value.toFixed(2);
}

export function ExportDropdown({ companies, fileName = 'companies' }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const headers = ['Company Name', 'RCS Number', 'Fiscal Year', 'Priority Tier', 'Score', 'IC Volume (EUR)', 'Status'];
      const rows = companies.map((c) => [
        c.name,
        c.rcs_number,
        c.fiscal_year || '',
        c.priority_tier || '',
        c.total_score?.toString() || '',
        formatCurrency(c.ic_volume),
        c.status,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // For Excel, we'll export as TSV which Excel can open
      const headers = ['Company Name', 'RCS Number', 'Fiscal Year', 'Priority Tier', 'Score', 'IC Volume (EUR)', 'Status'];
      const rows = companies.map((c) => [
        c.name,
        c.rcs_number,
        c.fiscal_year || '',
        c.priority_tier || '',
        c.total_score?.toString() || '',
        formatCurrency(c.ic_volume),
        c.status,
      ]);

      const tsvContent = [
        headers.join('\t'),
        ...rows.map((row) => row.join('\t')),
      ].join('\n');

      const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-200 hover:border-[#1e3a5f]/30 hover:bg-gray-50 gap-2"
          disabled={isExporting || companies.length === 0}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Export to CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
