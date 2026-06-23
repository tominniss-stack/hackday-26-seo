'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface KPISummaryProps {
  metrics: UnifiedMetrics;
}

interface KPIItem {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function ReportEditorKPISummary({ metrics }: KPISummaryProps) {
  // Coerce any value to a finite number so a malformed query row never yields NaN.
  const safeNum = (v: unknown): number => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Calculate total GSC clicks from top queries (NaN-safe)
  const queries = metrics.gsc_top_queries ?? [];
  const totalClicks = queries.reduce((sum, q) => sum + safeNum(q?.clicks), 0);
  const totalImpressions = queries.reduce((sum, q) => sum + safeNum(q?.impressions), 0);
  const avgPosition = queries.length
    ? queries.reduce((sum, q) => sum + safeNum(q?.position), 0) / queries.length
    : 0;

  const indexablePages = Math.max(0, safeNum(metrics.total_urls) - safeNum(metrics.non_indexable));

  const kpis: KPIItem[] = [
    {
      label: 'GA4 Sessions',
      value: safeNum(metrics.ga4_sessions).toLocaleString(),
      trend: 'neutral',
    },
    {
      label: 'GSC Clicks',
      value: totalClicks.toLocaleString(),
      trend: 'neutral',
    },
    {
      label: 'Avg. Position',
      value: avgPosition > 0 ? avgPosition.toFixed(1) : '0.0',
      trend: 'neutral',
    },
    {
      label: 'Indexable Pages',
      value: indexablePages.toLocaleString(),
      trend: 'neutral',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                {kpi.label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight tabular-nums text-slate-900">{kpi.value}</p>
                {kpi.change !== undefined && kpi.change !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-emerald-600' :
                    kpi.trend === 'down' ? 'text-red-600' :
                    'text-slate-400'
                  }`}>
                    {kpi.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {kpi.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    {kpi.trend === 'neutral' && <Minus className="h-3 w-3" />}
                    <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
