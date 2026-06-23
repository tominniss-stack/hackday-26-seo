import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UnifiedMetrics } from '@/lib/metrics-schema';
import { fetchSERankingMetrics } from '@/lib/se-ranking-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface SyncResult {
  method: 'api' | 'skipped';
  reason?: string;
  data?: Partial<UnifiedMetrics>;
}

async function syncGA4(propertyId: string, startDate: string, endDate: string): Promise<SyncResult> {
  const credentialsB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsB64) {
    return { method: 'skipped', reason: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' };
  }

  try {
    const credentials = JSON.parse(Buffer.from(credentialsB64, 'base64').toString('utf-8'));
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    const analyticsClient = new BetaAnalyticsDataClient({ credentials });

    const [response] = await analyticsClient.runReport({
      property: propertyId,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    });

    let totalSessions = 0;
    let totalUsers = 0;
    const channels: { channel: string; sessions: number; users: number }[] = [];

    for (const row of response.rows ?? []) {
      const channel = row.dimensionValues?.[0]?.value ?? 'Unknown';
      const sessions = parseInt(row.metricValues?.[0]?.value ?? '0', 10);
      const users = parseInt(row.metricValues?.[1]?.value ?? '0', 10);
      totalSessions += sessions;
      totalUsers += users;
      channels.push({ channel, sessions, users });
    }

    channels.sort((a, b) => b.sessions - a.sessions);

    return {
      method: 'api',
      data: {
        ga4_sessions: totalSessions,
        ga4_active_users: totalUsers,
        ga4_channels: channels.slice(0, 10),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GA4 sync error:', message);
    return { method: 'skipped', reason: `GA4 API error: ${message}` };
  }
}

async function syncGSC(siteUrl: string, startDate: string, endDate: string): Promise<SyncResult> {
  const credentialsB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsB64) {
    return { method: 'skipped', reason: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' };
  }

  try {
    const credentials = JSON.parse(Buffer.from(credentialsB64, 'base64').toString('utf-8'));
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const res = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 20,
      },
    });

    const queries = (res.data.rows ?? []).map((row) => ({
      query: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));

    return { method: 'api', data: { gsc_top_queries: queries } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GSC sync error:', message);
    return { method: 'skipped', reason: `GSC API error: ${message}` };
  }
}

async function syncSERanking(
  domain: string,
  apiKey?: string,
  endpointUrl?: string,
  projectId?: string
): Promise<SyncResult> {
  const metrics = await fetchSERankingMetrics(domain, apiKey, endpointUrl, projectId);

  // No metrics → fetch failed or was skipped. NEVER fabricate mock numbers.
  if (!metrics) {
    return {
      method: 'skipped',
      reason: 'SE Ranking fetch returned no data (not configured or API unavailable)',
    };
  }

  return {
    method: 'api',
    data: {
      seranking_domain_trust: metrics.domain_trust,
      seranking_total_backlinks: metrics.total_backlinks,
      seranking_referring_domains: metrics.referring_domains,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { report_id } = await request.json();
    if (!report_id) {
      return NextResponse.json({ error: 'report_id is required' }, { status: 400 });
    }

    // Fetch report + client
    const { data: report, error: reportError } = await (supabase as any)
      .from('reports')
      .select('*, client:clients(*), metrics:metrics_snapshots(*)')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const client = report.client;
    const reportingMonth: string = report.reporting_month; // e.g. "2026-05-01"
    const [year, month] = reportingMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    // Run GA4, GSC, and SE Ranking syncs in parallel
    const [ga4Result, gscResult, serankingResult] = await Promise.all([
      client.ga4_property_id
        ? syncGA4(client.ga4_property_id, startDate, endDate)
        : Promise.resolve({ method: 'skipped' as const, reason: 'ga4_property_id not configured' }),
      client.gsc_property_url
        ? syncGSC(client.gsc_property_url, startDate, endDate)
        : Promise.resolve({ method: 'skipped' as const, reason: 'gsc_property_url not configured' }),
      (() => {
        // Fully dynamic SE Ranking config. We need at least a custom endpoint
        // URL or a project ID to build a request; otherwise skip gracefully so
        // the rest of the sync still succeeds (off-site metrics render "—").
        const hasEndpoint = Boolean(client.seranking_endpoint_url || client.seranking_project_id);
        if (!hasEndpoint) {
          console.warn(
            `[SE Ranking] No endpoint URL or project ID for client "${client.company_name ?? client.id}". Skipping SE Ranking fetch.`
          );
          return Promise.resolve({
            method: 'skipped' as const,
            reason: 'seranking_endpoint_url and seranking_project_id not configured',
          });
        }
        return syncSERanking(
          client.seranking_domain ?? '',
          client.seranking_api_key,
          client.seranking_endpoint_url,
          client.seranking_project_id
        );
      })(),
    ]);

    // Merge with existing metrics, NEVER destroying previously-uploaded CSV data.
    // The API sync is additive: if a source was skipped (e.g. no API creds), we
    // keep whatever CSV data already exists and preserve its source label.
    const existingMetrics = report.metrics?.[0]?.data_json ?? {};
    const existingSources = existingMetrics.data_sources ?? {};
    const ga4Data = (ga4Result as SyncResult).data ?? {};
    const gscData = (gscResult as SyncResult).data ?? {};
    const serankingData = (serankingResult as SyncResult).data ?? {};

    // Detect existing CSV-sourced data so a skipped API sync doesn't relabel it.
    const hasExistingGa4 =
      existingSources.ga4 === 'csv' ||
      (existingMetrics.ga4_sessions ?? 0) > 0 ||
      (existingMetrics.ga4_channels?.length ?? 0) > 0;
    const hasExistingGsc =
      existingSources.gsc === 'csv' ||
      (existingMetrics.gsc_top_queries?.length ?? 0) > 0;

    const mergedMetrics: UnifiedMetrics = {
      ...existingMetrics,
      // Only spread API data when it actually returned something.
      ...(ga4Result.method === 'api' ? ga4Data : {}),
      ...(gscResult.method === 'api' ? gscData : {}),
      ...serankingData,
      data_sources: {
        screaming_frog: existingMetrics.total_urls ? 'csv' : (existingSources.screaming_frog ?? 'skipped'),
        // Prefer the fresh API result; otherwise keep CSV if we already had it.
        ga4: ga4Result.method === 'api' ? 'api' : hasExistingGa4 ? 'csv' : 'skipped',
        gsc: gscResult.method === 'api' ? 'api' : hasExistingGsc ? 'csv' : 'skipped',
        seranking: serankingResult.method,
      },
    };

    // Upsert metrics snapshot
    const existingSnapshotId = report.metrics?.[0]?.id;
    if (existingSnapshotId) {
      await (supabase as any)
        .from('metrics_snapshots')
        .update({ data_json: mergedMetrics })
        .eq('id', existingSnapshotId);
    } else {
      await (supabase as any)
        .from('metrics_snapshots')
        .insert({ report_id, metric_category: 'full_site_audit', data_json: mergedMetrics });
    }

    return NextResponse.json({
      success: true,
      synced: {
        ga4: { method: ga4Result.method, reason: ga4Result.reason },
        gsc: { method: gscResult.method, reason: gscResult.reason },
        seranking: { method: serankingResult.method, reason: serankingResult.reason },
      },
      metrics: mergedMetrics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Sync route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
