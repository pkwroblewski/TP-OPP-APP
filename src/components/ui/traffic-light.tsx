'use client';

import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types/database';

interface TrafficLightProps {
  level: RiskLevel | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const colorClasses: Record<RiskLevel, string> = {
  RED: 'bg-red-500',
  AMBER: 'bg-amber-500',
  GREEN: 'bg-emerald-500',
};

const labelText: Record<RiskLevel, string> = {
  RED: 'High',
  AMBER: 'Medium',
  GREEN: 'Low',
};

export function TrafficLight({
  level,
  size = 'md',
  showLabel = false,
  label,
  className,
}: TrafficLightProps) {
  if (!level) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div className={cn(sizeClasses[size], 'rounded-full bg-slate-300')} />
        {showLabel && (
          <span className="text-xs text-slate-400">N/A</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn(sizeClasses[size], 'rounded-full', colorClasses[level])} />
      {showLabel && (
        <span className={cn(
          'text-xs font-medium',
          level === 'RED' && 'text-red-600',
          level === 'AMBER' && 'text-amber-600',
          level === 'GREEN' && 'text-emerald-600',
        )}>
          {label || labelText[level]}
        </span>
      )}
    </div>
  );
}

// Compact row of 3 traffic lights for IC/TP/DOC
interface TrafficLightRowProps {
  icRisk: RiskLevel | null | undefined;
  tpRisk: RiskLevel | null | undefined;
  docRisk: RiskLevel | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function TrafficLightRow({
  icRisk,
  tpRisk,
  docRisk,
  size = 'sm',
  showLabels = false,
  className,
}: TrafficLightRowProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1">
        <TrafficLight level={icRisk} size={size} />
        {showLabels && <span className="text-[10px] text-slate-500">IC</span>}
      </div>
      <div className="flex items-center gap-1">
        <TrafficLight level={tpRisk} size={size} />
        {showLabels && <span className="text-[10px] text-slate-500">TP</span>}
      </div>
      <div className="flex items-center gap-1">
        <TrafficLight level={docRisk} size={size} />
        {showLabels && <span className="text-[10px] text-slate-500">DOC</span>}
      </div>
    </div>
  );
}

// Traffic light with tooltip showing reasons
interface TrafficLightWithReasonsProps {
  level: RiskLevel | null | undefined;
  reasons: string[] | null | undefined;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrafficLightWithReasons({
  level,
  reasons,
  label,
  size = 'md',
  className,
}: TrafficLightWithReasonsProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <TrafficLight level={level} size={size} showLabel />
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="text-[10px] text-slate-500 space-y-0.5 pl-3">
          {reasons.slice(0, 3).map((reason, i) => (
            <li key={i} className="list-disc">{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
