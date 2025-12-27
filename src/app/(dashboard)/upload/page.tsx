'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  X,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface RecentUpload {
  id: string;
  original_filename: string | null;
  extraction_status: string;
  detected_company_name: string | null;
  confirmed_company_id: string | null;
  created_at: string;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

// ============================================
// Constants
// ============================================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const fiscalYears = [
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
];

// ============================================
// Helper Functions
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function getStatusDisplay(status: string): { label: string; color: string; icon: React.ReactNode } {
  switch (status) {
    case 'completed':
      return { label: 'Complete', color: 'text-green-600', icon: <Check className="h-4 w-4" /> };
    case 'processing':
    case 'extracting':
      return { label: 'Processing', color: 'text-amber-600', icon: <Loader2 className="h-4 w-4 animate-spin" /> };
    case 'failed':
      return { label: 'Failed', color: 'text-red-600', icon: <AlertCircle className="h-4 w-4" /> };
    default:
      return { label: 'Pending', color: 'text-slate-500', icon: <Clock className="h-4 w-4" /> };
  }
}

// ============================================
// Main Component
// ============================================

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [rcsNumber, setRcsNumber] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedCompanyId, setUploadedCompanyId] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);

  // Fetch recent uploads
  const fetchRecentUploads = useCallback(async () => {
    const { data } = await supabase
      .from('uploaded_files')
      .select('id, original_filename, extraction_status, detected_company_name, confirmed_company_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentUploads(data);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRecentUploads();
  }, [fetchRecentUploads]);

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadError(null);
      setUploadStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: uploadStatus === 'uploading' || uploadStatus === 'processing',
  });

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (companyName) formData.append('companyName', companyName);
      if (rcsNumber) formData.append('rcsNumber', rcsNumber);
      if (fiscalYear) formData.append('fiscalYear', fiscalYear);

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus('processing');

      // Trigger extraction
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: result.data.fileId }),
      });

      const extractResult = await extractResponse.json();

      if (!extractResponse.ok) {
        throw new Error(extractResult.error || 'Extraction failed');
      }

      setUploadStatus('complete');
      setUploadedCompanyId(extractResult.data?.companyId);

      // Refresh recent uploads
      await fetchRecentUploads();

      // Reset form after a delay
      setTimeout(() => {
        setSelectedFile(null);
        setCompanyName('');
        setRcsNumber('');
        setFiscalYear('');
      }, 2000);

    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedFile(null);
    setCompanyName('');
    setRcsNumber('');
    setFiscalYear('');
    setUploadStatus('idle');
    setUploadError(null);
    setUploadedCompanyId(null);
  };

  // Delete upload
  const handleDeleteUpload = async (uploadId: string) => {
    try {
      // Get the file path first
      const { data: file } = await supabase
        .from('uploaded_files')
        .select('file_path, batch_id')
        .eq('id', uploadId)
        .single();

      if (file?.file_path) {
        // Delete from storage
        await supabase.storage
          .from('financial-accounts')
          .remove([file.file_path]);
      }

      // Delete the file record
      await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', uploadId);

      // Refresh the list
      await fetchRecentUploads();
    } catch (err) {
      console.error('Failed to delete upload:', err);
    }
  };

  // Retry extraction for failed/pending uploads
  const handleRetryExtraction = async (uploadId: string) => {
    try {
      // Update status to extracting
      await supabase
        .from('uploaded_files')
        .update({ extraction_status: 'extracting' })
        .eq('id', uploadId);

      // Trigger extraction
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: uploadId }),
      });

      if (!extractResponse.ok) {
        const result = await extractResponse.json();
        throw new Error(result.error || 'Extraction failed');
      }

      // Refresh the list
      await fetchRecentUploads();
    } catch (err) {
      console.error('Failed to retry extraction:', err);
      // Mark as failed
      await supabase
        .from('uploaded_files')
        .update({ extraction_status: 'failed' })
        .eq('id', uploadId);
      await fetchRecentUploads();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Financial Accounts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload Luxembourg annual accounts in PDF format for analysis
        </p>
      </div>

      {/* Success State */}
      {uploadStatus === 'complete' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Upload complete!</p>
                <p className="text-xs text-green-600">Analysis has started</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Upload Another
              </Button>
              {uploadedCompanyId && (
                <Button size="sm" onClick={() => router.push(`/companies/${uploadedCompanyId}`)}>
                  View Company <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {uploadStatus === 'error' && uploadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Upload failed</p>
              <p className="text-xs text-red-600">{uploadError}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400',
            (uploadStatus === 'uploading' || uploadStatus === 'processing') && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-700">
                  Drop PDF files here or <span className="text-blue-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Luxembourg annual accounts (PDF, max 50MB)</p>
              </div>
            </div>
          )}
        </div>

        {/* Optional Details */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-medium mb-4">
            Optional Details (Claude will auto-detect if left blank)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-xs text-slate-600">
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="Auto-detect"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rcsNumber" className="text-xs text-slate-600">
                RCS Number
              </Label>
              <Input
                id="rcsNumber"
                placeholder="B123456"
                value={rcsNumber}
                onChange={(e) => setRcsNumber(e.target.value)}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Fiscal Year</Label>
              <Select
                value={fiscalYear}
                onValueChange={setFiscalYear}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalYears.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mt-6">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing'}
            className="w-full h-10"
          >
            {uploadStatus === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : uploadStatus === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Recent Uploads */}
      {recentUploads.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Uploads</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentUploads.map((upload) => {
              const status = getStatusDisplay(upload.extraction_status);
              return (
                <div key={upload.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">{upload.original_filename || 'Unnamed file'}</p>
                      <p className="text-xs text-slate-500">
                        {upload.detected_company_name || 'Processing...'} &middot; {formatTimeAgo(upload.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn('flex items-center gap-1.5 text-xs font-medium', status.color)}>
                      {status.icon}
                      {status.label}
                    </div>
                    {/* Retry button for failed or pending uploads */}
                    {(upload.extraction_status === 'failed' || upload.extraction_status === 'pending') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-blue-600"
                        onClick={() => handleRetryExtraction(upload.id)}
                        title="Retry extraction"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {/* View button for completed uploads */}
                    {upload.extraction_status === 'completed' && upload.confirmed_company_id && (
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/companies/${upload.confirmed_company_id}`}>View</Link>
                      </Button>
                    )}
                    {/* Delete button for all uploads */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDeleteUpload(upload.id)}
                      title="Delete upload"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
