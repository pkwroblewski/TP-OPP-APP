'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  FileText,
  Calendar,
  Globe,
  TrendingUp,
  AlertTriangle,
  Clock,
  Loader2,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/types/database';

type SortField = 'name' | 'rcs_number' | 'created_at' | 'last_filing_date';
type SortOrder = 'asc' | 'desc';

interface CompanyWithStats extends Company {
  filings_count?: number;
  latest_score?: number;
  latest_tier?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [legalFormFilter, setLegalFormFilter] = useState<string>('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        filings(count),
        tp_assessments(total_score, priority_tier)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      setIsLoading(false);
      return;
    }

    // Transform data to include stats
    const companiesWithStats: CompanyWithStats[] = (data || []).map((company) => {
      const filingsCount = company.filings?.[0]?.count || 0;
      const latestAssessment = company.tp_assessments?.[0];
      return {
        ...company,
        filings_count: filingsCount,
        latest_score: latestAssessment?.total_score || undefined,
        latest_tier: latestAssessment?.priority_tier || undefined,
        filings: undefined,
        tp_assessments: undefined,
      };
    });

    setCompanies(companiesWithStats);
    setIsLoading(false);
  };

  // Get unique legal forms for filter
  const legalForms = useMemo(() => {
    const forms = new Set(companies.map((c) => c.legal_form).filter(Boolean));
    return Array.from(forms) as string[];
  }, [companies]);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.rcs_number.toLowerCase().includes(query) ||
          company.parent_company_name?.toLowerCase().includes(query)
      );
    }

    // Apply legal form filter
    if (legalFormFilter !== 'all') {
      result = result.filter((company) => company.legal_form === legalFormFilter);
    }

    // Apply sorting
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
        case 'created_at':
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        case 'last_filing_date':
          aVal = a.last_filing_date || '';
          bVal = b.last_filing_date || '';
          break;
      }

      if (aVal === null || bVal === null) return 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, searchQuery, legalFormFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getPriorityBadge = (tier: string | undefined) => {
    if (!tier) return null;

    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      A: {
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <TrendingUp className="h-3 w-3" />,
      },
      B: {
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      C: {
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Clock className="h-3 w-3" />,
      },
    };

    const variant = variants[tier] || variants.C;

    return (
      <Badge variant="outline" className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        Tier {tier}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Companies</h1>
          <p className="text-gray-600">
            Manage and view all uploaded company accounts
          </p>
        </div>
        <Button asChild className="bg-[#1e3a5f] hover:bg-[#2d4a6f] shadow-sm">
          <Link href="/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Accounts
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">{companies.length}</p>
                <p className="text-sm text-gray-500">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {companies.filter((c) => c.latest_tier === 'A').length}
                </p>
                <p className="text-sm text-gray-500">High Priority (Tier A)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {companies.filter((c) => c.latest_tier === 'B').length}
                </p>
                <p className="text-sm text-gray-500">Medium Priority (Tier B)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {companies.filter((c) => c.is_part_of_group).length}
                </p>
                <p className="text-sm text-gray-500">Part of Group</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border-0 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, RCS number, or parent company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20"
              />
            </div>

            {/* Legal Form Filter */}
            <Select value={legalFormFilter} onValueChange={setLegalFormFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-lg border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Legal Form" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Legal Forms</SelectItem>
                {legalForms.map((form) => (
                  <SelectItem key={form} value={form}>
                    {form}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-lg border-gray-200">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="rcs_number-asc">RCS Number (Asc)</SelectItem>
                <SelectItem value="rcs_number-desc">RCS Number (Desc)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Directory
            <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-700 mb-2">
                {searchQuery || legalFormFilter !== 'all'
                  ? 'No companies match your filters'
                  : 'No companies yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mb-4">
                {searchQuery || legalFormFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Upload your first financial accounts to get started.'}
              </p>
              {!searchQuery && legalFormFilter === 'all' && (
                <Button asChild className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
                  <Link href="/upload">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Accounts
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead
                      className="cursor-pointer hover:text-[#1e3a5f] transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Company
                        {sortField === 'name' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-[#1e3a5f] transition-colors"
                      onClick={() => toggleSort('rcs_number')}
                    >
                      <div className="flex items-center gap-1">
                        RCS Number
                        {sortField === 'rcs_number' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Legal Form</TableHead>
                    <TableHead>Parent Company</TableHead>
                    <TableHead>Filings</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-[#1e3a5f] transition-colors"
                      onClick={() => toggleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Added
                        {sortField === 'created_at' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow
                      key={company.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-[#1e3a5f]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-[#1e3a5f] transition-colors">
                              {company.name}
                            </p>
                            {company.is_part_of_group && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Part of group
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {company.rcs_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{company.legal_form || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {company.parent_company_name ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">{company.parent_company_name}</span>
                            {company.parent_country_code && (
                              <Badge variant="outline" className="text-xs">
                                {company.parent_country_code}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{company.filings_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(company.latest_tier)}
                        {!company.latest_tier && (
                          <Badge variant="outline" className="text-gray-500 border-gray-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(company.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link href={`/companies/${company.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
