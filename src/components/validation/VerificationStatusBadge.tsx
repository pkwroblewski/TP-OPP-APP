'use client';

import { CheckCircle, AlertTriangle, HelpCircle, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidationWarning, TPOpportunityFlag } from './index';

export type VerificationStatus = 'verified' | 'unverified' | 'tp_opportunity' | 'unknown';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function getVerificationStatus(
  fieldName: string,
  source: string | null,
  warnings: ValidationWarning[],
  flags: TPOpportunityFlag[]
): VerificationStatus {
  const hasTPFlag = flags.some(f =>
    f.reference === fieldName || f.type.toLowerCase().includes(fieldName.toLowerCase())
  );
  if (hasTPFlag) return 'tp_opportunity';

  const hasWarning = warnings.some(w => w.field === fieldName);
  if (hasWarning) return 'unverified';

  if (source) return 'verified';

  return 'unknown';
}

export function VerificationStatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className
}: VerificationStatusBadgeProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const config = {
    verified: {
      icon: CheckCircle,
      label: 'Verified',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    unverified: {
      icon: AlertTriangle,
      label: 'Unverified',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    tp_opportunity: {
      icon: Flag,
      label: 'TP Opportunity',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    unknown: {
      icon: HelpCircle,
      label: 'Unknown',
      color: 'text-slate-400',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    },
  };

  const { icon: Icon, label, color, bg, border } = config[status];

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
      bg,
      border,
      className
    )}>
      <Icon className={cn(sizeClasses[size], color)} />
      {showLabel && (
        <span className={cn(labelSizeClasses[size], color, 'font-medium')}>
          {label}
        </span>
      )}
    </div>
  );
}

export default VerificationStatusBadge;
