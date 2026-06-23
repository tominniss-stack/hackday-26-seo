'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, TrendingUp, Globe } from 'lucide-react';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface ReportEditorOffsiteMetricsProps {
  metrics: UnifiedMetrics;
}

export function ReportEditorOffsiteMetrics({ metrics }: ReportEditorOffsiteMetricsProps) {
  const offsiteMetrics = [
    {
      label: 'Total Backlinks',
      value: metrics.seranking_total_backlinks?.toLocaleString() ?? '—',
      icon: Link2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Domain Trust',
      value: metrics.seranking_domain_trust ?? '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Referring Domains',
      value: metrics.seranking_referring_domains?.toLocaleString() ?? '—',
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const hasData =
    metrics.seranking_total_backlinks !== undefined &&
    metrics.seranking_total_backlinks !== null;

  const headerStatus = hasData ? 'Live data synced' : 'Data unavailable';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Authority & Off-Site (SE Ranking)</CardTitle>
        <p className={`text-xs mt-1 ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
          {headerStatus}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {offsiteMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className={`p-3 rounded-lg ${metric.bgColor}`}>
                <div className="flex flex-col items-center text-center gap-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">{metric.label}</p>
                    <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 rounded-lg border bg-slate-50 border-slate-200">
          <p className="text-xs text-center text-slate-600">
            {hasData
              ? 'Live data synced from the SE Ranking API.'
              : 'SE Ranking data unavailable. Configure the endpoint URL or project ID, then click "Sync Live Data". No fallback figures are shown.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
