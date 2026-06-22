/**
 * CSV parsers for Screaming Frog, GA4, and GSC exports.
 * All parsers return data conforming to UnifiedMetrics.
 * Uses streaming (step) for large files to avoid browser memory issues.
 */

import Papa from 'papaparse';
import type { UnifiedMetrics, ChannelMetric, GscQuery, UrlEntry, DirectoryPattern } from './metrics-schema';

const MAX_DRILL_DOWN = 50;

type CsvRow = Record<string, string>;

function parseFile(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

function rowToUrlEntry(row: CsvRow): UrlEntry {
  return {
    url: row['Address'] ?? row['URL'] ?? '',
    status_code: row['Status Code'] ? parseInt(row['Status Code'], 10) : undefined,
    title: row['Title 1'] ?? row['Title'] ?? undefined,
    h1: row['H1-1'] ?? undefined,
    indexability: row['Indexability'] ?? undefined,
  };
}

/** Extract the first directory path segment after the domain */
function extractDirectory(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}/` : '/';
  } catch {
    return '/';
  }
}

/** Convert a directory count map to sorted top-N array */
function topDirectories(map: Map<string, number>, n = 3): DirectoryPattern[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([directory, count]) => ({ directory, count }));
}

/**
 * Parse a Screaming Frog "Internal All" CSV export using streaming.
 * Handles 50,000+ row files without crashing the browser.
 */
export function parseScreamingFrogCsv(file: File): Promise<Partial<UnifiedMetrics>> {
  return new Promise((resolve, reject) => {
    const counts = {
      total_urls: 0,
      non_indexable: 0,
      client_errors_4xx: 0,
      server_errors_5xx: 0,
      redirects_3xx: 0,
      missing_h1: 0,
    };

    const urlBuckets = {
      urls_4xx: [] as UrlEntry[],
      urls_5xx: [] as UrlEntry[],
      urls_3xx: [] as UrlEntry[],
      urls_non_indexable: [] as UrlEntry[],
      urls_missing_h1: [] as UrlEntry[],
    };

    // Directory pattern tracking
    const dirMap4xx = new Map<string, number>();
    const dirMap3xx = new Map<string, number>();
    const dirMapNonIndexable = new Map<string, number>();

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      worker: false, // worker:true requires bundler config; streaming via step is sufficient
      step: (result) => {
        const row = result.data;
        counts.total_urls++;

        const entry = rowToUrlEntry(row);
        const status = String(row['Status Code'] ?? '');
        const isNonIndexable = row['Indexability'] === 'Non-Indexable';
        const isMissingH1 = !row['H1-1'] || row['H1-1'].trim() === '';
        const dir = extractDirectory(entry.url);

        if (isNonIndexable) {
          counts.non_indexable++;
          dirMapNonIndexable.set(dir, (dirMapNonIndexable.get(dir) ?? 0) + 1);
          if (urlBuckets.urls_non_indexable.length < MAX_DRILL_DOWN) urlBuckets.urls_non_indexable.push(entry);
        }
        if (status.startsWith('4')) {
          counts.client_errors_4xx++;
          dirMap4xx.set(dir, (dirMap4xx.get(dir) ?? 0) + 1);
          if (urlBuckets.urls_4xx.length < MAX_DRILL_DOWN) urlBuckets.urls_4xx.push(entry);
        } else if (status.startsWith('5')) {
          counts.server_errors_5xx++;
          if (urlBuckets.urls_5xx.length < MAX_DRILL_DOWN) urlBuckets.urls_5xx.push(entry);
        } else if (status.startsWith('3')) {
          counts.redirects_3xx++;
          dirMap3xx.set(dir, (dirMap3xx.get(dir) ?? 0) + 1);
          if (urlBuckets.urls_3xx.length < MAX_DRILL_DOWN) urlBuckets.urls_3xx.push(entry);
        }
        if (isMissingH1) {
          counts.missing_h1++;
          if (urlBuckets.urls_missing_h1.length < MAX_DRILL_DOWN) urlBuckets.urls_missing_h1.push(entry);
        }
      },
      complete: () => {
        resolve({
          ...counts,
          ...urlBuckets,
          directory_patterns: {
            errors_4xx: topDirectories(dirMap4xx),
            errors_3xx: topDirectories(dirMap3xx),
            non_indexable: topDirectories(dirMapNonIndexable),
          },
        });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Parse a GA4 "Traffic acquisition" CSV export.
 * Expected columns: "Session default channel group", "Sessions", "Active users"
 */
export async function parseGa4Csv(file: File): Promise<Partial<UnifiedMetrics>> {
  const rows = await parseFile(file);

  // GA4 exports often have a summary row at the bottom — filter it out
  const dataRows = rows.filter((r) => {
    const channel = r['Session default channel group'] ?? r['Channel'] ?? '';
    return channel && channel !== 'Total' && !channel.startsWith('(');
  });

  let totalSessions = 0;
  let totalUsers = 0;
  const channels: ChannelMetric[] = [];

  for (const row of dataRows) {
    const channel = row['Session default channel group'] ?? row['Channel'] ?? 'Unknown';
    const sessions = parseInt(String(row['Sessions'] ?? '0').replace(/,/g, ''), 10) || 0;
    const users = parseInt(String(row['Active users'] ?? row['Users'] ?? '0').replace(/,/g, ''), 10) || 0;
    totalSessions += sessions;
    totalUsers += users;
    channels.push({ channel, sessions, users });
  }

  // Sort by sessions descending
  channels.sort((a, b) => b.sessions - a.sessions);

  return {
    ga4_sessions: totalSessions,
    ga4_active_users: totalUsers,
    ga4_channels: channels.slice(0, 10), // top 10 channels
  };
}

/**
 * Parse a GSC "Queries" CSV export.
 * Expected columns: "Top queries", "Clicks", "Impressions", "CTR", "Position"
 */
export async function parseGscCsv(file: File): Promise<Partial<UnifiedMetrics>> {
  const rows = await parseFile(file);

  const queries: GscQuery[] = rows
    .filter((r) => r['Top queries'] || r['Query'])
    .slice(0, 20) // top 20 queries
    .map((row) => {
      const ctrRaw = String(row['CTR'] ?? '0').replace('%', '');
      return {
        query: row['Top queries'] ?? row['Query'] ?? '',
        clicks: parseInt(String(row['Clicks'] ?? '0').replace(/,/g, ''), 10) || 0,
        impressions: parseInt(String(row['Impressions'] ?? '0').replace(/,/g, ''), 10) || 0,
        ctr: parseFloat(ctrRaw) / 100 || 0,
        position: parseFloat(String(row['Position'] ?? '0')) || 0,
      };
    });

  return { gsc_top_queries: queries };
}

/** Merge multiple partial metrics objects into one UnifiedMetrics */
export function mergeMetrics(...parts: Partial<UnifiedMetrics>[]): UnifiedMetrics {
  return Object.assign({}, ...parts) as UnifiedMetrics;
}
