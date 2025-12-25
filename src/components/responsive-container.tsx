'use client';

import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={cn('w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
}: ResponsiveGridProps) {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('grid gap-4 sm:gap-6', gridCols, className)}>
      {children}
    </div>
  );
}

// Hide/Show components based on breakpoints
interface ResponsiveProps {
  children: React.ReactNode;
  className?: string;
}

export function HideOnMobile({ children, className }: ResponsiveProps) {
  return <div className={cn('hidden sm:block', className)}>{children}</div>;
}

export function ShowOnMobile({ children, className }: ResponsiveProps) {
  return <div className={cn('block sm:hidden', className)}>{children}</div>;
}

export function HideOnDesktop({ children, className }: ResponsiveProps) {
  return <div className={cn('block lg:hidden', className)}>{children}</div>;
}

export function ShowOnDesktop({ children, className }: ResponsiveProps) {
  return <div className={cn('hidden lg:block', className)}>{children}</div>;
}
