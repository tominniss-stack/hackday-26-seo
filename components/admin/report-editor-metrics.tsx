'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MetricDrillDownDialog } from './metric-drill-down-dialog';
import type { UnifiedMetrics, UrlEntry } from '@/lib/metrics-schema';

type FilterType = '4xx' | '5xx' | '3xx' | 'non_indexable' | 'missing_h1';

interface DrillDownStat {
  label: string;
  value: number;
  urls?: UrlEntry[];
  dialogTitle?: string;
  filterType?: FilterType;
  badgeVariant?: 'destructive' | 'secondary' | 'default';
}

interface ReportEditorMetricsProps {
  metrics: UnifiedMetrics;
}

export function ReportEditorMetrics({ metrics }: ReportEditorMetricsProps) {
  const storagePath = metrics.raw_sf_storage_path;

  const techStats: DrillDownStat[] = [
    { label: 'Total URLs', value: metrics.total_urls ?? 0 },
    {
      label: 'Non-Indexable',
      value: metrics.non_indexable ?? 0,
      urls: metrics.urls_non_indexable,
      dialogTitle: 'Non-Indexable Pages',
      filterType: 'non_indexable',
      badgeVariant: 'secondary',
    },
    {
      label: '4xx Errors',
      value: metrics.client_errors_4xx ?? 0,
      urls: metrics.urls_4xx,
      dialogTitle: '4xx Client Errors',
      filterType: '4xx',
      badgeVariant: 'destructive',
    },
    {
      label: '5xx Errors',
      value: metrics.server_errors_5xx ?? 0,
      urls: metrics.urls_5xx,
      dialogTitle: '5xx Server Errors',
      filterType: '5xx',
      badgeVariant: 'destructive',
    },
    {
      label: '3xx Redirects',
      value: metrics.redirects_3xx ?? 0,
      urls: metrics.urls_3xx,
      dialogTitle: '3xx Redirect Chains',
      filterType: '3xx',
      badgeVariant: 'secondary',
    },
    {
      label: 'Missing H1',
      value: metrics.missing_h1 ?? 0,
      urls: metrics.urls_missing_h1,
      dialogTitle: 'Pages Missing H1 Tag',
      filterType: 'missing_h1',
      badgeVariant: 'secondary',
    },
  ];

  const hasGA4 = metrics.ga4_sessions !== undefined;
  const hasGSC = metrics.gsc_top_queries && metrics.gsc_top_queries.length > 0;

  return (
    <div className="space-y-4">
      {/* Technical Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Technical Health (Screaming Frog)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {techStats.map((s) => {
              const card = (
                <div
                  key={s.label}
                  className={`text-center rounded-lg p-2 transition-colors ${
                    s.urls && s.urls.length > 0
                      ? 'hover:bg-slate-50 cursor-pointer ring-1 ring-transparent hover:ring-slate-200'
                      : ''
                  }`}
                >
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{s.value.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                  {s.urls && s.urls.length > 0 && (
                    <p className="text-[9px] text-blue-500 mt-0.5">Click to drill down</p>
                  )}
                </div>
              );

              if (s.urls && s.urls.length > 0 && s.dialogTitle) {
                return (
                  <MetricDrillDownDialog
                    key={s.label}
                    title={s.dialogTitle}
                    count={s.value}
                    urls={s.urls}
                    storagePath={storagePath}
                    filterType={s.filterType}
                    badgeVariant={s.badgeVariant}
                  >
                    {card}
                  </MetricDrillDownDialog>
                );
              }
              return card;
            })}
          </div>
        </CardContent>
      </Card>

      {/* GA4 Traffic */}
      {hasGA4 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              GA4 Traffic
              <span className="ml-2 text-[10px] font-normal text-slate-400">
                {metrics.ga4_sessions?.toLocaleString()} sessions · {metrics.ga4_active_users?.toLocaleString()} active users
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.ga4_channels && metrics.ga4_channels.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.ga4_channels.map((ch, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{ch.channel}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{ch.sessions.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{ch.users.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-xs text-slate-400">No channel breakdown available.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* GSC Queries */}
      {hasGSC && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top GSC Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">CTR</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.gsc_top_queries!.slice(0, 10).map((q, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{q.query}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{q.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{q.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">{(q.ctr * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">{q.position.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!hasGA4 && !hasGSC && (
        <p className="text-xs text-slate-400 italic">No GA4 or GSC data available. Use Auto-Sync or upload CSVs to populate.</p>
      )}
    </div>
  );
}
