'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  Search,
  Filter,
  Building2,
  TrendingUp,
  ArrowRight,
  MoreVertical,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  DollarSign,
  Users,
  RefreshCw,
} from 'lucide-react';
import type { TPAssessment, Company } from '@/types/database';

interface OpportunityWithCompany extends TPAssessment {
  companies: Company | null;
}

const OUTREACH_STATUSES = [
  { id: 'new', label: 'New', color: 'bg-slate-100 text-slate-700', icon: Clock },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700', icon: Mail },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-amber-100 text-amber-700', icon: Calendar },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-purple-100 text-purple-700', icon: Target },
  { id: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  { id: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700', icon: XCircle },
];

const PRIORITY_COLORS = {
  A: 'bg-red-500',
  B: 'bg-amber-500',
  C: 'bg-emerald-500',
};

const PRIORITY_BADGES = {
  A: 'bg-red-100 text-red-700 border-red-200',
  B: 'bg-amber-100 text-amber-700 border-amber-200',
  C: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityWithCompany | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const supabase = createClient();

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tp_assessments')
        .select(`
          *,
          companies (*)
        `)
        .order('total_score', { ascending: false });

      if (priorityFilter !== 'all') {
        query = query.eq('priority_tier', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOpportunities(data as OpportunityWithCompany[] || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, priorityFilter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const updateOutreachStatus = async (assessmentId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tp_assessments')
        .update({
          outreach_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (error) throw error;

      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === assessmentId
            ? { ...opp, outreach_status: newStatus }
            : opp
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedOpportunity) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tp_assessments')
        .update({
          outreach_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOpportunity.id);

      if (error) throw error;

      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === selectedOpportunity.id
            ? { ...opp, outreach_notes: notes }
            : opp
        )
      );
      setNoteDialogOpen(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      opp.companies?.name.toLowerCase().includes(query) ||
      opp.companies?.rcs_number.toLowerCase().includes(query)
    );
  });

  const getOpportunitiesByStatus = (status: string) =>
    filteredOpportunities.filter((opp) => opp.outreach_status === status);

  // Stats calculations
  const totalOpportunities = opportunities.length;
  const tierACounts = opportunities.filter((o) => o.priority_tier === 'A').length;
  const activeDeals = opportunities.filter(
    (o) => o.outreach_status !== 'new' && o.outreach_status !== 'won' && o.outreach_status !== 'lost'
  ).length;
  const wonDeals = opportunities.filter((o) => o.outreach_status === 'won').length;

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1e3a5f]" />
          <p className="text-slate-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Opportunity Pipeline</h1>
          <p className="text-slate-500 mt-1">
            Track and manage your TP advisory opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'bg-[#1e3a5f] hover:bg-[#2a4a6f]' : ''}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-[#1e3a5f] hover:bg-[#2a4a6f]' : ''}
          >
            List
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOpportunities}</div>
            <p className="text-sm opacity-75 mt-1">Companies analyzed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-red-500" />
              </div>
              Tier A (High Priority)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">{tierACounts}</div>
            <p className="text-sm text-slate-500 mt-1">Top opportunities</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-500" />
              </div>
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">{activeDeals}</div>
            <p className="text-sm text-slate-500 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              Won Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{wonDeals}</div>
            <p className="text-sm text-slate-500 mt-1">Closed successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="A">Tier A (High)</SelectItem>
            <SelectItem value="B">Tier B (Medium)</SelectItem>
            <SelectItem value="C">Tier C (Low)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={fetchOpportunities}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {OUTREACH_STATUSES.map((status) => {
            const StatusIcon = status.icon;
            const statusOpportunities = getOpportunitiesByStatus(status.id);

            return (
              <div
                key={status.id}
                className="flex-shrink-0 w-80 bg-slate-50/80 rounded-xl p-4 shadow-inner"
              >
                <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${
                  status.id === 'new' ? 'border-slate-300' :
                  status.id === 'contacted' ? 'border-blue-400' :
                  status.id === 'meeting_scheduled' ? 'border-amber-400' :
                  status.id === 'proposal_sent' ? 'border-purple-400' :
                  status.id === 'won' ? 'border-emerald-400' :
                  'border-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-slate-700">{status.label}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white shadow-sm">
                    {statusOpportunities.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {statusOpportunities.map((opp) => (
                    <Card
                      key={opp.id}
                      className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer bg-white hover:-translate-y-0.5 rounded-xl"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Link
                            href={`/companies/${opp.company_id}`}
                            className="font-medium text-[#1e3a5f] hover:underline line-clamp-1"
                          >
                            {opp.companies?.name || 'Unknown Company'}
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOpportunity(opp);
                                  setNotes(opp.outreach_notes || '');
                                  setNoteDialogOpen(true);
                                }}
                              >
                                Add/Edit Notes
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/companies/${opp.company_id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {OUTREACH_STATUSES.filter(
                                (s) => s.id !== opp.outreach_status
                              ).map((s) => (
                                <DropdownMenuItem
                                  key={s.id}
                                  onClick={() =>
                                    updateOutreachStatus(opp.id, s.id)
                                  }
                                >
                                  Move to {s.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={PRIORITY_BADGES[opp.priority_tier as keyof typeof PRIORITY_BADGES] || ''}
                          >
                            Tier {opp.priority_tier}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Score: {opp.total_score}/100
                          </span>
                        </div>

                        {opp.ai_summary && (
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {opp.ai_summary}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{opp.companies?.rcs_number}</span>
                          <span>FY {opp.fiscal_year}</span>
                        </div>

                        {/* Score bars */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-20">Financing</span>
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-[#1e3a5f] h-1.5 rounded-full"
                                style={{ width: `${opp.financing_risk_score || 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-20">Services</span>
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-[#d4a853] h-1.5 rounded-full"
                                style={{ width: `${opp.services_risk_score || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {statusOpportunities.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                      No opportunities
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-700">Company</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Tier</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Score</th>
                    <th className="text-left p-4 font-semibold text-slate-700">IC Volume</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left p-4 font-semibold text-slate-700">FY</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp, index) => {
                    const statusConfig = OUTREACH_STATUSES.find(
                      (s) => s.id === opp.outreach_status
                    );
                    const StatusIcon = statusConfig?.icon || Clock;

                    return (
                      <tr
                        key={opp.id}
                        className={`border-b hover:bg-[#1e3a5f]/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-1 h-10 rounded-full ${
                                PRIORITY_COLORS[opp.priority_tier as keyof typeof PRIORITY_COLORS] || 'bg-slate-300'
                              }`}
                            />
                            <div>
                              <Link
                                href={`/companies/${opp.company_id}`}
                                className="font-medium text-[#1e3a5f] hover:underline"
                              >
                                {opp.companies?.name || 'Unknown'}
                              </Link>
                              <p className="text-sm text-slate-500">
                                {opp.companies?.rcs_number}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={PRIORITY_BADGES[opp.priority_tier as keyof typeof PRIORITY_BADGES] || ''}
                          >
                            Tier {opp.priority_tier}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1e3a5f]">
                              {opp.total_score}
                            </span>
                            <span className="text-slate-400">/100</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          {formatCurrency(opp.estimated_ic_volume)}
                        </td>
                        <td className="p-4">
                          <Select
                            value={opp.outreach_status || 'new'}
                            onValueChange={(value) =>
                              updateOutreachStatus(opp.id, value)
                            }
                            disabled={updating}
                          >
                            <SelectTrigger className="w-[160px]">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {OUTREACH_STATUSES.map((status) => {
                                const Icon = status.icon;
                                return (
                                  <SelectItem key={status.id} value={status.id}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {status.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4 text-slate-600">{opp.fiscal_year}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOpportunity(opp);
                                setNotes(opp.outreach_notes || '');
                                setNoteDialogOpen(true);
                              }}
                              title="Add notes"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/companies/${opp.company_id}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredOpportunities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>No opportunities found</p>
                        <p className="text-sm mt-1">
                          Upload and analyze company filings to discover opportunities
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Notes - {selectedOpportunity?.companies?.name}
            </DialogTitle>
            <DialogDescription>
              Add notes about this opportunity for follow-up tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter notes about conversations, next steps, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNotes}
              disabled={updating}
              className="bg-[#1e3a5f] hover:bg-[#2a4a6f]"
            >
              {updating ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
