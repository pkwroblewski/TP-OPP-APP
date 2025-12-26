'use client';

import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  tier: 'A' | 'B' | 'C' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  A: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: TrendingUp,
    label: 'Tier A',
  },
  B: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: AlertTriangle,
    label: 'Tier B',
  },
  C: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: Clock,
    label: 'Tier C',
  },
};

const sizeConfig = {
  sm: {
    wrapper: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    wrapper: 'px-2.5 py-1 text-xs gap-1.5',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    wrapper: 'px-3 py-1.5 text-sm gap-2',
    icon: 'h-4 w-4',
  },
};

export function PriorityBadge({ tier, size = 'md', showLabel = true }: PriorityBadgeProps) {
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.C;
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bg,
        config.text,
        config.border,
        sizeStyles.wrapper
      )}
    >
      <Icon className={sizeStyles.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function PriorityBadgeSimple({ tier }: { tier: 'A' | 'B' | 'C' | string }) {
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.C;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs',
        config.bg,
        config.text
      )}
    >
      {tier}
    </span>
  );
}
