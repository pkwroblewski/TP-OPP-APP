'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Plus, TrendingUp, AlertTriangle, Globe, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar, type FilterState } from '@/components/companies/FilterBar';
import { CompanyTable, type CompanyRow, type SortField, type SortOrder } from '@/components/companies/CompanyTable';
import { Pagination } from '@/components/companies/Pagination';
import { ExportDropdown } from '@/components/companies/ExportDropdown';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 25;

interface CompanyWithStats {
  id: string;
  name: string;
  rcs_number: string;
  legal_form: string | null;
  is_part_of_group: boolean;
  fiscal_year: string | null;
  priority_tier: string | null;
  total_score: number | null;
  ic_volume: number | null;
  status: 'ready' | 'processing' | 'failed';
}

function CompaniesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters from URL
  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get('search') || '',
    priorities: searchParams.get('priorities')?.split(',').filter(Boolean) || [],
    fiscalYears: searchParams.get('years')?.split(',').filter(Boolean) || [],
    scoreMin: parseInt(searchParams.get('scoreMin') || '0'),
    scoreMax: parseInt(searchParams.get('scoreMax') || '100'),
  }));

  // Sort from URL
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sortBy') as SortField) || 'name'
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'asc'
  );

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: FilterState, newSortField: SortField, newSortOrder: SortOrder) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.priorities.length > 0) params.set('priorities', newFilters.priorities.join(','));
      if (newFilters.fiscalYears.length > 0) params.set('years', newFilters.fiscalYears.join(','));
      if (newFilters.scoreMin > 0) params.set('scoreMin', newFilters.scoreMin.toString());
      if (newFilters.scoreMax < 100) params.set('scoreMax', newFilters.scoreMax.toString());
      if (newSortField !== 'name') params.set('sortBy', newSortField);
      if (newSortOrder !== 'asc') params.set('sortOrder', newSortOrder);

      const queryString = params.toString();
      router.replace(queryString ? `?${queryString}` : '/companies', { scroll: false });
    },
    [router]
  );

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, sortField, sortOrder);
  };

  // Handle sort changes
  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    updateURL(filters, field, newOrder);
  };

  // Fetch companies
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
          legal_form,
          is_part_of_group,
          filings(fiscal_year, extraction_status),
          tp_assessments(total_score, priority_tier, estimated_ic_volume)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        setIsLoading(false);
        return;
      }

      // Transform data
      const transformedCompanies: CompanyWithStats[] = (data || []).map((company) => {
        const latestFiling = company.filings?.[0] as { fiscal_year?: string | number; extraction_status?: string } | undefined;
        const latestAssessment = company.tp_assessments?.[0] as {
          total_score?: number;
          priority_tier?: string;
          estimated_ic_volume?: number;
        } | undefined;

        let status: 'ready' | 'processing' | 'failed' = 'ready';
        if (latestFiling?.extraction_status === 'processing' || latestFiling?.extraction_status === 'pending') {
          status = 'processing';
        } else if (latestFiling?.extraction_status === 'failed') {
          status = 'failed';
        }

        return {
          id: company.id,
          name: company.name,
          rcs_number: company.rcs_number,
          legal_form: company.legal_form,
          is_part_of_group: company.is_part_of_group || false,
          fiscal_year: latestFiling?.fiscal_year?.toString() || null,
          priority_tier: latestAssessment?.priority_tier || null,
          total_score: latestAssessment?.total_score || null,
          ic_volume: latestAssessment?.estimated_ic_volume || null,
          status,
        };
      });

      setCompanies(transformedCompanies);
      setIsLoading(false);
    }

    fetchCompanies();
  }, []);

  // Get available fiscal years for filter
  const availableFiscalYears = useMemo(() => {
    const years = new Set(companies.map((c) => c.fiscal_year).filter(Boolean) as string[]);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [companies]);

  // Apply filters and sorting
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.rcs_number.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter((c) => c.priority_tier && filters.priorities.includes(c.priority_tier));
    }

    // Fiscal year filter
    if (filters.fiscalYears.length > 0) {
      result = result.filter((c) => c.fiscal_year && filters.fiscalYears.includes(c.fiscal_year));
    }

    // Score range filter
    if (filters.scoreMin > 0 || filters.scoreMax < 100) {
      result = result.filter((c) => {
        if (c.total_score === null) return false;
        return c.total_score >= filters.scoreMin && c.total_score <= filters.scoreMax;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'rcs_number':
          aVal = a.rcs_number;
          bVal = b.rcs_number;
          break;
        case 'fiscal_year':
          aVal = a.fiscal_year || '';
          bVal = b.fiscal_year || '';
          break;
        case 'priority':
          aVal = a.priority_tier || 'Z';
          bVal = b.priority_tier || 'Z';
          break;
        case 'score':
          aVal = a.total_score ?? -1;
          bVal = b.total_score ?? -1;
          break;
        case 'ic_volume':
          aVal = a.ic_volume ?? -1;
          bVal = b.ic_volume ?? -1;
          break;
      }

      if (aVal === null || bVal === null) return 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, filters, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, currentPage]);

  // Convert to table format
  const tableCompanies: CompanyRow[] = paginatedCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    rcs_number: c.rcs_number,
    fiscal_year: c.fiscal_year,
    priority_tier: c.priority_tier,
    total_score: c.total_score,
    ic_volume: c.ic_volume,
    status: c.status,
  }));

  // Stats
  const stats = useMemo(() => ({
    total: companies.length,
    tierA: companies.filter((c) => c.priority_tier === 'A').length,
    tierB: companies.filter((c) => c.priority_tier === 'B').length,
    partOfGroup: companies.filter((c) => c.is_part_of_group).length,
  }), [companies]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Companies</h1>
            <Badge variant="secondary" className="bg-[#1e3a5f]/10 text-[#1e3a5f]">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'} analysed
            </Badge>
          </div>
          <p className="text-gray-600">
            View and manage all uploaded company accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            companies={filteredCompanies.map((c) => ({
              id: c.id,
              name: c.name,
              rcs_number: c.rcs_number,
              fiscal_year: c.fiscal_year,
              priority_tier: c.priority_tier,
              total_score: c.total_score,
              ic_volume: c.ic_volume,
              status: c.status,
            }))}
          />
          <Button asChild className="bg-[#1e3a5f] hover:bg-[#2a4a7f] shadow-sm gap-2">
            <Link href="/upload">
              <Plus className="h-4 w-4" />
              Upload Accounts
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{stats.tierA}</p>
                <p className="text-sm text-gray-500">High Priority (Tier A)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{stats.tierB}</p>
                <p className="text-sm text-gray-500">Medium Priority (Tier B)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-tp border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{stats.partOfGroup}</p>
                <p className="text-sm text-gray-500">Part of Group</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableFiscalYears={availableFiscalYears}
        totalCount={companies.length}
        filteredCount={filteredCompanies.length}
      />

      {/* Companies Table */}
      <Card className="bg-white shadow-tp border-0 rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CompanyTable
            companies={tableCompanies}
            isLoading={isLoading}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(id) => router.push(`/companies/${id}`)}
          />

          {/* Pagination */}
          {!isLoading && filteredCompanies.length > 0 && (
            <div className="border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredCompanies.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
        </div>
      }
    >
      <CompaniesContent />
    </Suspense>
  );
}
