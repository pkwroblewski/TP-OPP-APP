'use client';

import { CheckCircle, AlertCircle, HelpCircle, Shield, FileCheck, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExtractionQuality {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  allSourced: boolean;
  crossValidated?: boolean;
  notesCovered?: number;
}

interface ExtractionQualityBadgeProps {
  quality: ExtractionQuality;
  className?: string;
}

export function ExtractionQualityBadge({ quality, className }: ExtractionQualityBadgeProps) {
  const getConfidenceStyles = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500',
          text: 'text-white',
        };
      default:
        return {
          bg: 'bg-red-500',
          text: 'text-white',
        };
    }
  };

  const confidenceStyles = getConfidenceStyles(quality.confidence);

  return (
    <div className={cn('flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200', className)}>
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-slate-700">Extraction Quality:</span>
        <span className={cn('px-3 py-1 rounded font-semibold text-sm', confidenceStyles.bg, confidenceStyles.text)}>
          {quality.confidence}
        </span>
      </div>

      <div className="h-4 w-px bg-blue-200" />

      <div className="flex items-center gap-2">
        {quality.allSourced ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700 text-sm">All values sourced</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-700 text-sm">Some values missing sources</span>
          </>
        )}
      </div>

      <div className="h-4 w-px bg-blue-200" />

      <div className="flex items-center gap-2">
        {quality.crossValidated ? (
          <>
            <GitMerge className="h-4 w-4 text-green-600" />
            <span className="text-green-700 text-sm">Cross-validated</span>
          </>
        ) : (
          <>
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500 text-sm">Not cross-validated</span>
          </>
        )}
      </div>

      {quality.notesCovered !== undefined && (
        <>
          <div className="h-4 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-600" />
            <span className="text-slate-600 text-sm">{quality.notesCovered} notes parsed</span>
          </div>
        </>
      )}
    </div>
  );
}

export default ExtractionQualityBadge;
