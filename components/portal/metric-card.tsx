'use client';

import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { MoMBadge } from './mom-badge';
import { generateMoMChange } from '@/lib/mock-data';
import { METRIC_DESCRIPTIONS } from '@/lib/metric-descriptions';

interface MetricCardProps {
  label: string;
  value: number;
  /** If true, a decrease is shown as positive (green) */
  invertMoM?: boolean;
}

export function MetricCard({ label, value, invertMoM = false }: MetricCardProps) {
  const mom = generateMoMChange(value, label);
  const description = METRIC_DESCRIPTIONS[label];

  return (
    <Card className="relative">
      <CardContent className="pt-4 pb-4 text-center">
        {/* Info tooltip */}
        {description && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors" />
              }
            >
              <Info className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <p className="text-2xl font-bold text-slate-900 tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-slate-500 mt-1 mb-2">{label}</p>
        <MoMBadge
          changePercent={mom.changePercent}
          direction={mom.direction}
          invertColors={invertMoM}
        />
      </CardContent>
    </Card>
  );
}
