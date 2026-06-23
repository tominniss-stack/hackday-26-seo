'use client';

import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthYearSelector } from './month-year-selector';
import { MetricCard } from './metric-card';
import { AnalystAnnotation } from './analyst-annotation';
import { TopPrioritiesCard } from '@/components/admin/top-priorities-card';
import { resolvePriorities, type ManualPriority } from '@/lib/priority-calculator';
import type { ChannelMetric, GscQuery, SerankingKeyword } from '@/lib/metrics-schema';

interface SEOViewProps {
  metrics: Record<string, unknown>;
  narrativeText: string;
  clientColor: string;
  reportingMonth: string;
}

/** Strip emojis from text for clean corporate headers */
function stripEmojis(text: string): string {
  return text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu,
    ''
  ).replace(/\s{2,}/g, ' ').trim();
}

interface SEOViewProps {
  metrics: Record<string, unknown>;
  narrativeText: string;
  clientColor: string;
  reportingMonth: string;
  visibleWidgets?: Record<string, boolean>;
  reportType?: 'monthly' | 'quarterly';
  manualPriorities?: ManualPriority[] | null;
}

export function SEOView({ metrics, narrativeText, clientColor, reportingMonth, visibleWidgets, reportType = 'monthly', manualPriorities }: SEOViewProps) {
  const isVisible = (key: string) => visibleWidgets?.[key] ?? true;

  const totalUrls = (metrics.total_urls as number) || 0;
  const nonIndexable = (metrics.non_indexable as number) || 0;
  const errors4xx = (metrics.client_errors_4xx as number) || 0;
  const errors5xx = (metrics.server_errors_5xx as number) || 0;
  const redirects3xx = (metrics.redirects_3xx as number) || 0;
  const missingH1 = (metrics.missing_h1 as number) || 0;

  // ─── Real data mapping (no mock constants) ───────────────────────────
  // Keyword movements come from SE Ranking tracked keywords.
  const keywordData = (metrics.seranking_keywords as SerankingKeyword[] | undefined) ?? [];

  // Traffic-by-channel table maps directly to GA4 channels.
  const trafficData = (metrics.ga4_channels as ChannelMetric[] | undefined) ?? [];

  // Month-on-month chart derives from real GA4 + GSC totals. We only render a
  // comparison when previous-period values are available on the payload.
  const gscQueries = (metrics.gsc_top_queries as GscQuery[] | undefined) ?? [];
  const totalImpressions = gscQueries.reduce((sum, q) => sum + (q.impressions || 0), 0);
  const momChartData = [
    {
      metric: 'Organic Sessions',
      current: (metrics.ga4_sessions as number) || 0,
      previous: (metrics.ga4_sessions_prev as number) || 0,
    },
    {
      metric: 'Active Users',
      current: (metrics.ga4_active_users as number) || 0,
      previous: (metrics.ga4_active_users_prev as number) || 0,
    },
    {
      metric: 'Impressions',
      current: totalImpressions,
      previous: (metrics.gsc_impressions_prev as number) || 0,
    },
  ];
  const hasMomData = momChartData.some((d) => d.current > 0);

  // Chart data
  const indexabilityData = [
    { name: 'Indexable', value: totalUrls - nonIndexable },
    { name: 'Non-Indexable', value: nonIndexable },
  ];

  const statusCodeData = [
    { name: '3xx Redirects', value: redirects3xx, fill: '#f59e0b' },
    { name: '4xx Errors', value: errors4xx, fill: '#ef4444' },
    { name: '5xx Errors', value: errors5xx, fill: '#dc2626' },
  ];

  // Clean narrative text of emojis
  const cleanNarrative = stripEmojis(narrativeText);

  return (
    <div className="space-y-8">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">SEO Performance</h1>
            {reportType === 'quarterly' && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-[10px] font-medium uppercase tracking-wider">
                Quarterly
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Technical health and organic visibility</p>
        </div>
        <MonthYearSelector reportingMonth={reportingMonth} />
      </div>

      {/* Top Actionable Priorities */}
      {isVisible('top_priorities') && (
        <TopPrioritiesCard priorities={resolvePriorities(metrics as any, manualPriorities)} clientColor={clientColor} />
      )}

      {/* Executive Summary */}
      {cleanNarrative && (
        <Card
          className="border-l-4"
          style={{ borderLeftColor: clientColor }}
        >
          <CardHeader>
            <CardTitle className="text-base">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-semibold prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-800">
              <ReactMarkdown>{cleanNarrative}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month-on-Month Performance */}
      {isVisible('mom_comparison') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Month-on-Month Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMomData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={momChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="previous" fill="#cbd5e1" name="Previous Month" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" fill={clientColor} name="Current Month" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
                No traffic data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Health Cards */}
      {isVisible('technical_health') && (
      <div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
          Technical Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total URLs" value={totalUrls} />
          <MetricCard label="Non-Indexable" value={nonIndexable} invertMoM />
          <MetricCard label="4xx Errors" value={errors4xx} invertMoM />
          <MetricCard label="5xx Errors" value={errors5xx} invertMoM />
          <MetricCard label="3xx Redirects" value={redirects3xx} />
          <MetricCard label="Missing H1" value={missingH1} invertMoM />
        </div>
      </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart — Indexability */}
        {isVisible('indexability_chart') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Indexability Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={indexabilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={(props: any) => {
                    const name = (props.name as string) ?? '';
                    const percent = (props.percent as number) ?? 0;
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }}
                >
                  <Cell fill={clientColor} />
                  <Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <AnalystAnnotation
              text={`The indexability ratio remains healthy at ${totalUrls > 0 ? Math.round(((totalUrls - nonIndexable) / totalUrls) * 100) : 0}%. Non-indexable pages are primarily paginated archive pages and intentional noindex tags on staging content.`}
              clientColor={clientColor}
            />
          </CardContent>
        </Card>
        )}

        {/* Bar Chart — Status Codes */}
        {isVisible('status_code_chart') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Code Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusCodeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <AnalystAnnotation
              text="3xx redirects are within acceptable range and primarily consist of legacy URL migrations. The 4xx errors have been flagged for review — most are orphaned blog posts that can be safely redirected or removed."
              clientColor={clientColor}
            />
          </CardContent>
        </Card>
        )}
      </div>

      {/* Top Keyword Movements */}
      {isVisible('keyword_movements') && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Keyword Movements (SE Ranking)</CardTitle>
        </CardHeader>
        <CardContent>
          {keywordData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-center">Position</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead className="text-center">Search Volume</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywordData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-slate-900">{row.keyword}</TableCell>
                    <TableCell className="text-center tabular-nums">{row.position}</TableCell>
                    <TableCell className="text-center">
                      {row.change > 0 ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0">
                          +{row.change}
                        </Badge>
                      ) : row.change < 0 ? (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 border-0">
                          {row.change}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-0">
                          —
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-slate-600">
                      {(row.volume ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500 font-mono truncate max-w-[200px]">
                      {row.url}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No SE Ranking keyword data available. Configure a target domain and sync to populate.
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Traffic by Channel */}
      {isVisible('traffic_channels') && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Traffic by Channel (GA4)</CardTitle>
        </CardHeader>
        <CardContent>
          {trafficData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-slate-900">{row.channel}</TableCell>
                    <TableCell className="text-center tabular-nums">{(row.sessions ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center tabular-nums">{(row.users ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No GA4 channel data available for this period
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
