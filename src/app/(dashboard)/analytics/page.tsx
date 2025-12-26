'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Building2,
  Wallet,
  BarChart3,
  Percent,
} from 'lucide-react';
import {
  StatsCard,
  ScoreDistributionChart,
  PriorityTierChart,
  ICVolumeChart,
  PipelineFunnel,
  UploadTrendsChart,
  TopOpportunitiesTable,
} from '@/components/analytics';

interface AnalyticsData {
  totalCompanies: number;
  totalIcVolume: number;
  avgScore: number;
  conversionRate: number;

  // For charts
  assessments: Array<{ total_score: number | null; priority_tier: string | null }>;
  tierDistribution: { tier: string; count: number }[];

  icVolumeByType: {
    financing: number;
    services: number;
    royalties: number;
    guarantees: number;
  };

  pipelineStats: {
    uploaded: number;
    extracted: number;
    analysed: number;
    contacted: number;
    won: number;
  };

  uploadTrends: Array<{ date: string; count: number }>;

  topOpportunities: Array<{
    id: string;
    companyName: string;
    score: number;
    tier: string;
    icVolume: number;
    keyFinding: string;
  }>;
}

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
      let assessmentsQuery = supabase.from('tp_assessments').select(`
        *,
        companies(name)
      `);

      if (fiscalYear !== 'all') {
        assessmentsQuery = assessmentsQuery.eq('fiscal_year', parseInt(fiscalYear));
      }

      // Fetch all data in parallel
      const [
        { count: totalCompanies },
        { data: assessments },
        { data: filings },
        { data: financialData },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        assessmentsQuery,
        supabase.from('filings').select('created_at, extraction_status'),
        supabase.from('financial_data').select('ic_loans_receivable, ic_loans_payable, management_fees, service_fees_ic, royalty_expense'),
      ]);

      const assessmentsList = assessments || [];
      const filingsList = filings || [];
      const financialList = financialData || [];

      // Calculate tier distribution
      const tierCounts: Record<string, number> = { A: 0, B: 0, C: 0 };
      assessmentsList.forEach((a) => {
        if (a.priority_tier) {
          tierCounts[a.priority_tier] = (tierCounts[a.priority_tier] || 0) + 1;
        }
      });

      // Calculate average score
      const withScores = assessmentsList.filter((a) => a.total_score !== null);
      const avgScore = withScores.length > 0
        ? withScores.reduce((sum, a) => sum + (a.total_score || 0), 0) / withScores.length
        : 0;

      // Calculate total IC volume from financial data
      const totalIcVolume = financialList.reduce((sum, f) => {
        return sum +
          Math.abs(f.ic_loans_receivable || 0) +
          Math.abs(f.ic_loans_payable || 0) +
          Math.abs(f.management_fees || 0) +
          Math.abs(f.service_fees_ic || 0) +
          Math.abs(f.royalty_expense || 0);
      }, 0);

      // Calculate IC volume by type
      const icVolumeByType = {
        financing: financialList.reduce((sum, f) =>
          sum + Math.abs(f.ic_loans_receivable || 0) + Math.abs(f.ic_loans_payable || 0), 0),
        services: financialList.reduce((sum, f) =>
          sum + Math.abs(f.management_fees || 0) + Math.abs(f.service_fees_ic || 0), 0),
        royalties: financialList.reduce((sum, f) =>
          sum + Math.abs(f.royalty_expense || 0), 0),
        guarantees: 0, // Placeholder - add if you have guarantee data
      };

      // Pipeline stats
      const statusCounts: Record<string, number> = {
        new: 0,
        contacted: 0,
        meeting_scheduled: 0,
        proposal_sent: 0,
        won: 0,
        lost: 0,
      };
      assessmentsList.forEach((a) => {
        const status = a.outreach_status || 'new';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const pipelineStats = {
        uploaded: filingsList.length,
        extracted: filingsList.filter(f => f.extraction_status === 'completed').length,
        analysed: assessmentsList.length,
        contacted: statusCounts.contacted + statusCounts.meeting_scheduled + statusCounts.proposal_sent + statusCounts.won,
        won: statusCounts.won,
      };

      // Conversion rate (won / total assessments)
      const conversionRate = assessmentsList.length > 0
        ? (statusCounts.won / assessmentsList.length) * 100
        : 0;

      // Upload trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const uploadsByDate: Record<string, number> = {};
      filingsList.forEach((f) => {
        const date = new Date(f.created_at).toISOString().split('T')[0];
        if (new Date(date) >= thirtyDaysAgo) {
          uploadsByDate[date] = (uploadsByDate[date] || 0) + 1;
        }
      });

      // Fill in missing dates with 0
      const uploadTrends: Array<{ date: string; count: number }> = [];
      for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        uploadTrends.push({
          date: dateStr,
          count: uploadsByDate[dateStr] || 0,
        });
      }

      // Top opportunities
      const topOpportunities = assessmentsList
        .filter((a) => a.total_score !== null)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
        .slice(0, 10)
        .map((a) => {
          // Determine key finding
          let keyFinding = 'Standard IC transactions';
          if (a.has_rate_anomalies) keyFinding = 'Zero spread on IC financing';
          else if (a.has_thin_cap_indicators) keyFinding = 'Thin capitalisation indicators';
          else if (a.likely_needs_local_file) keyFinding = 'Local File documentation required';
          else if (a.has_ic_financing) keyFinding = 'IC financing structure';
          else if (a.has_ic_services) keyFinding = 'Management/service fees';

          return {
            id: a.company_id || '',
            companyName: (a.companies as { name: string } | null)?.name || 'Unknown',
            score: a.total_score || 0,
            tier: a.priority_tier || 'C',
            icVolume: a.estimated_ic_volume || 0,
            keyFinding,
          };
        });

      setData({
        totalCompanies: totalCompanies || 0,
        totalIcVolume,
        avgScore,
        conversionRate,
        assessments: assessmentsList.map(a => ({
          total_score: a.total_score,
          priority_tier: a.priority_tier
        })),
        tierDistribution: Object.entries(tierCounts).map(([tier, count]) => ({ tier, count })),
        icVolumeByType,
        pipelineStats,
        uploadTrends,
        topOpportunities,
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
    if (value >= 1000000000) {
      return `€${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toFixed(0)}`;
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Companies"
          value={data.totalCompanies.toString()}
          subtitle="In database"
          icon={Building2}
          variant="primary"
        />
        <StatsCard
          title="Total IC Volume"
          value={formatCurrency(data.totalIcVolume)}
          subtitle="Across all companies"
          icon={Wallet}
        />
        <StatsCard
          title="Avg. Score"
          value={`${data.avgScore.toFixed(0)}/100`}
          subtitle="Overall opportunity score"
          icon={BarChart3}
          variant={data.avgScore >= 50 ? 'success' : 'default'}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${data.conversionRate.toFixed(1)}%`}
          subtitle="Won / Total assessed"
          icon={Percent}
          variant={data.conversionRate >= 20 ? 'success' : data.conversionRate >= 10 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreDistributionChart data={data.assessments} />
        <PriorityTierChart data={data.assessments} />
        <ICVolumeChart data={data.icVolumeByType} />
        <PipelineFunnel data={data.pipelineStats} />
      </div>

      {/* Upload Trends */}
      <UploadTrendsChart data={data.uploadTrends} />

      {/* Top Opportunities Table */}
      <TopOpportunitiesTable data={data.topOpportunities} />
    </div>
  );
}
