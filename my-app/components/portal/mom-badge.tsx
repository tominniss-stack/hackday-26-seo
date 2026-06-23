'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MoMBadgeProps {
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  /** If true, "down" is shown as green (good for error counts, etc.) */
  invertColors?: boolean;
  size?: 'sm' | 'md';
}

export function MoMBadge({
  changePercent,
  direction,
  invertColors = false,
  size = 'sm',
}: MoMBadgeProps) {
  if (direction === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  const isPositive = invertColors ? direction === 'down' : direction === 'up';

  const colorClasses = isPositive
    ? 'text-emerald-700 bg-emerald-50'
    : 'text-red-700 bg-red-50';

  const Icon = direction === 'up' ? TrendingUp : TrendingDown;

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-xs px-2 py-1 gap-1';

  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colorClasses} ${sizeClasses}`}
    >
      <Icon className={iconSize} />
      {changePercent}%
    </span>
  );
}
