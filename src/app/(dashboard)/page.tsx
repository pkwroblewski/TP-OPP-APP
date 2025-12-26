import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  TrendingUp,
  Clock,
  Upload,
  FileText,
  ArrowRight,
  Inbox,
  AlertTriangle,
  Target,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types for dashboard data
interface DashboardStats {
  totalCompanies: number;
  tierA: number;
  tierB: number;
  tierC: number;
  pendingProcessing: number;
}

interface RecentActivity {
  id: string;
  companyName: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'processing' | 'failed';
}

interface TopOpportunity {
  id: string;
  companyId: string;
  companyName: string;
  rcsNumber: string;
  totalScore: number;
  estimatedIcVolume: number;
  keyFlag: string;
}

// Fetch dashboard stats from Supabase
async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // Get total companies
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  // Get tier counts from assessments
  const { data: assessments } = await supabase
    .from('tp_assessments')
    .select('priority_tier');

  const tierA = assessments?.filter(a => a.priority_tier === 'A').length || 0;
  const tierB = assessments?.filter(a => a.priority_tier === 'B').length || 0;
  const tierC = assessments?.filter(a => a.priority_tier === 'C').length || 0;

  // Get pending processing count
  const { count: pendingProcessing } = await supabase
    .from('uploaded_files')
    .select('*', { count: 'exact', head: true })
    .in('extraction_status', ['pending', 'extracting', 'parsing']);

  return {
    totalCompanies: totalCompanies || 0,
    tierA,
    tierB,
    tierC,
    pendingProcessing: pendingProcessing || 0,
  };
}

// Fetch recent activity
async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient();

  const { data: files } = await supabase
    .from('uploaded_files')
    .select(`
      id,
      original_filename,
      extraction_status,
      created_at,
      detected_company_name
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!files) return [];

  return files.map(file => ({
    id: file.id,
    companyName: file.detected_company_name || file.original_filename || 'Unknown',
    action: 'File uploaded',
    timestamp: file.created_at,
    status: (file.extraction_status === 'complete' ? 'completed' :
            file.extraction_status === 'failed' ? 'failed' : 'processing') as 'completed' | 'processing' | 'failed',
  }));
}

// Fetch top opportunities (Tier A)
async function getTopOpportunities(): Promise<TopOpportunity[]> {
  const supabase = await createClient();

  const { data: assessments } = await supabase
    .from('tp_assessments')
    .select(`
      id,
      company_id,
      total_score,
      estimated_ic_volume,
      ai_key_findings,
      companies (
        id,
        name,
        rcs_number
      )
    `)
    .eq('priority_tier', 'A')
    .order('total_score', { ascending: false })
    .limit(5);

  if (!assessments) return [];

  return assessments.map(assessment => {
    const company = assessment.companies as { id: string; name: string; rcs_number: string } | null;
    const keyFindings = assessment.ai_key_findings as string[] | null;

    return {
      id: assessment.id,
      companyId: assessment.company_id || '',
      companyName: company?.name || 'Unknown',
      rcsNumber: company?.rcs_number || '',
      totalScore: assessment.total_score || 0,
      estimatedIcVolume: assessment.estimated_ic_volume || 0,
      keyFlag: keyFindings?.[0] || 'High IC volume detected',
    };
  });
}

// Format currency
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(0)}K`;
  }
  return `€${amount.toFixed(0)}`;
}

