'use client';

import { FileText, Loader2, CheckCircle2, AlertCircle, Upload, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';

interface UploadQueueProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

const statusConfig: Record<UploadStatus, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  idle: {
    label: 'Ready',
    description: 'Waiting to start upload',
    icon: <Upload className="h-5 w-5" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  uploading: {
    label: 'Uploading',
    description: 'Transferring file to server...',
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: 'text-[#1e3a5f]',
    bgColor: 'bg-[#1e3a5f]/10',
  },
  processing: {
    label: 'Processing',
    description: 'Extracting text from PDF...',
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  analyzing: {
    label: 'Analyzing',
    description: 'AI is analyzing financial data...',
    icon: <Sparkles className="h-5 w-5 animate-pulse" />,
    color: 'text-[#d4a853]',
    bgColor: 'bg-[#d4a853]/10',
  },
  complete: {
    label: 'Complete',
    description: 'File processed successfully!',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  error: {
    label: 'Error',
    description: 'Upload failed',
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
};

export function UploadQueue({ fileName, fileSize, progress, status, errorMessage }: UploadQueueProps) {
  const config = statusConfig[status];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate step progress
  const steps = [
    { id: 'upload', label: 'Upload', status: progress >= 30 ? 'complete' : status === 'uploading' ? 'active' : 'pending' },
    { id: 'process', label: 'Process', status: progress >= 60 ? 'complete' : status === 'processing' ? 'active' : 'pending' },
    { id: 'analyze', label: 'Analyze', status: progress >= 90 ? 'complete' : status === 'analyzing' ? 'active' : 'pending' },
    { id: 'done', label: 'Done', status: progress === 100 ? 'complete' : 'pending' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-tp border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1e3a5f]/5 to-[#d4a853]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bgColor, config.color)}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload Progress</h3>
              <p className="text-sm text-gray-500">{config.description}</p>
            </div>
          </div>
          <div className={cn('px-3 py-1 rounded-full text-sm font-medium', config.bgColor, config.color)}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* File info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] flex items-center justify-center shadow-sm">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{fileName}</p>
            <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#1e3a5f]">{progress}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress
            value={progress}
            className={cn(
              'h-3 rounded-full',
              status === 'error' ? '[&>div]:bg-red-500' : '[&>div]:bg-gradient-to-r [&>div]:from-[#1e3a5f] [&>div]:to-[#d4a853]'
            )}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    step.status === 'complete' && 'bg-emerald-500 text-white',
                    step.status === 'active' && 'bg-[#1e3a5f] text-white animate-pulse',
                    step.status === 'pending' && 'bg-gray-200 text-gray-400'
                  )}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-1.5 font-medium',
                  step.status === 'complete' && 'text-emerald-600',
                  step.status === 'active' && 'text-[#1e3a5f]',
                  step.status === 'pending' && 'text-gray-400'
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-16 mx-2 transition-colors duration-300',
                    steps[index + 1].status !== 'pending' ? 'bg-emerald-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error message */}
        {status === 'error' && errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Processing info */}
        {(status === 'processing' || status === 'analyzing') && (
          <div className="flex items-center gap-2 p-3 bg-[#1e3a5f]/5 text-[#1e3a5f] rounded-lg text-sm">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <span>
              {status === 'processing'
                ? 'Extracting text content from PDF document...'
                : 'Claude AI is analyzing Luxembourg GAAP annual accounts...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
