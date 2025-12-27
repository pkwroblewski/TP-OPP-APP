'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Upload,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Loader2,
  X,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrafficLightRow } from '@/components/ui/traffic-light';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types/database';

const PAGE_SIZE = 50;

// Types
type SortField = 'name' | 'rcs' | 'icVolume' | 'spread' | 'tier';
type SortOrder = 'asc' | 'desc';

interface CompanyData {
  id: string;
  name: string;
  rcsNumber: string;
  parentCompany: string | null;
  fiscalYear: number | null;
  icVolume: number | null;
  spreadBps: number | null;
  tier: 'A' | 'B' | 'C' | null;
  icRisk: RiskLevel | null;
  tpRisk: RiskLevel | null;
  docRisk: RiskLevel | null;
  status: 'new' | 'contacted' | 'meeting' | 'proposal' | 'won' | 'lost' | 'on_hold';
}

// Format currency in compact form
function formatVolume(value: number | null): string {
  if (value === null) return '-';
  if (value >= 1000000000) return `€${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

// Format spread
function formatSpread(bps: number | null): React.ReactNode {
  if (bps === null) return <span className="text-slate-400">-</span>;

  // Zero spread is CRITICAL
  if (bps === 0) {
    return <span className="text-red-600 font-medium">0 bps</span>;
  }

  // Low spread (< 25 bps)
  if (bps < 25) {
    return <span className="text-amber-600 font-medium">{bps} bps</span>;
  }

  // Normal spread
  return <span className="text-slate-700">{bps} bps</span>;
}

// Tier badge
function TierBadge({ tier }: { tier: 'A' | 'B' | 'C' | null }) {
  if (!tier) return <span className="text-slate-400">-</span>;

  const colors = {
    A: 'bg-emerald-100 text-emerald-700',
    B: 'bg-amber-100 text-amber-700',
    C: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={cn('px-1.5 py-0.5 text-xs font-medium rounded', colors[tier])}>
      {tier}
    </span>
  );
}

// Status indicator
function StatusIndicator({ status }: { status: CompanyData['status'] }) {
  const colors: Record<CompanyData['status'], string> = {
    new: 'bg-slate-400',
    contacted: 'bg-blue-500',
    meeting: 'bg-amber-500',
    proposal: 'bg-purple-500',
    won: 'bg-emerald-500',
    lost: 'bg-red-500',
    on_hold: 'bg-slate-300',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', colors[status])} />
      <span className="text-xs text-slate-500 capitalize">{status.replace('_', ' ')}</span>
    </div>
  );
}

// Sortable header
function SortHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;

  return (
    <th
      className={cn(
        'px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 select-none',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span className={isActive ? 'text-slate-900' : ''}>{label}</span>
        {isActive ? (
          currentOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-slate-300" />
        )}
      </div>
    </th>
  );
}

function CompaniesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [tierFilter, setTierFilter] = useState<string[]>(
    searchParams.get('tier')?.split(',').filter(Boolean) || []
  );
  const [riskFilter, setRiskFilter] = useState<RiskLevel | null>(
    (searchParams.get('risk') as RiskLevel) || null
  );
  const [sortField, setSortField] = useState<SortField>('icVolume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch companies with assessments
  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          rcs_number,
          parent_company_name,
          tp_assessments (
            fiscal_year,
            priority_tier,
            estimated_ic_volume,
            ic_risk_level,
            tp_risk_level,
            doc_risk_level,
            outreach_status
          ),
          financial_data (
            fiscal_year,
            spread_bps
          ),
          opportunity_status (
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        setIsLoading(false);
        return;
      }

      // Transform data
      const transformed: CompanyData[] = (data || []).map((company) => {
        const latestAssessment = company.tp_assessments?.[0] as {
          fiscal_year?: number;
          priority_tier?: string;
          estimated_ic_volume?: number;
          ic_risk_level?: RiskLevel;
          tp_risk_level?: RiskLevel;
          doc_risk_level?: RiskLevel;
          outreach_status?: string;
        } | undefined;

        const latestFinancial = company.financial_data?.[0] as {
          fiscal_year?: number;
          spread_bps?: number;
        } | undefined;

        const oppStatus = company.opportunity_status as {
          status?: string;
        } | null;

        return {
          id: company.id,
          name: company.name,
          rcsNumber: company.rcs_number,
          parentCompany: company.parent_company_name,
          fiscalYear: latestAssessment?.fiscal_year || latestFinancial?.fiscal_year || null,
          icVolume: latestAssessment?.estimated_ic_volume || null,
          spreadBps: latestFinancial?.spread_bps || null,
          tier: (latestAssessment?.priority_tier as 'A' | 'B' | 'C') || null,
          icRisk: latestAssessment?.ic_risk_level || null,
          tpRisk: latestAssessment?.tp_risk_level || null,
          docRisk: latestAssessment?.doc_risk_level || null,
          status: (oppStatus?.status as CompanyData['status']) || 'new',
        };
      });

      setCompanies(transformed);
      setIsLoading(false);
    }

    fetchCompanies();
  }, []);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField, sortOrder]);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(q) ||
             c.rcsNumber.toLowerCase().includes(q) ||
             c.parentCompany?.toLowerCase().includes(q)
      );
    }

    // Tier filter
    if (tierFilter.length > 0) {
      result = result.filter(c => c.tier && tierFilter.includes(c.tier));
    }

    // Risk filter (any RED indicator)
    if (riskFilter === 'RED') {
      result = result.filter(c =>
        c.icRisk === 'RED' || c.tpRisk === 'RED' || c.docRisk === 'RED'
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'rcs':
          aVal = a.rcsNumber;
          bVal = b.rcsNumber;
          break;
        case 'icVolume':
          aVal = a.icVolume ?? -1;
          bVal = b.icVolume ?? -1;
          break;
        case 'spread':
          aVal = a.spreadBps ?? 9999;
          bVal = b.spreadBps ?? 9999;
          break;
        case 'tier':
          aVal = a.tier || 'Z';
          bVal = b.tier || 'Z';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, searchQuery, tierFilter, riskFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, currentPage]);

  // Stats
  const stats = useMemo(() => ({
    total: companies.length,
    tierA: companies.filter(c => c.tier === 'A').length,
    redFlags: companies.filter(c =>
      c.icRisk === 'RED' || c.tpRisk === 'RED' || c.docRisk === 'RED'
    ).length,
    zeroSpread: companies.filter(c => c.spreadBps === 0).length,
  }), [companies]);

  // Clear filters
  const hasFilters = searchQuery || tierFilter.length > 0 || riskFilter;
  const clearFilters = () => {
    setSearchQuery('');
    setTierFilter([]);
    setRiskFilter(null);
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Name', 'RCS', 'Parent', 'FY', 'IC Volume', 'Spread', 'Tier', 'IC Risk', 'TP Risk', 'DOC Risk', 'Status'];
    const rows = filteredCompanies.map(c => [
      c.name,
      c.rcsNumber,
      c.parentCompany || '',
      c.fiscalYear || '',
      c.icVolume || '',
      c.spreadBps || '',
      c.tier || '',
      c.icRisk || '',
      c.tpRisk || '',
      c.docRisk || '',
      c.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">{filteredCompanies.length} companies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
          <Button asChild size="sm" className="h-8 bg-slate-900 hover:bg-slate-800 text-xs">
            <Link href="/upload">
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <div className="text-2xl font-semibold text-emerald-600">{stats.tierA}</div>
          <div className="text-xs text-slate-500">Tier A</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <div className="text-2xl font-semibold text-red-600">{stats.redFlags}</div>
          <div className="text-xs text-slate-500">Red Flags</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <div className="text-2xl font-semibold text-red-600">{stats.zeroSpread}</div>
          <div className="text-xs text-slate-500">Zero Spread</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Tier filter buttons */}
        <div className="flex items-center gap-1">
          {['A', 'B', 'C'].map((t) => (
            <Button
              key={t}
              variant={tierFilter.includes(t) ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 px-2 text-xs',
                tierFilter.includes(t) && 'bg-slate-900'
              )}
              onClick={() => {
                setTierFilter(prev =>
                  prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                );
                setCurrentPage(1);
              }}
            >
              Tier {t}
            </Button>
          ))}
        </div>

        {/* Red flags filter */}
        <Button
          variant={riskFilter === 'RED' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-8 px-2 text-xs',
            riskFilter === 'RED' && 'bg-red-600 hover:bg-red-700'
          )}
          onClick={() => {
            setRiskFilter(riskFilter === 'RED' ? null : 'RED');
            setCurrentPage(1);
          }}
        >
          <Filter className="h-3 w-3 mr-1" />
          Red Flags
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs text-slate-500"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : paginatedCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No companies found</p>
            {hasFilters && (
              <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <SortHeader
                    label="Company"
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="min-w-[200px]"
                  />
                  <SortHeader
                    label="RCS"
                    field="rcs"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="w-24"
                  />
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Parent
                  </th>
                  <SortHeader
                    label="IC Volume"
                    field="icVolume"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="w-24"
                  />
                  <SortHeader
                    label="Spread"
                    field="spread"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="w-20"
                  />
                  <SortHeader
                    label="Tier"
                    field="tier"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="w-16"
                  />
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                    Risk
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/companies/${company.id}`)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">
                        {company.name}
                      </div>
                      {company.fiscalYear && (
                        <div className="text-xs text-slate-400">FY {company.fiscalYear}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {company.rcsNumber}
                      </code>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-slate-500 truncate max-w-[120px] block">
                        {company.parentCompany || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">
                      {formatVolume(company.icVolume)}
                    </td>
                    <td className="px-3 py-2.5">
                      {formatSpread(company.spreadBps)}
                    </td>
                    <td className="px-3 py-2.5">
                      <TierBadge tier={company.tier} />
                    </td>
                    <td className="px-3 py-2.5">
                      <TrafficLightRow
                        icRisk={company.icRisk}
                        tpRisk={company.tpRisk}
                        docRisk={company.docRisk}
                        size="sm"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusIndicator status={company.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <CompaniesContent />
    </Suspense>
  );
}
