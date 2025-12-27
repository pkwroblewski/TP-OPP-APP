'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Download,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrafficLightRow } from '@/components/ui/traffic-light';
import { cn } from '@/lib/utils';
import type { RiskLevel, OpportunityStatusType } from '@/types/database';

// ============================================
// Types
// ============================================

interface OpportunityData {
  id: string;
  company_id: string;
  company_name: string;
  rcs_number: string;
  ic_risk_level: RiskLevel | null;
  tp_risk_level: RiskLevel | null;
  doc_risk_level: RiskLevel | null;
  key_issue: string | null;
  ic_volume: number | null;
  engagement_estimate_low: number | null;
  engagement_estimate_high: number | null;
  status: OpportunityStatusType;
  priority_tier: string | null;
}

// ============================================
// Constants
// ============================================

const STATUS_OPTIONS: { value: OpportunityStatusType; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const STATUS_COLORS: Record<OpportunityStatusType, string> = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  meeting: 'bg-amber-100 text-amber-700',
  proposal: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  on_hold: 'bg-slate-100 text-slate-700',
};

// ============================================
// Helper Functions
// ============================================

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function hasRedIndicator(opp: OpportunityData): boolean {
  return opp.ic_risk_level === 'RED' || opp.tp_risk_level === 'RED' || opp.doc_risk_level === 'RED';
}

function hasAmberIndicator(opp: OpportunityData): boolean {
  return opp.ic_risk_level === 'AMBER' || opp.tp_risk_level === 'AMBER' || opp.doc_risk_level === 'AMBER';
}

// ============================================
// Main Component
// ============================================

