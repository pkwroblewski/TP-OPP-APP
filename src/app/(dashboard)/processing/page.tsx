'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Zap,
  TrendingUp,
  Building2,
  Eye,
  RotateCcw,
  Trash2,
  X,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingItem {
  id: string;
  company_id: string;
  company_name: string;
  rcs_number: string;
  fiscal_year: number;
  extraction_status: string;
  pdf_stored_path: string | null;
  pdf_filename: string | null;
  created_at: string;
  progress?: number;
}

interface ProcessingStats {
  pending: number;
  extracting: number;
  analysing: number;
  completed: number;
  failed: number;
}

const STATUS_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  icon: React.ElementType;
  label: string;
  animate?: boolean;
}> = {
  pending: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Clock,
    label: 'Pending'
  },
  extracting: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Loader2,
    label: 'Extracting',
    animate: true
  },
  analysing: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: TrendingUp,
    label: 'Analysing',
    animate: true
  },
  completed: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: CheckCircle,
    label: 'Complete'
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    label: 'Failed'
  },
};

export default function ProcessingPage() {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({
    pending: 0,
    extracting: 0,
    analysing: 0,
    completed: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const supabase = createClient();

  const fetchProcessingQueue = useCallback(async () => {
    try {
      const { data: filings, error } = await supabase
        .from('filings')
        .select(`
          id,
          company_id,
          fiscal_year,
          extraction_status,
          pdf_stored_path,
          created_at,
          companies (name, rcs_number)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const processedItems: ProcessingItem[] = (filings || []).map((f) => {
        // Derive filename from path (e.g., "uploads/abc123/doc.pdf" -> "doc.pdf")
        const filename = f.pdf_stored_path
          ? f.pdf_stored_path.split('/').pop() || 'document.pdf'
          : 'document.pdf';

        return {
          id: f.id,
          company_id: f.company_id || '',
          company_name: (f.companies as { name: string } | null)?.name || 'Unknown',
          rcs_number: (f.companies as { rcs_number: string } | null)?.rcs_number || '',
          fiscal_year: f.fiscal_year,
          extraction_status: f.extraction_status || 'pending',
          pdf_stored_path: f.pdf_stored_path,
          pdf_filename: filename,
          created_at: f.created_at,
          progress: f.extraction_status === 'extracting' ? 60 :
                    f.extraction_status === 'analysing' ? 80 :
                    f.extraction_status === 'completed' ? 100 : 0,
        };
      });

      setItems(processedItems);

      const newStats: ProcessingStats = {
        pending: processedItems.filter((i) => i.extraction_status === 'pending').length,
        extracting: processedItems.filter((i) => i.extraction_status === 'extracting').length,
        analysing: processedItems.filter((i) => i.extraction_status === 'analysing').length,
        completed: processedItems.filter((i) => i.extraction_status === 'completed').length,
        failed: processedItems.filter((i) => i.extraction_status === 'failed').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching processing queue:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProcessingQueue();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchProcessingQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchProcessingQueue]);

  const triggerExtraction = async (filingId: string) => {
    setProcessingIds(prev => new Set(prev).add(filingId));
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      await fetchProcessingQueue();
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(filingId);
        return next;
      });
    }
  };

  const cancelProcessing = async (filingId: string) => {
    try {
      await supabase
        .from('filings')
        .update({ extraction_status: 'pending' })
        .eq('id', filingId);
      await fetchProcessingQueue();
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const deleteItem = async (filingId: string) => {
    try {
      await supabase.from('filings').delete().eq('id', filingId);
      await fetchProcessingQueue();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const processAllPending = async () => {
    setBulkProcessing(true);
    const pendingItems = items.filter(
      (i) => i.extraction_status === 'pending' && i.pdf_stored_path
    );

    for (const item of pendingItems) {
      await triggerExtraction(item.id);
    }
    setBulkProcessing(false);
  };

  const retryAllFailed = async () => {
    setBulkProcessing(true);
    const failedItems = items.filter((i) => i.extraction_status === 'failed');

    for (const item of failedItems) {
      await triggerExtraction(item.id);
    }
    setBulkProcessing(false);
  };

  const clearCompleted = async () => {
    try {
      const completedIds = items
        .filter((i) => i.extraction_status === 'completed')
        .map((i) => i.id);

      if (completedIds.length > 0) {
        await supabase.from('filings').delete().in('id', completedIds);
        await fetchProcessingQueue();
      }
    } catch (error) {
      console.error('Clear completed error:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1e3a5f]" />
          <p className="text-slate-600">Loading processing queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Processing Queue</h1>
          <p className="text-slate-500 mt-1">
            Monitor document extraction and analysis progress
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchProcessingQueue}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={cn(
          'border-0 shadow-sm rounded-xl transition-all',
          stats.pending > 0 && 'ring-2 ring-gray-200'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-0 shadow-sm rounded-xl transition-all',
          stats.extracting > 0 && 'ring-2 ring-blue-200'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Loader2 className={cn('h-5 w-5 text-blue-600', stats.extracting > 0 && 'animate-spin')} />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.extracting}</p>
                <p className="text-xs text-gray-500">Extracting</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-0 shadow-sm rounded-xl transition-all',
          stats.analysing > 0 && 'ring-2 ring-purple-200'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className={cn('h-5 w-5 text-purple-600', stats.analysing > 0 && 'animate-pulse')} />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.analysing}</p>
                <p className="text-xs text-gray-500">Analysing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-0 shadow-sm rounded-xl transition-all',
          stats.failed > 0 && 'ring-2 ring-red-200'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={processAllPending}
          disabled={stats.pending === 0 || bulkProcessing}
          className="bg-[#1e3a5f] hover:bg-[#2a4a6f]"
        >
          <Play className="h-4 w-4 mr-2" />
          Process All Pending
        </Button>
        <Button
          variant="outline"
          onClick={retryAllFailed}
          disabled={stats.failed === 0 || bulkProcessing}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry All Failed
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={stats.completed === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Completed
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Completed Items?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {stats.completed} completed items from the queue.
                The extracted data will remain in the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearCompleted}>
                Clear Completed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Queue Table */}
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Processing Queue
          </CardTitle>
          <CardDescription>
            Auto-refreshes every 10 seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">File Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Company</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Uploaded</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm w-40">Progress</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const statusConfig = STATUS_CONFIG[item.extraction_status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;
                    const isProcessing = processingIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'border-b hover:bg-[#1e3a5f]/5 transition-colors',
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                              {item.pdf_filename || 'document.pdf'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#1e3a5f]" />
                            <div>
                              <Link
                                href={`/companies/${item.company_id}`}
                                className="text-sm font-medium text-[#1e3a5f] hover:underline"
                              >
                                {item.company_name}
                              </Link>
                              <p className="text-xs text-gray-500">{item.rcs_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {formatTimeAgo(item.created_at)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}
                          >
                            <StatusIcon
                              className={cn(
                                'h-3 w-3 mr-1',
                                statusConfig.animate && 'animate-spin'
                              )}
                            />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {item.extraction_status === 'pending' ? (
                            <span className="text-sm text-gray-400">--</span>
                          ) : item.extraction_status === 'failed' ? (
                            <span className="text-sm text-red-500">--</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    item.extraction_status === 'completed'
                                      ? 'bg-emerald-500'
                                      : item.extraction_status === 'analysing'
                                      ? 'bg-purple-500 animate-pulse'
                                      : 'bg-blue-500 animate-pulse'
                                  )}
                                  style={{ width: `${item.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">
                                {item.progress}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {/* View - for completed */}
                            {item.extraction_status === 'completed' && (
                              <Button size="sm" variant="ghost" asChild title="View Company">
                                <Link href={`/companies/${item.company_id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}

                            {/* Retry - for failed */}
                            {item.extraction_status === 'failed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => triggerExtraction(item.id)}
                                disabled={isProcessing}
                                title="Retry"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            {/* Process - for pending */}
                            {item.extraction_status === 'pending' && item.pdf_stored_path && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => triggerExtraction(item.id)}
                                disabled={isProcessing}
                                title="Start Processing"
                                className="text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            {/* Cancel - for extracting/analysing */}
                            {(item.extraction_status === 'extracting' || item.extraction_status === 'analysing') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelProcessing(item.id)}
                                title="Cancel"
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Delete - always available */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Delete"
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove &quot;{item.pdf_filename}&quot; from the queue.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteItem(item.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">No files in queue</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload financial accounts to get started
              </p>
              <Button className="mt-4 bg-[#1e3a5f] hover:bg-[#2a4a6f]" asChild>
                <Link href="/upload">
                  <Zap className="h-4 w-4 mr-2" />
                  Upload Files
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-0 shadow-lg border-l-4 border-l-[#d4a853]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-[#d4a853] flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-[#1e3a5f]">Processing Tips</p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>
                  <span className="font-medium">Extracting:</span> AI reads PDF content and extracts financial data
                </li>
                <li>
                  <span className="font-medium">Analysing:</span> AI scores the company for TP opportunity potential
                </li>
                <li>
                  <span className="font-medium">Failed:</span> Usually due to scanned PDFs - try a text-based PDF
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
