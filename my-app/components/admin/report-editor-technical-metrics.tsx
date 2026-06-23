'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, XCircle, RefreshCw, FileX, Link2, FileText } from 'lucide-react';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface TechnicalMetricsProps {
  metrics: UnifiedMetrics;
}

export function ReportEditorTechnicalMetrics({ metrics }: TechnicalMetricsProps) {
  const technicalIssues = [
    {
      label: 'Low Internal Links',
      value: metrics.low_internal_links || 0,
      icon: Link2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      priority: 'critical',
    },
    {
      label: '4xx Client Errors',
      value: metrics.client_errors_4xx || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      priority: 'critical',
    },
    {
      label: '5xx Server Errors',
      value: metrics.server_errors_5xx || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      priority: 'critical',
    },
    {
      label: 'Missing Meta Desc',
      value: metrics.missing_meta_descriptions || 0,
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      priority: 'medium',
    },
    {
      label: '3xx Redirects',
      value: metrics.redirects_3xx || 0,
      icon: RefreshCw,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      priority: 'medium',
    },
    {
      label: 'Non-Indexable',
      value: metrics.non_indexable || 0,
      icon: FileX,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      priority: 'low',
    },
  ];

  const totalUrls = metrics.total_urls || 0;
  const healthScore = totalUrls > 0 
    ? Math.max(0, 100 - ((metrics.client_errors_4xx || 0) + (metrics.server_errors_5xx || 0)) / totalUrls * 100)
    : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Technical Health (Screaming Frog)</CardTitle>
          <div className="text-right">
            <p className="text-xs text-slate-500">Health Score</p>
            <p className={`text-lg font-bold ${
              healthScore >= 90 ? 'text-emerald-600' :
              healthScore >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {healthScore.toFixed(0)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {technicalIssues.map((issue, idx) => {
              const Icon = issue.icon;
              return (
                <div key={idx} className={`p-3 rounded-lg ${issue.bgColor}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${issue.color}`} />
                    <p className="text-xs font-medium text-slate-700">{issue.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${issue.color}`}>
                    {issue.value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total URLs Crawled</span>
              <span className="font-semibold text-slate-900">{totalUrls.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