export default async function DashboardPage() {
  const [stats, recentActivity, topOpportunities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getTopOpportunities(),
  ]);

  const totalPipeline = stats.tierA + stats.tierB + stats.tierC;

  const statsCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-[#1e3a5f]',
      href: '/companies',
    },
    {
      title: 'Tier A - High Priority',
      value: stats.tierA,
      icon: AlertTriangle,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      href: '/companies?tier=A',
    },
    {
      title: 'Tier B - Medium',
      value: stats.tierB,
      icon: Target,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      href: '/companies?tier=B',
    },
    {
      title: 'Pending Processing',
      value: stats.pendingProcessing,
      icon: Clock,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      href: '/processing',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl border-0 hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold text-[#1e3a5f]">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.iconBg} shadow-sm`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          size="lg"
          className="bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white px-6 py-5 text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Link href="/upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Financial Accounts
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white px-6 py-5 text-sm font-medium rounded-lg transition-all"
        >
          <Link href="/companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            View All Companies
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-5 text-sm font-medium rounded-lg transition-all"
        >
          <Link href="/opportunities" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            View Pipeline
          </Link>
        </Button>
      </div>

      {/* Pipeline Summary */}
      <Card className="bg-white shadow-sm rounded-xl border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
              Pipeline Summary
            </CardTitle>
            <Link
              href="/companies"
              className="text-sm text-[#1e3a5f] hover:text-[#d4a853] font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {totalPipeline > 0 ? (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
                {stats.tierA > 0 && (
                  <Link
                    href="/companies?tier=A"
                    className="bg-emerald-500 hover:bg-emerald-600 transition-colors h-full"
                    style={{ width: `${(stats.tierA / totalPipeline) * 100}%` }}
                    title={`Tier A: ${stats.tierA}`}
                  />
                )}
                {stats.tierB > 0 && (
                  <Link
                    href="/companies?tier=B"
                    className="bg-amber-500 hover:bg-amber-600 transition-colors h-full"
                    style={{ width: `${(stats.tierB / totalPipeline) * 100}%` }}
                    title={`Tier B: ${stats.tierB}`}
                  />
                )}
                {stats.tierC > 0 && (
                  <Link
                    href="/companies?tier=C"
                    className="bg-gray-400 hover:bg-gray-500 transition-colors h-full"
                    style={{ width: `${(stats.tierC / totalPipeline) * 100}%` }}
                    title={`Tier C: ${stats.tierC}`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-6 text-sm">
                <Link href="/companies?tier=A" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-600">Tier A</span>
                  <span className="font-semibold text-[#1e3a5f]">{stats.tierA}</span>
                </Link>
                <Link href="/companies?tier=B" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-gray-600">Tier B</span>
                  <span className="font-semibold text-[#1e3a5f]">{stats.tierB}</span>
                </Link>
                <Link href="/companies?tier=C" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-gray-600">Tier C</span>
                  <span className="font-semibold text-[#1e3a5f]">{stats.tierC}</span>
                </Link>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-[#1e3a5f] text-lg">{totalPipeline}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No companies in pipeline yet. Upload financial accounts to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white shadow-sm rounded-xl border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
                Recent Activity
              </CardTitle>
              <Link
                href="/processing"
                className="text-sm text-[#1e3a5f] hover:text-[#d4a853] font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.companyName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        activity.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : activity.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  No recent activity
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mb-4">
                  Upload your first batch of annual accounts to start identifying opportunities.
                </p>
                <Button asChild variant="outline" size="sm" className="border-[#d4a853] text-[#1e3a5f]">
                  <Link href="/upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Opportunities */}
        <Card className="bg-white shadow-sm rounded-xl border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
                Top Opportunities
              </CardTitle>
              <Link
                href="/companies?tier=A"
                className="text-sm text-[#1e3a5f] hover:text-[#d4a853] font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {topOpportunities.length > 0 ? (
              <div className="space-y-3">
                {topOpportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/companies/${opp.companyId}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500 text-white font-bold text-sm">
                        {opp.totalScore}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-[#1e3a5f]">
                          {opp.companyName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {opp.rcsNumber} • {formatCurrency(opp.estimatedIcVolume)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs hidden sm:inline-flex">
                        Tier A
                      </Badge>
                      <Eye className="h-4 w-4 text-gray-400 group-hover:text-[#1e3a5f]" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  No opportunities yet
                </h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  High-priority opportunities will appear here once companies are analyzed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA Banner */}
      <Card className="bg-gradient-to-r from-[#1e3a5f] via-[#254670] to-[#2d4a6f] text-white shadow-lg rounded-xl border-0 overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ready to identify more opportunities?</h3>
              <p className="text-white/80 text-sm max-w-md">
                Upload Luxembourg annual accounts in PDF format to automatically detect intercompany transactions and score TP potential.
              </p>
            </div>
            <Button
              asChild
              className="bg-[#d4a853] hover:bg-[#c49843] text-[#1e3a5f] font-semibold px-6 py-5 whitespace-nowrap rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/upload" className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Start Upload
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
