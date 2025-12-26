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
  GripVertical,
  FileText,
  Wallet,
} from 'lucide-react';
import type { TPAssessment, Company } from '@/types/database';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface OpportunityWithCompany extends TPAssessment {
  companies: Company | null;
}

const PIPELINE_COLUMNS = [
  { id: 'new', label: 'New', color: 'border-slate-300', bgColor: 'bg-slate-100', icon: Clock },
  { id: 'contacted', label: 'Contacted', color: 'border-blue-400', bgColor: 'bg-blue-100', icon: Mail },
  { id: 'meeting_scheduled', label: 'Meeting', color: 'border-amber-400', bgColor: 'bg-amber-100', icon: Calendar },
  { id: 'proposal_sent', label: 'Proposal', color: 'border-purple-400', bgColor: 'bg-purple-100', icon: FileText },
  { id: 'won', label: 'Won', color: 'border-emerald-400', bgColor: 'bg-emerald-100', icon: CheckCircle },
  { id: 'lost', label: 'Lost', color: 'border-red-400', bgColor: 'bg-red-100', icon: XCircle },
];

const PRIORITY_BADGES = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-amber-100 text-amber-700 border-amber-200',
  C: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface OpportunityCardProps {
  opportunity: OpportunityWithCompany;
  onEditNotes: (opp: OpportunityWithCompany) => void;
  isDragging?: boolean;
}

