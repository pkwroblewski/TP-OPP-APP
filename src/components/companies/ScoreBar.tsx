'use client';

import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): { bg: string; fill: string } {
  if (score >= 70) {
    return { bg: 'bg-emerald-100', fill: 'bg-emerald-500' };
  } else if (score >= 40) {
    return { bg: 'bg-amber-100', fill: 'bg-amber-500' };
  } else {
    return { bg: 'bg-gray-100', fill: 'bg-gray-400' };
  }
}

const sizeConfig = {
  sm: { height: 'h-1.5', width: 'w-16', text: 'text-xs' },
  md: { height: 'h-2', width: 'w-20', text: 'text-sm' },
  lg: { height: 'h-2.5', width: 'w-24', text: 'text-base' },
};

export function ScoreBar({ score, maxScore = 100, showValue = true, size = 'md' }: ScoreBarProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const colors = getScoreColor(score);
  const sizeStyles = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      {showValue && (
        <span className={cn('font-semibold text-gray-900 min-w-[2rem]', sizeStyles.text)}>
          {score}
        </span>
      )}
      <div className={cn('rounded-full overflow-hidden', colors.bg, sizeStyles.height, sizeStyles.width)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.fill)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const circleConfig = {
  sm: { size: 'w-8 h-8', text: 'text-xs' },
  md: { size: 'w-10 h-10', text: 'text-sm' },
  lg: { size: 'w-12 h-12', text: 'text-base' },
};

export function ScoreCircle({ score, size = 'md' }: ScoreCircleProps) {
  const colors = getScoreColor(score);
  const sizeStyles = circleConfig[size];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold',
        colors.bg,
        sizeStyles.size,
        sizeStyles.text,
        score >= 70 ? 'text-emerald-700' : score >= 40 ? 'text-amber-700' : 'text-gray-600'
      )}
    >
      {score}
    </div>
  );
}
