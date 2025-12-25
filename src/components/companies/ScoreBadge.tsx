import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  tier?: string | null;
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export function ScoreBadge({ tier, score, size = 'md', showScore = false }: ScoreBadgeProps) {
  if (!tier && score === undefined) return null;

  const displayTier = tier || (score !== null && score !== undefined
    ? score >= 80 ? 'A' : score >= 60 ? 'B' : 'C'
    : null);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const tierColors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    B: 'bg-amber-100 text-amber-700 border-amber-200',
    C: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const tierLabel = displayTier ? `Tier ${displayTier}` : 'Unscored';
  const colorClass = displayTier ? tierColors[displayTier] : 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all duration-200',
        sizeClasses[size],
        colorClass
      )}
    >
      {showScore && score !== null && score !== undefined && (
        <span className="font-bold">{score}</span>
      )}
      <span>{tierLabel}</span>
    </span>
  );
}
