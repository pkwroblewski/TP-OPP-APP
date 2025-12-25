'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  Target,
  DollarSign,
  Percent,
  RefreshCw,
  ArrowUpRight,
  Globe,
  Banknote,
  Scale,
  AlertTriangle,
} from 'lucide-react';

interface AnalyticsData {
  totalCompanies: number;
  totalFilings: number;
  totalAssessments: number;
  companiesWithAssessments: number;

  tierDistribution: { tier: string; count: number }[];
  statusDistribution: { status: string; count: number }[];

  avgTotalScore: number;
  avgFinancingRisk: number;
  avgServicesRisk: number;
  avgDocumentationRisk: number;

  icIndicators: {
    hasIcFinancing: number;
    hasIcServices: number;
    hasIcRoyalties: number;
    hasCrossBorder: number;
    hasThinCap: number;
  };

  topOpportunities: Array<{
    companyName: string;
    companyId: string;
    totalScore: number;
    estimatedIcVolume: number;
    priorityTier: string;
  }>;

  recentActivity: Array<{
    type: string;
    companyName: string;
    date: string;
    details: string;
  }>;
}

const TIER_COLORS = {
  A: 'bg-red-500',
  B: 'bg-amber-500',
  C: 'bg-emerald-500',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-400',
  contacted: 'bg-blue-500',
  meeting_scheduled: 'bg-amber-500',
  proposal_sent: 'bg-purple-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  meeting_scheduled: 'Meeting',
  proposal_sent: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const supabase = createClient();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Get available fiscal years
      const { data: yearsData } = await supabase
        .from('tp_assessments')
        .select('fiscal_year')
        .order('fiscal_year', { ascending: false });

      const years = Array.from(new Set(yearsData?.map((y) => y.fiscal_year) || []));
      setAvailableYears(years);

      // Base query filters
      let assessmentsQuery = supabase.from('tp_assessments').select('*, companies(name)');
      if (fiscalYear !== 'all') {
        assessmentsQuery = assessmentsQuery.eq('fiscal_year', parseInt(fiscalYear));
      }

      // Fetch all data in parallel
      const [
        { count: totalCompanies },
        { count: totalFilings },
        { data: assessments },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('filings').select('*', { count: 'exact', head: true }),
        assessmentsQuery,
      ]);

      const assessmentsList = assessments || [];

      // Calculate tier distribution
      const tierCounts: Record<string, number> = { A: 0, B: 0, C: 0 };
      assessmentsList.forEach((a) => {
        if (a.priority_tier) {
          tierCounts[a.priority_tier] = (tierCounts[a.priority_tier] || 0) + 1;
        }
      });

      // Calculate status distribution
      const statusCounts: Record<string, number> = {};
      assessmentsList.forEach((a) => {
        const status = a.outreach_status || 'new';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Calculate average scores
      const withScores = assessmentsList.filter((a) => a.total_score !== null);
      const avgTotalScore = withScores.length > 0
        ? withScores.reduce((sum, a) => sum + (a.total_score || 0), 0) / withScores.length
        : 0;

      const avgFinancingRisk = withScores.length > 0
        ? withScores.reduce((sum, a) => sum + (a.financing_risk_score || 0), 0) / withScores.length
        : 0;

      const avgServicesRisk = withScores.length > 0
        ? withScores.reduce((sum, a) => sum + (a.services_risk_score || 0), 0) / withScores.length
        : 0;

      const avgDocumentationRisk = withScores.length > 0
        ? withScores.reduce((sum, a) => sum + (a.documentation_risk_score || 0), 0) / withScores.length
        : 0;

      // IC Indicators
      const icIndicators = {
        hasIcFinancing: assessmentsList.filter((a) => a.has_ic_financing).length,
        hasIcServices: assessmentsList.filter((a) => a.has_ic_services).length,
        hasIcRoyalties: assessmentsList.filter((a) => a.has_ic_royalties).length,
        hasCrossBorder: assessmentsList.filter((a) => a.has_cross_border_ic).length,
        hasThinCap: assessmentsList.filter((a) => a.has_thin_cap_indicators).length,
      };

      // Top opportunities
      const topOpportunities = assessmentsList
        .filter((a) => a.total_score !== null)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
        .slice(0, 5)
        .map((a) => ({
          companyName: (a.companies as { name: string } | null)?.name || 'Unknown',
          companyId: a.company_id || '',
          totalScore: a.total_score || 0,
          estimatedIcVolume: a.estimated_ic_volume || 0,
          priorityTier: a.priority_tier || 'C',
        }));

      // Recent activity (use latest assessments)
      const recentAssessments = [...assessmentsList]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

      const recentActivity = recentAssessments.map((a) => ({
        type: 'assessment',
        companyName: (a.companies as { name: string } | null)?.name || 'Unknown',
        date: a.updated_at,
        details: `Score: ${a.total_score}/100, Tier ${a.priority_tier}`,
      }));

      // Get unique company IDs with assessments
      const companiesWithAssessments = new Set(assessmentsList.map((a) => a.company_id)).size;

      setData({
        totalCompanies: totalCompanies || 0,
        totalFilings: totalFilings || 0,
        totalAssessments: assessmentsList.length,
        companiesWithAssessments,
        tierDistribution: Object.entries(tierCounts).map(([tier, count]) => ({ tier, count })),
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        avgTotalScore,
        avgFinancingRisk,
        avgServicesRisk,
        avgDocumentationRisk,
        icIndicators,
        topOpportunities,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, fiscalYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1e3a5f]" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-600">Failed to load analytics data</p>
      </div>
    );
  }

  const maxTierCount = Math.max(...data.tierDistribution.map((t) => t.count), 1);
  const maxStatusCount = Math.max(...data.statusDistribution.map((s) => s.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Insights and metrics for your TP opportunity pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  FY {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalCompanies}</div>
            <p className="text-sm opacity-75 mt-1">In database</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
              </div>
              Total Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">{data.totalFilings}</div>
            <p className="text-sm text-slate-500 mt-1">Uploaded</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">{data.totalAssessments}</div>
            <p className="text-sm text-slate-500 mt-1">
              {data.companiesWithAssessments} companies analyzed
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
              </div>
              Avg. Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">
              {data.avgTotalScore.toFixed(0)}
              <span className="text-lg text-slate-400">/100</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Overall risk score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tier Distribution */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Priority Tier Distribution
            </CardTitle>
            <CardDescription>Companies by TP opportunity tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tierDistribution.map((tier) => (
                <div key={tier.tier} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${
                          tier.tier === 'A'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : tier.tier === 'B'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Tier {tier.tier}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {tier.tier === 'A' ? 'High Priority' : tier.tier === 'B' ? 'Medium Priority' : 'Lower Priority'}
                      </span>
                    </div>
                    <span className="font-semibold text-[#1e3a5f]">{tier.count}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] || 'bg-slate-400'
                      }`}
                      style={{ width: `${(tier.count / maxTierCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {data.tierDistribution.length === 0 && (
                <p className="text-center text-slate-400 py-8">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Outreach Status */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Outreach Pipeline
            </CardTitle>
            <CardDescription>Status of opportunity outreach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.statusDistribution.map((status) => (
                <div key={status.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {STATUS_LABELS[status.status] || status.status}
                    </span>
                    <span className="font-semibold text-[#1e3a5f]">{status.count}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        STATUS_COLORS[status.status] || 'bg-slate-400'
                      }`}
                      style={{ width: `${(status.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {data.statusDistribution.length === 0 && (
                <p className="text-center text-slate-400 py-8">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Scores and IC Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Risk Scores */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Average Risk Scores
            </CardTitle>
            <CardDescription>Breakdown by risk category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#1e3a5f]" />
                    <span className="text-sm font-medium">Financing Risk</span>
                  </div>
                  <span className="font-semibold">{data.avgFinancingRisk.toFixed(0)}/100</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1e3a5f] rounded-full"
                    style={{ width: `${data.avgFinancingRisk}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#d4a853]" />
                    <span className="text-sm font-medium">Services Risk</span>
                  </div>
                  <span className="font-semibold">{data.avgServicesRisk.toFixed(0)}/100</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d4a853] rounded-full"
                    style={{ width: `${data.avgServicesRisk}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Documentation Risk</span>
                  </div>
                  <span className="font-semibold">{data.avgDocumentationRisk.toFixed(0)}/100</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${data.avgDocumentationRisk}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IC Transaction Indicators */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              IC Transaction Indicators
            </CardTitle>
            <CardDescription>Companies with detected IC transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-[#1e3a5f]" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">IC Financing</span>
                </div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {data.icIndicators.hasIcFinancing}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#d4a853]/20 flex items-center justify-center">
                    <Scale className="h-4 w-4 text-[#d4a853]" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">IC Services</span>
                </div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {data.icIndicators.hasIcServices}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">IC Royalties</span>
                </div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {data.icIndicators.hasIcRoyalties}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Cross-Border</span>
                </div>
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {data.icIndicators.hasCrossBorder}
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl col-span-2 hover:bg-amber-100/70 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/50 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-amber-700">Thin Capitalization Indicators</span>
                </div>
                <p className="text-2xl font-bold text-amber-700">
                  {data.icIndicators.hasThinCap}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Opportunities and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Opportunities */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Top Opportunities
            </CardTitle>
            <CardDescription>Highest scoring companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topOpportunities.map((opp, index) => (
                <div
                  key={opp.companyId || index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        TIER_COLORS[opp.priorityTier as keyof typeof TIER_COLORS] || 'bg-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#1e3a5f]">{opp.companyName}</p>
                      <p className="text-sm text-slate-500">
                        IC Volume: {formatCurrency(opp.estimatedIcVolume)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1e3a5f]">{opp.totalScore}/100</p>
                    <Badge
                      variant="outline"
                      className={`${
                        opp.priorityTier === 'A'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : opp.priorityTier === 'B'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Tier {opp.priorityTier}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.topOpportunities.length === 0 && (
                <p className="text-center text-slate-400 py-8">No opportunities yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Recent Activity
            </CardTitle>
            <CardDescription>Latest assessments and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1e3a5f]">{activity.companyName}</p>
                    <p className="text-sm text-slate-500">{activity.details}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(activity.date)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <p className="text-center text-slate-400 py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Pipeline Conversion
          </CardTitle>
          <CardDescription>Track your opportunity pipeline performance</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100/70 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1e3a5f]">
                {data.statusDistribution.find((s) => s.status === 'won')?.count || 0}
              </p>
              <p className="text-sm font-medium text-slate-500">Won Deals</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-xl hover:bg-red-100/70 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1e3a5f]">
                {data.statusDistribution.find((s) => s.status === 'lost')?.count || 0}
              </p>
              <p className="text-sm font-medium text-slate-500">Lost</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100/70 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1e3a5f]">
                {data.totalAssessments > 0
                  ? (
                      ((data.statusDistribution.find((s) => s.status === 'won')?.count || 0) /
                        data.totalAssessments) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-sm font-medium text-slate-500">Win Rate</p>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-xl hover:bg-amber-100/70 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#d4a853]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1e3a5f]">
                {formatCurrency(
                  data.topOpportunities.reduce((sum, o) => sum + o.estimatedIcVolume, 0)
                )}
              </p>
              <p className="text-sm font-medium text-slate-500">Total IC Volume (Top 5)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
