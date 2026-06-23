'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface TrafficChartsProps {
  metrics: UnifiedMetrics;
}

export function ReportEditorTrafficCharts({ metrics }: TrafficChartsProps) {
  // GA4 Channel data
  const channelData = metrics.ga4_channels?.slice(0, 5).map(ch => ({
    name: ch.channel,
    sessions: ch.sessions,
    users: ch.users,
  })) || [];

  // GSC Top Queries data
  const queryData = metrics.gsc_top_queries?.slice(0, 5).map(q => ({
    name: q.query.length > 20 ? q.query.substring(0, 20) + '...' : q.query,
    clicks: q.clicks,
    impressions: q.impressions,
  })) || [];

  return (
    <div className="space-y-4">
      {/* GA4 Traffic by Channel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">GA4 Traffic by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
              No GA4 channel data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* GSC Top Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">GSC Top Queries</CardTitle>
        </CardHeader>
        <CardContent>
          {queryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={queryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
              No GSC query data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
