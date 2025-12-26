'use client';

import Link from 'next/link';
import { Building2, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { PriorityBadgeSimple } from './PriorityBadge';
import { ScoreBar } from './ScoreBar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortField = 'name' | 'rcs_number' | 'fiscal_year' | 'priority' | 'score' | 'ic_volume';
export type SortOrder = 'asc' | 'desc';

export interface CompanyRow {
  id: string;
  name: string;
  rcs_number: string;
  fiscal_year: string | null;
  priority_tier: string | null;
  total_score: number | null;
  ic_volume: number | null;
  status: 'ready' | 'processing' | 'failed';
}

interface CompanyTableProps {
  companies: CompanyRow[];
  isLoading?: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onRowClick?: (companyId: string) => void;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-';
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
}

function StatusIndicator({ status }: { status: 'ready' | 'processing' | 'failed' }) {
  const config: Record<string, { icon: typeof CheckCircle2; color: string; label: string; animate?: boolean }> = {
    ready: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Ready' },
    processing: { icon: Loader2, color: 'text-amber-500', label: 'Processing', animate: true },
    failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  };

  const { icon: Icon, color, label, animate } = config[status] || config.ready;

  return (
    <div className={cn('flex items-center gap-1.5', color)}>
      <Icon className={cn('h-4 w-4', animate && 'animate-spin')} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortableHeader({ label, field, currentField, currentOrder, onSort, className }: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-gray-100/50 transition-colors', className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('font-semibold', isActive ? 'text-[#1e3a5f]' : 'text-gray-700')}>
          {label}
        </span>
        {isActive ? (
          currentOrder === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-[#1e3a5f]" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-[#1e3a5f]" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </div>
    </TableHead>
  );
}

export function CompanyTable({
  companies,
  isLoading,
  sortField,
  sortOrder,
  onSort,
  onRowClick,
}: CompanyTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-3 w-1/4 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-12 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-sm">
          <Building2 className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No companies found</h3>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          Upload financial accounts to get started with transfer pricing analysis.
        </p>
        <Button asChild className="bg-[#1e3a5f] hover:bg-[#2a4a7f]">
          <Link href="/upload">Upload Accounts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
            <SortableHeader
              label="Company Name"
              field="name"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
            />
            <SortableHeader
              label="RCS"
              field="rcs_number"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              className="w-28"
            />
            <SortableHeader
              label="Fiscal Year"
              field="fiscal_year"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              className="w-28"
            />
            <SortableHeader
              label="Priority"
              field="priority"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              className="w-24"
            />
            <SortableHeader
              label="Score"
              field="score"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              className="w-32"
            />
            <SortableHeader
              label="IC Volume"
              field="ic_volume"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              className="w-28"
            />
            <TableHead className="w-24 font-semibold text-gray-700">Status</TableHead>
            <TableHead className="w-20 font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company, index) => (
            <TableRow
              key={company.id}
              className={cn(
                'group hover:bg-[#1e3a5f]/5 transition-colors duration-150 cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              )}
              onClick={() => onRowClick?.(company.id)}
            >
              {/* Company Name */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 flex items-center justify-center group-hover:from-[#1e3a5f] group-hover:to-[#2a4a7f] transition-all duration-200">
                    <Building2 className="h-5 w-5 text-[#1e3a5f] group-hover:text-white transition-colors duration-200" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-[#1e3a5f] transition-colors duration-200">
                    {company.name}
                  </span>
                </div>
              </TableCell>

              {/* RCS Number */}
              <TableCell>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                  {company.rcs_number}
                </code>
              </TableCell>

              {/* Fiscal Year */}
              <TableCell className="text-gray-600">
                {company.fiscal_year || '-'}
              </TableCell>

              {/* Priority */}
              <TableCell>
                {company.priority_tier ? (
                  <PriorityBadgeSimple tier={company.priority_tier} />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>

              {/* Score */}
              <TableCell>
                {company.total_score !== null ? (
                  <ScoreBar score={company.total_score} size="sm" />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>

              {/* IC Volume */}
              <TableCell>
                <span className="font-medium text-gray-700">
                  {formatCurrency(company.ic_volume)}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <StatusIndicator status={company.status} />
              </TableCell>

              {/* Actions */}
              <TableCell>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/companies/${company.id}`}>
                    View
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
