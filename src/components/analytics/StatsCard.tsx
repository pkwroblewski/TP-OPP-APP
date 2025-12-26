'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const VARIANTS = {
  default: {
    card: 'bg-white',
    icon: 'bg-gray-100 text-gray-600',
    value: 'text-[#1e3a5f]',
  },
  primary: {
    card: 'bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] text-white',
    icon: 'bg-white/20 text-white',
    value: 'text-white',
  },
  success: {
    card: 'bg-white',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-600',
  },
  warning: {
    card: 'bg-white',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-600',
  },
  danger: {
    card: 'bg-white',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-600',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}: StatsCardProps) {
  const styles = VARIANTS[variant];

  return (
    <Card className={cn('shadow-tp border-0 rounded-xl', styles.card)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', styles.icon)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
            <p className={cn(
              'text-sm',
              variant === 'primary' ? 'text-white/80' : 'text-gray-500'
            )}>
              {title}
            </p>
            {subtitle && (
              <p className={cn(
                'text-xs',
                variant === 'primary' ? 'text-white/60' : 'text-gray-400'
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
