'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Loader2,
  FileCheck,
  FileX,
  ArrowRight,
  Zap,
  TrendingUp,
  Building2,
} from 'lucide-react';

interface ProcessingItem {
  id: string;
  company_id: string;
  company_name: string;
  rcs_number: string;
  fiscal_year: number;
  extraction_status: string;
  pdf_stored_path: string | null;
  created_at: string;
}

interface ProcessingStats {
  total: number;
  pending: number;
  extracting: number;
  completed: number;
  failed: number;
  analysed: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-slate-100 text-slate-700', icon: Clock, label: 'Pending' },
  extracting: { color: 'bg-blue-100 text-blue-700', icon: Loader2, label: 'Extracting' },
  completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Extracted' },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Failed' },
  analysed: { color: 'bg-purple-100 text-purple-700', icon: Zap, label: 'Analysed' },
};

export default function ProcessingPage() {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    pending: 0,
    extracting: 0,
    completed: 0,
    failed: 0,
    analysed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState<string | null>(null);

  const supabase = createClient();

  const fetchProcessingQueue = useCallback(async () => {
    try {
      // Get filings with company info
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
        .limit(50);

      if (error) throw error;

      const processedItems: ProcessingItem[] = (filings || []).map((f) => ({
        id: f.id,
        company_id: f.company_id || '',
        company_name: (f.companies as { name: string } | null)?.name || 'Unknown',
        rcs_number: (f.companies as { rcs_number: string } | null)?.rcs_number || '',
        fiscal_year: f.fiscal_year,
        extraction_status: f.extraction_status || 'pending',
        pdf_stored_path: f.pdf_stored_path,
        created_at: f.created_at,
      }));

      setItems(processedItems);

      // Calculate stats
      const newStats: ProcessingStats = {
        total: processedItems.length,
        pending: processedItems.filter((i) => i.extraction_status === 'pending').length,
        extracting: processedItems.filter((i) => i.extraction_status === 'extracting').length,
        completed: processedItems.filter((i) => i.extraction_status === 'completed').length,
        failed: processedItems.filter((i) => i.extraction_status === 'failed').length,
        analysed: processedItems.filter((i) => i.extraction_status === 'analysed').length,
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

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchProcessingQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchProcessingQueue]);

  const triggerExtraction = async (filingId: string) => {
    setProcessing(filingId);
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

      // Refresh the queue
      await fetchProcessingQueue();
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Extraction failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const triggerAnalysis = async (companyId: string, fiscalYear: number) => {
    setAnalysing(companyId);
    try {
      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, fiscalYear }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.company_id === companyId && item.fiscal_year === fiscalYear
            ? { ...item, extraction_status: 'analysed' }
            : item
        )
      );

      // Refresh stats
      await fetchProcessingQueue();
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalysing(null);
    }
  };

  const processAllPending = async () => {
    const pendingItems = items.filter(
      (i) => i.extraction_status === 'pending' && i.pdf_stored_path
    );

    for (const item of pendingItems) {
      await triggerExtraction(item.id);
    }
  };

  const analyzeAllCompleted = async () => {
    const completedItems = items.filter((i) => i.extraction_status === 'completed');

    for (const item of completedItems) {
      await triggerAnalysis(item.company_id, item.fiscal_year);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completionRate = stats.total > 0
    ? Math.round(((stats.completed + stats.analysed) / stats.total) * 100)
    : 0;

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Processing Queue</h1>
          <p className="text-slate-500 mt-1">
            Monitor and manage document extraction and analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchProcessingQueue}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={processAllPending}
            disabled={stats.pending === 0 || processing !== null}
            className="bg-[#1e3a5f] hover:bg-[#2a4a6f]"
          >
            <Zap className="h-4 w-4 mr-2" />
            Process All Pending
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-[#1e3a5f]">{stats.total}</p>
            <p className="text-xs text-gray-500 font-medium">Total Files</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-gray-500 font-medium">Pending</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Loader2 className={`h-5 w-5 text-blue-600 ${stats.extracting > 0 ? 'animate-spin' : ''}`} />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.extracting}</p>
            <p className="text-xs text-gray-500 font-medium">Extracting</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-xs text-gray-500 font-medium">Extracted</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.analysed}</p>
            <p className="text-xs text-gray-500 font-medium">Analysed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-2">
              <FileX className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-gray-500 font-medium">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-[#1e3a5f]">Overall Progress</p>
            <p className="text-sm text-slate-500">{completionRate}% Complete</p>
          </div>
          <Progress value={completionRate} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>{stats.completed + stats.analysed} processed</span>
            <span>{stats.pending} pending</span>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions for Completed */}
      {stats.completed > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Ready for Analysis</p>
                  <p className="text-white/80 text-sm">
                    {stats.completed} companies have extracted data ready for TP analysis
                  </p>
                </div>
              </div>
              <Button
                onClick={analyzeAllCompleted}
                disabled={analysing !== null}
                className="bg-white text-[#1e3a5f] hover:bg-white/90"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyze All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Queue List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1e3a5f]">
            Recent Files
          </CardTitle>
          <CardDescription>Latest uploaded and processed files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => {
              const statusConfig = STATUS_CONFIG[item.extraction_status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const isProcessing = processing === item.id;
              const isAnalysing = analysing === item.company_id;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#1e3a5f]" />
                    </div>
                    <div>
                      <Link
                        href={`/companies/${item.company_id}`}
                        className="font-medium text-[#1e3a5f] hover:underline"
                      >
                        {item.company_name}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{item.rcs_number}</span>
                        <span>|</span>
                        <span>FY {item.fiscal_year}</span>
                        <span>|</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusConfig.color}>
                      <StatusIcon className={`h-3 w-3 mr-1 ${item.extraction_status === 'extracting' ? 'animate-spin' : ''}`} />
                      {statusConfig.label}
                    </Badge>

                    {item.extraction_status === 'pending' && item.pdf_stored_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerExtraction(item.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            Extract
                          </>
                        )}
                      </Button>
                    )}

                    {item.extraction_status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => triggerAnalysis(item.company_id, item.fiscal_year)}
                        disabled={isAnalysing}
                        className="bg-[#1e3a5f] hover:bg-[#2a4a6f]"
                      >
                        {isAnalysing ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Analyze
                          </>
                        )}
                      </Button>
                    )}

                    {item.extraction_status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerExtraction(item.id)}
                        disabled={isProcessing}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}

                    {item.extraction_status === 'analysed' && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/companies/${item.company_id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No files in queue</p>
                <p className="text-sm text-slate-400 mt-1">
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
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-0 shadow-lg border-l-4 border-l-[#d4a853]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-[#d4a853] flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium text-[#1e3a5f]">Processing Tips</p>
              <ul className="text-sm text-slate-600 mt-2 space-y-1">
                <li>
                  <span className="font-medium">Extraction:</span> AI reads PDF content and extracts financial data and IC transactions
                </li>
                <li>
                  <span className="font-medium">Analysis:</span> AI scores the company for TP opportunity potential and generates recommendations
                </li>
                <li>
                  <span className="font-medium">Failed files:</span> Usually due to scanned PDFs or non-standard formats - try re-uploading a text-based PDF
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