function OpportunityCard({ opportunity, onEditNotes, isDragging }: OpportunityCardProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value.toFixed(0)}`;
  };

  // Determine key finding
  let keyFinding = '';
  if (opportunity.has_rate_anomalies) keyFinding = 'Zero spread on IC financing';
  else if (opportunity.has_thin_cap_indicators) keyFinding = 'Thin capitalisation risk';
  else if (opportunity.likely_needs_local_file) keyFinding = 'Local File required';
  else if (opportunity.has_ic_financing) keyFinding = 'IC financing detected';
  else if (opportunity.has_ic_services) keyFinding = 'Management fees detected';

  return (
    <Card
      className={cn(
        'border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-white rounded-xl',
        isDragging && 'shadow-xl ring-2 ring-[#1e3a5f] opacity-90'
      )}
    >
      <CardContent className="p-4">
        {/* Header with drag handle */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/companies/${opportunity.company_id}`}
              className="font-medium text-[#1e3a5f] hover:underline line-clamp-1 block"
            >
              {opportunity.companies?.name || 'Unknown Company'}
            </Link>
            <p className="text-xs text-gray-500">{opportunity.companies?.rcs_number}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditNotes(opportunity)}>
                Add/Edit Notes
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/companies/${opportunity.company_id}`}>View Details</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Score and Tier */}
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-semibold',
              PRIORITY_BADGES[opportunity.priority_tier as keyof typeof PRIORITY_BADGES] || ''
            )}
          >
            Tier {opportunity.priority_tier}
          </Badge>
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  (opportunity.total_score || 0) >= 70
                    ? 'bg-red-500'
                    : (opportunity.total_score || 0) >= 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                )}
                style={{ width: `${opportunity.total_score || 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">{opportunity.total_score}</span>
          </div>
        </div>

        {/* IC Volume */}
        <div className="flex items-center gap-2 mb-2 text-sm">
          <Wallet className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-600">{formatCurrency(opportunity.estimated_ic_volume)}</span>
        </div>

        {/* Key Finding */}
        {keyFinding && (
          <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md mb-2 line-clamp-1">
            {keyFinding}
          </div>
        )}

        {/* Notes indicator */}
        {opportunity.outreach_notes && (
          <div className="text-xs text-gray-400 italic line-clamp-1">
            📝 {opportunity.outreach_notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SortableOpportunityCardProps {
  opportunity: OpportunityWithCompany;
  onEditNotes: (opp: OpportunityWithCompany) => void;
}

function SortableOpportunityCard({ opportunity, onEditNotes }: SortableOpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OpportunityCard opportunity={opportunity} onEditNotes={onEditNotes} isDragging={isDragging} />
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof PIPELINE_COLUMNS[number];
  opportunities: OpportunityWithCompany[];
  onEditNotes: (opp: OpportunityWithCompany) => void;
}

function KanbanColumn({ column, opportunities, onEditNotes }: KanbanColumnProps) {
  const Icon = column.icon;

  return (
    <div className="flex-shrink-0 w-72 bg-gray-50/80 rounded-xl shadow-inner">
      {/* Column Header */}
      <div className={cn('p-4 border-b-2', column.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', column.bgColor)}>
              <Icon className="h-4 w-4 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-800">{column.label}</h3>
          </div>
          <Badge variant="secondary" className="bg-white shadow-sm font-bold">
            {opportunities.length}
          </Badge>
        </div>
      </div>

      {/* Cards Container */}
      <div className="p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto">
        <SortableContext items={opportunities.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {opportunities.map((opp) => (
            <SortableOpportunityCard key={opp.id} opportunity={opp} onEditNotes={onEditNotes} />
          ))}
        </SortableContext>

        {opportunities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
            <p>Drop cards here</p>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

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
      setOpportunities((data as OpportunityWithCompany[]) || []);
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
          opp.id === assessmentId ? { ...opp, outreach_status: newStatus } : opp
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
          opp.id === selectedOpportunity.id ? { ...opp, outreach_notes: notes } : opp
        )
      );
      setNoteDialogOpen(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeOpp = opportunities.find((o) => o.id === active.id);
    if (!activeOpp) return;

    // Find which column the item was dropped into
    const overOpp = opportunities.find((o) => o.id === over.id);
    let targetStatus: string | null = null;

    if (overOpp) {
      // Dropped on another card - use that card's column
      targetStatus = overOpp.outreach_status || 'new';
    } else {
      // Dropped on a column container
      const columnId = over.id as string;
      if (PIPELINE_COLUMNS.some((c) => c.id === columnId)) {
        targetStatus = columnId;
      }
    }

    if (targetStatus && targetStatus !== activeOpp.outreach_status) {
      updateOutreachStatus(activeOpp.id, targetStatus);
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
    filteredOpportunities.filter((opp) => (opp.outreach_status || 'new') === status);

  const handleEditNotes = (opp: OpportunityWithCompany) => {
    setSelectedOpportunity(opp);
    setNotes(opp.outreach_notes || '');
    setNoteDialogOpen(true);
  };

  // Stats calculations
  const totalOpportunities = opportunities.length;
  const tierACounts = opportunities.filter((o) => o.priority_tier === 'A').length;
  const activeDeals = opportunities.filter(
    (o) =>
      o.outreach_status !== 'new' &&
      o.outreach_status !== 'won' &&
      o.outreach_status !== 'lost'
  ).length;
  const wonDeals = opportunities.filter((o) => o.outreach_status === 'won').length;

  const activeOpportunity = opportunities.find((o) => o.id === activeId);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Opportunity Pipeline</h1>
          <p className="text-slate-500 mt-1">
            Drag and drop cards to move opportunities through the pipeline
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOpportunities}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Tier A (High)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">{tierACounts}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1e3a5f]">{activeDeals}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Won Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{wonDeals}</div>
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
        <Button variant="outline" onClick={fetchOpportunities} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                opportunities={getOpportunitiesByStatus(column.id)}
                onEditNotes={handleEditNotes}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOpportunity ? (
              <div className="w-72">
                <OpportunityCard opportunity={activeOpportunity} onEditNotes={() => {}} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
                    <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp, index) => {
                    const statusConfig = PIPELINE_COLUMNS.find((s) => s.id === (opp.outreach_status || 'new'));
                    const StatusIcon = statusConfig?.icon || Clock;

                    return (
                      <tr
                        key={opp.id}
                        className={`border-b hover:bg-[#1e3a5f]/5 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-1 h-10 rounded-full',
                                opp.priority_tier === 'A'
                                  ? 'bg-emerald-500'
                                  : opp.priority_tier === 'B'
                                  ? 'bg-amber-500'
                                  : 'bg-gray-400'
                              )}
                            />
                            <div>
                              <Link
                                href={`/companies/${opp.company_id}`}
                                className="font-medium text-[#1e3a5f] hover:underline"
                              >
                                {opp.companies?.name || 'Unknown'}
                              </Link>
                              <p className="text-sm text-slate-500">{opp.companies?.rcs_number}</p>
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
                            <span className="font-semibold text-[#1e3a5f]">{opp.total_score}</span>
                            <span className="text-slate-400">/100</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          {opp.estimated_ic_volume
                            ? `€${(opp.estimated_ic_volume / 1000000).toFixed(1)}M`
                            : 'N/A'}
                        </td>
                        <td className="p-4">
                          <Select
                            value={opp.outreach_status || 'new'}
                            onValueChange={(value) => updateOutreachStatus(opp.id, value)}
                            disabled={updating}
                          >
                            <SelectTrigger className="w-[140px]">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {PIPELINE_COLUMNS.map((status) => {
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
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditNotes(opp)}
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
                      <td colSpan={6} className="p-8 text-center text-slate-500">
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
            <DialogTitle>Notes - {selectedOpportunity?.companies?.name}</DialogTitle>
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
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
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
