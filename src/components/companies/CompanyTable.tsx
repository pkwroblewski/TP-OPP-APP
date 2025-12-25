'use client';

import Link from 'next/link';
import { Building2, ChevronRight, ExternalLink } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Company {
  id: string;
  name: string;
  rcs_number: string;
  legal_form?: string | null;
  parent_company_name?: string | null;
  is_part_of_group?: boolean;
  tp_score?: number | null;
  priority_tier?: string | null;
  filings_count?: number;
}

interface CompanyTableProps {
  companies: Company[];
  isLoading?: boolean;
}

export function CompanyTable({ companies, isLoading }: CompanyTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-3 w-1/4 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No companies found</h3>
        <p className="text-sm text-gray-500">Upload financial accounts to add companies.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
            <TableHead className="font-semibold text-gray-700">Company</TableHead>
            <TableHead className="font-semibold text-gray-700">RCS Number</TableHead>
            <TableHead className="font-semibold text-gray-700">Legal Form</TableHead>
            <TableHead className="font-semibold text-gray-700">Parent Company</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Priority</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company, index) => (
            <TableRow
              key={company.id}
              className={`hover:bg-[#1e3a5f]/5 transition-colors duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <TableCell>
                <Link href={`/companies/${company.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center group-hover:bg-[#1e3a5f] transition-colors duration-200">
                    <Building2 className="h-5 w-5 text-[#1e3a5f] group-hover:text-white transition-colors duration-200" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-[#1e3a5f] transition-colors duration-200">
                    {company.name}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm text-gray-600">{company.rcs_number}</TableCell>
              <TableCell className="text-gray-600">{company.legal_form || '-'}</TableCell>
              <TableCell className="text-gray-600">
                {company.parent_company_name ? (
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[150px]">{company.parent_company_name}</span>
                    {company.is_part_of_group && (
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <ScoreBadge tier={company.priority_tier} score={company.tp_score} size="sm" />
              </TableCell>
              <TableCell>
                <Link href={`/companies/${company.id}`} className="text-gray-400 hover:text-[#1e3a5f] transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