export default function OpportunitiesPage() {
  const supabase = createClient();

  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'red' | 'amber' | 'new' | 'contacted' | 'meeting' | 'proposal'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch opportunities
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      // Get assessments with red or amber indicators
      const { data: assessments, error: assessmentError } = await supabase
        .from('tp_assessments')
        .select(`
          id,
          company_id,
          ic_risk_level,
          tp_risk_level,
          doc_risk_level,
          ai_summary,
          estimated_ic_volume,
          engagement_estimate_low,
          engagement_estimate_high,
          priority_tier,
          companies (
            name,
            rcs_number
          )
        `)
        .order('assessment_date', { ascending: false });

      if (assessmentError) throw assessmentError;

      // Get opportunity statuses
      const { data: statuses } = await supabase
        .from('opportunity_status')
        .select('company_id, status');

      const statusMap = new Map(statuses?.map((s) => [s.company_id, s.status as OpportunityStatusType]) || []);

      // Build opportunities list (only those with red or amber)
      const opps: OpportunityData[] = (assessments || [])
        .filter((a) => {
          // Must have company_id
          if (!a.company_id) return false;
          const hasRisk =
            a.ic_risk_level === 'RED' ||
            a.ic_risk_level === 'AMBER' ||
            a.tp_risk_level === 'RED' ||
            a.tp_risk_level === 'AMBER' ||
            a.doc_risk_level === 'RED' ||
            a.doc_risk_level === 'AMBER';
          return hasRisk;
        })
        .map((a) => {
          // Determine key issue
          let keyIssue = '';
          if (a.tp_risk_level === 'RED' && a.ic_risk_level === 'RED') {
            keyIssue = 'Zero spread, no docs';
          } else if (a.tp_risk_level === 'RED') {
            keyIssue = 'Zero spread';
          } else if (a.doc_risk_level === 'RED') {
            keyIssue = 'Missing TP documentation';
          } else if (a.ic_risk_level === 'RED') {
            keyIssue = 'High IC volume';
          } else if (a.ic_risk_level === 'AMBER') {
            keyIssue = 'IC financing detected';
          } else if (a.tp_risk_level === 'AMBER') {
            keyIssue = 'Low spread';
          } else {
            keyIssue = 'Documentation review needed';
          }

          return {
            id: a.id,
            company_id: a.company_id as string,
            company_name: (a.companies as { name: string; rcs_number: string })?.name || 'Unknown',
            rcs_number: (a.companies as { name: string; rcs_number: string })?.rcs_number || '',
            ic_risk_level: a.ic_risk_level as RiskLevel | null,
            tp_risk_level: a.tp_risk_level as RiskLevel | null,
            doc_risk_level: a.doc_risk_level as RiskLevel | null,
            key_issue: keyIssue,
            ic_volume: a.estimated_ic_volume,
            engagement_estimate_low: a.engagement_estimate_low,
            engagement_estimate_high: a.engagement_estimate_high,
            status: statusMap.get(a.company_id as string) || 'new',
            priority_tier: a.priority_tier,
          };
        });

      setOpportunities(opps);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Update status
  const updateStatus = async (companyId: string, newStatus: OpportunityStatusType) => {
    setUpdating(companyId);
    try {
      // Upsert opportunity status
      const { error } = await supabase
        .from('opportunity_status')
        .upsert({
          company_id: companyId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });

      if (error) throw error;

      // Add audit trail entry
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_trail').insert({
          company_id: companyId,
          action_type: 'status_changed',
          notes: `Status changed to ${newStatus}`,
          performed_by: user.id,
        });
      }

      // Update local state
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.company_id === companyId ? { ...opp, status: newStatus } : opp
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(null);
    }
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    switch (filter) {
      case 'red':
        return hasRedIndicator(opp);
      case 'amber':
        return hasAmberIndicator(opp) && !hasRedIndicator(opp);
      case 'new':
      case 'contacted':
      case 'meeting':
      case 'proposal':
        return opp.status === filter;
      default:
        return true;
    }
  });

  // Calculate stats
  const totalOpportunities = opportunities.length;
  const highPriority = opportunities.filter(hasRedIndicator).length;
  const estimateLow = opportunities.reduce((sum, o) => sum + (o.engagement_estimate_low || 0), 0);
  const estimateHigh = opportunities.reduce((sum, o) => sum + (o.engagement_estimate_high || 0), 0);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Company', 'RCS', 'Key Issue', 'IC Volume', 'Est. Value', 'Status'];
    const rows = filteredOpportunities.map((opp) => [
      opp.company_name,
      opp.rcs_number,
      opp.key_issue || '',
      opp.ic_volume ? `EUR ${formatCurrency(opp.ic_volume)}` : '',
      opp.engagement_estimate_low
        ? `EUR ${formatCurrency(opp.engagement_estimate_low)}-${formatCurrency(opp.engagement_estimate_high)}`
        : '',
      opp.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">Companies with identified TP exposure</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'red', label: 'High Priority', color: 'text-red-600' },
          { value: 'amber', label: 'Medium', color: 'text-amber-600' },
          { value: 'new', label: 'New' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'proposal', label: 'Proposal' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              filter === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              tab.color && filter !== tab.value && tab.color
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Company</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Key Issue</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">IC Volume</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Est. Value</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Risk</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No opportunities found</p>
                  </td>
                </tr>
              ) : (
                filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <Link
                          href={`/companies/${opp.company_id}`}
                          className="text-sm font-medium text-slate-900 hover:text-blue-600"
                        >
                          {opp.company_name}
                        </Link>
                        <p className="text-xs text-slate-500">{opp.rcs_number}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'text-sm',
                        hasRedIndicator(opp) ? 'text-red-600 font-medium' : 'text-slate-600'
                      )}>
                        {opp.key_issue}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm tabular-nums text-slate-900">
                        {opp.ic_volume ? `EUR ${formatCurrency(opp.ic_volume)}` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm tabular-nums text-slate-900">
                        {opp.engagement_estimate_low
                          ? `EUR ${formatCurrency(opp.engagement_estimate_low)}-${formatCurrency(opp.engagement_estimate_high)}`
                          : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <TrafficLightRow
                          icRisk={opp.ic_risk_level}
                          tpRisk={opp.tp_risk_level}
                          docRisk={opp.doc_risk_level}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={opp.status}
                        onValueChange={(value) => updateStatus(opp.company_id, value as OpportunityStatusType)}
                        disabled={updating === opp.company_id}
                      >
                        <SelectTrigger className={cn('h-8 w-[120px] text-xs font-medium', STATUS_COLORS[opp.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/companies/${opp.company_id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Total Opportunities:</span>
            <span className="ml-2 font-semibold text-slate-900">{totalOpportunities}</span>
          </div>
          <div className="border-l border-slate-300 pl-6">
            <span className="text-slate-500">High Priority:</span>
            <span className="ml-2 font-semibold text-red-600">{highPriority}</span>
          </div>
          <div className="border-l border-slate-300 pl-6">
            <span className="text-slate-500">Est. Pipeline Value:</span>
            <span className="ml-2 font-semibold text-slate-900">
              EUR {formatCurrency(estimateLow)} - {formatCurrency(estimateHigh)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
