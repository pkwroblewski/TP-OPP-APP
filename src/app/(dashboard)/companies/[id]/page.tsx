'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Globe,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  ExternalLink,
  DollarSign,
  Users,
  BarChart3,
  Loader2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import type { Company, Filing, FinancialData, TPAssessment, ICTransaction } from '@/types/database';

interface CompanyDetails extends Company {
  filings: Filing[];
  financial_data: FinancialData[];
  tp_assessments: TPAssessment[];
  ic_transactions: ICTransaction[];
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [extractingFilingId, setExtractingFilingId] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        filings(*),
        financial_data(*),
        tp_assessments(*),
        ic_transactions(*)
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      setIsLoading(false);
      return;
    }

    setCompany(data as CompanyDetails);
    setIsLoading(false);
  };

  const triggerExtraction = async (filingId: string) => {
    setExtractingFilingId(filingId);
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Extraction failed:', error);
      }

      // Refresh company details after extraction
      await fetchCompanyDetails();
    } catch (error) {
      console.error('Failed to trigger extraction:', error);
    } finally {
      setExtractingFilingId(null);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getLatestAssessment = () => {
    if (!company?.tp_assessments?.length) return null;
    return company.tp_assessments.sort((a, b) => b.fiscal_year - a.fiscal_year)[0];
  };

  const getLatestFinancials = () => {
    if (!company?.financial_data?.length) return null;
    return company.financial_data.sort((a, b) => b.fiscal_year - a.fiscal_year)[0];
  };

  const getPriorityBadge = (tier: string | null | undefined) => {
    if (!tier) return null;

    const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      A: {
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <TrendingUp className="h-4 w-4" />,
        label: 'High Priority',
      },
      B: {
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'Medium Priority',
      },
      C: {
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Clock className="h-4 w-4" />,
        label: 'Low Priority',
      },
    };

    const variant = variants[tier] || variants.C;

    return (
      <Badge variant="outline" className={`${variant.className} flex items-center gap-1.5 px-3 py-1`}>
        {variant.icon}
        Tier {tier} - {variant.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      extracting: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-700 mb-2">Company not found</h3>
        <p className="text-sm text-gray-500 mb-4">
          The company you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  const latestAssessment = getLatestAssessment();
  const latestFinancials = getLatestFinancials();

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-[#1e3a5f]">
          <Link href="/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Link>
        </Button>
      </div>

      {/* Company Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-8 w-8 text-[#1e3a5f]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <code className="text-sm bg-gray-100 px-2.5 py-1 rounded font-mono">
                {company.rcs_number}
              </code>
              {company.legal_form && (
                <Badge variant="outline" className="text-gray-600">
                  {company.legal_form}
                </Badge>
              )}
              {company.is_part_of_group && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Globe className="h-3 w-3 mr-1" />
                  Part of Group
                </Badge>
              )}
            </div>
            {company.parent_company_name && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Parent: {company.parent_company_name}
                {company.parent_country_code && (
                  <Badge variant="outline" className="text-xs">
                    {company.parent_country_code}
                  </Badge>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {getPriorityBadge(latestAssessment?.priority_tier)}
          <Button variant="outline" onClick={fetchCompanyDetails}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-[#1e3a5f] hover:bg-[#2d4a6f]">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm hover:shadow-md border-0 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#1e3a5f]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {company.filings?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Filings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md border-0 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {formatCurrency(latestFinancials?.total_assets || null)}
                </p>
                <p className="text-sm text-gray-500">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md border-0 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {latestAssessment?.total_score || '-'}
                </p>
                <p className="text-sm text-gray-500">TP Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md border-0 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {company.ic_transactions?.length || 0}
                </p>
                <p className="text-sm text-gray-500">IC Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1.5 rounded-xl shadow-inner">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-4 py-2 font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="financials"
            className="rounded-lg px-4 py-2 font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm"
          >
            Financials
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg px-4 py-2 font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm"
          >
            IC Transactions
          </TabsTrigger>
          <TabsTrigger
            value="filings"
            className="rounded-lg px-4 py-2 font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm"
          >
            Filings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TP Assessment Summary */}
            <Card className="bg-white shadow-sm border-0 rounded-xl">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  TP Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {latestAssessment ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Overall Score</span>
                      <span className="text-2xl font-bold text-[#1e3a5f]">
                        {latestAssessment.total_score || '-'}/100
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Financing Risk</span>
                          <span className="font-medium">{latestAssessment.financing_risk_score || 0}</span>
                        </div>
                        <Progress value={latestAssessment.financing_risk_score || 0} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Services Risk</span>
                          <span className="font-medium">{latestAssessment.services_risk_score || 0}</span>
                        </div>
                        <Progress value={latestAssessment.services_risk_score || 0} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Documentation Risk</span>
                          <span className="font-medium">{latestAssessment.documentation_risk_score || 0}</span>
                        </div>
                        <Progress value={latestAssessment.documentation_risk_score || 0} className="h-2" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {latestAssessment.has_ic_financing && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            IC Financing
                          </Badge>
                        )}
                        {latestAssessment.has_ic_services && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            IC Services
                          </Badge>
                        )}
                        {latestAssessment.has_cross_border_ic && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Cross-Border
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No assessment available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card className="bg-white shadow-sm border-0 rounded-xl">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">RCS Number</dt>
                    <dd className="font-medium text-gray-900">{company.rcs_number}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Legal Form</dt>
                    <dd className="font-medium text-gray-900">{company.legal_form || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Incorporation Date</dt>
                    <dd className="font-medium text-gray-900">{formatDate(company.incorporation_date)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">NACE Code</dt>
                    <dd className="font-medium text-gray-900">{company.nace_code || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Part of Group</dt>
                    <dd className="font-medium text-gray-900">
                      {company.is_part_of_group ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  {company.parent_company_name && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Parent Company</dt>
                        <dd className="font-medium text-gray-900">{company.parent_company_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Parent Country</dt>
                        <dd className="font-medium text-gray-900">{company.parent_country_code || '-'}</dd>
                      </div>
                    </>
                  )}
                  {company.ultimate_parent_name && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Ultimate Parent</dt>
                        <dd className="font-medium text-gray-900">{company.ultimate_parent_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Ultimate Parent Country</dt>
                        <dd className="font-medium text-gray-900">{company.ultimate_parent_country || '-'}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* AI Summary */}
          {latestAssessment?.ai_summary && (
            <Card className="bg-white shadow-sm border-0 rounded-xl">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
                  AI Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">{latestAssessment.ai_summary}</p>
                {latestAssessment.ai_recommended_approach && (
                  <div className="mt-4 p-4 bg-[#1e3a5f]/5 rounded-lg">
                    <h4 className="font-medium text-[#1e3a5f] mb-2">Recommended Approach</h4>
                    <p className="text-gray-700">{latestAssessment.ai_recommended_approach}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Data by Year
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {company.financial_data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead>Fiscal Year</TableHead>
                        <TableHead className="text-right">Total Assets</TableHead>
                        <TableHead className="text-right">Total Equity</TableHead>
                        <TableHead className="text-right">Turnover</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                        <TableHead className="text-right">IC Loans</TableHead>
                        <TableHead className="text-right">D/E Ratio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.financial_data
                        .sort((a, b) => b.fiscal_year - a.fiscal_year)
                        .map((data, index) => (
                          <TableRow key={data.id} className={`hover:bg-[#1e3a5f]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="font-medium">{data.fiscal_year}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.total_assets)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.total_equity)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.turnover)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.net_profit)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency((data.ic_loans_receivable || 0) + (data.ic_loans_payable || 0))}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.debt_to_equity_ratio?.toFixed(2) || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <DollarSign className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No financial data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IC Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Intercompany Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {company.ic_transactions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Counterparty</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Annual Flow</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead>Flags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.ic_transactions
                        .sort((a, b) => b.fiscal_year - a.fiscal_year)
                        .map((tx, index) => (
                          <TableRow key={tx.id} className={`hover:bg-[#1e3a5f]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="font-medium">
                              {tx.transaction_type.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.transaction_category || '-'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{tx.counterparty_name || '-'}</span>
                                {tx.counterparty_country && (
                                  <Badge variant="outline" className="text-xs">
                                    {tx.counterparty_country}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(tx.principal_amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(tx.annual_flow)}</TableCell>
                            <TableCell className="text-right">
                              {tx.implied_interest_rate ? `${(tx.implied_interest_rate * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {tx.is_cross_border && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    Cross-Border
                                  </Badge>
                                )}
                                {tx.is_high_value && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                                    High Value
                                  </Badge>
                                )}
                                {tx.is_rate_anomaly && (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                    Rate Anomaly
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No intercompany transactions detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filings Tab */}
        <TabsContent value="filings" className="space-y-6">
          <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Filings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {company.filings?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead>Fiscal Year</TableHead>
                        <TableHead>Filing Type</TableHead>
                        <TableHead>Filing Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.filings
                        .sort((a, b) => b.fiscal_year - a.fiscal_year)
                        .map((filing, index) => (
                          <TableRow key={filing.id} className={`hover:bg-[#1e3a5f]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="font-medium">{filing.fiscal_year}</TableCell>
                            <TableCell>{filing.filing_type || 'Annual Accounts'}</TableCell>
                            <TableCell>{formatDate(filing.filing_date)}</TableCell>
                            <TableCell>{getStatusBadge(filing.extraction_status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(filing.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {(filing.extraction_status === 'pending' || filing.extraction_status === 'failed') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => triggerExtraction(filing.id)}
                                    disabled={extractingFilingId === filing.id}
                                    className="text-[#1e3a5f] border-[#1e3a5f]/30 hover:bg-[#1e3a5f]/10"
                                  >
                                    {extractingFilingId === filing.id ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        Extracting...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                        {filing.extraction_status === 'failed' ? 'Retry' : 'Extract'}
                                      </>
                                    )}
                                  </Button>
                                )}
                                {filing.pdf_stored_path && (
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No filings uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
