'use client';

import { Flag, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TPOpportunityFlag {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  estimatedValue: string;
  reference?: string;
}

interface TPOpportunitiesProps {
  flags: TPOpportunityFlag[];
  className?: string;
}

export function TPOpportunities({ flags, className }: TPOpportunitiesProps) {
  if (flags.length === 0) return null;

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          badge: 'bg-red-600 text-white',
          border: 'border-red-300',
          bg: 'bg-red-50',
        };
      case 'MEDIUM':
        return {
          badge: 'bg-orange-500 text-white',
          border: 'border-orange-300',
          bg: 'bg-orange-50',
        };
      default:
        return {
          badge: 'bg-yellow-500 text-white',
          border: 'border-yellow-300',
          bg: 'bg-yellow-50',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('RATE') || type.includes('SPREAD')) return TrendingUp;
    if (type.includes('THIN_CAP') || type.includes('RISK')) return AlertTriangle;
    if (type.includes('VALUE') || type.includes('MARGIN')) return DollarSign;
    return Flag;
  };

  return (
    <div className={cn('bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-6', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Flag className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-800">
          Transfer Pricing Opportunities ({flags.length})
        </h3>
      </div>
      <div className="space-y-3">
        {flags.map((flag, i) => {
          const styles = getPriorityStyles(flag.priority);
          const Icon = getTypeIcon(flag.type);
          return (
            <div
              key={i}
              className={cn(
                'bg-white rounded-lg border p-4',
                styles.border
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700">{flag.type.replace(/_/g, ' ')}</span>
                </div>
                <span className={cn('px-2 py-1 rounded text-xs font-bold', styles.badge)}>
                  {flag.priority} PRIORITY
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-2">{flag.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-slate-600">
                  <strong>Estimated Value:</strong> {flag.estimatedValue}
                </span>
              </div>
              {flag.reference && (
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Reference: {flag.reference}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TPOpportunities;
