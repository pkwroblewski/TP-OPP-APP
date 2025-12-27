'use client';

import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationWarning {
  field: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  details: string;
}

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
  className?: string;
}

export function ValidationWarnings({ warnings, className }: ValidationWarningsProps) {
  if (warnings.length === 0) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          text: 'text-red-800',
          label: 'text-red-600',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-500',
          text: 'text-amber-800',
          label: 'text-amber-600',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500',
          text: 'text-blue-800',
          label: 'text-blue-600',
        };
    }
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return AlertCircle;
      case 'MEDIUM':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  return (
    <div className={cn('bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 mb-6', className)}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-amber-800">
          Validation Warnings ({warnings.length})
        </h3>
      </div>
      <div className="space-y-3">
        {warnings.map((warning, i) => {
          const styles = getSeverityStyles(warning.severity);
          const Icon = getIcon(warning.severity);
          return (
            <div
              key={i}
              className={cn(
                'rounded-lg border p-3',
                styles.bg,
                styles.border
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold uppercase px-2 py-0.5 rounded', styles.label, styles.bg)}>
                      {warning.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{warning.field}</span>
                  </div>
                  <p className={cn('text-sm font-medium', styles.text)}>{warning.issue}</p>
                  <p className="text-xs text-slate-600 mt-1">{warning.details}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ValidationWarnings;
