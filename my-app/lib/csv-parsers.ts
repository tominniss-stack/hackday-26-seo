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
      // Trim BOM/whitespace from headers so column matching is reliable across
      // GA4/GSC export variants and locales.
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

/**
 * Case-insensitive, whitespace-tolerant column lookup. Returns the first
 * non-empty value among the provided candidate header names.
 */
function pick(row: CsvRow, candidates: string[]): string | undefined {
  // Build a normalized lookup of this row's keys once per call.
  const norm: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    norm[key.toLowerCase().trim()] = row[key];
  }
  for (const cand of candidates) {
    const v = norm[cand.toLowerCase().trim()];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return undefined;
}

/** Parse a numeric cell that may contain commas, currency, %, or spaces. */
function num(value: string | undefined): number {
  if (value === undefined) return 0;
  const cleaned = String(value).replace(/[,%£$\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
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
      low_internal_links: 0,
      missing_meta_descriptions: 0,
    };

    const urlBuckets = {
      urls_4xx: [] as UrlEntry[],
      urls_5xx: [] as UrlEntry[],
      urls_3xx: [] as UrlEntry[],
      urls_non_indexable: [] as UrlEntry[],
      urls_missing_h1: [] as UrlEntry[],
      urls_low_internal_links: [] as UrlEntry[],
      urls_missing_meta_desc: [] as UrlEntry[],
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
        const isIndexable = row['Indexability'] === 'Indexable';
        const isMissingH1 = !row['H1-1'] || row['H1-1'].trim() === '';
        const dir = extractDirectory(entry.url);

        // Parse inlinks count
        const inlinks = parseInt(row['Inlinks'] ?? '0', 10);
        entry.inlinks_count = inlinks;

        // Parse meta description
        const metaDescLength = parseInt(row['Meta Description 1 Length'] ?? '0', 10);
        const isMissingMetaDesc = metaDescLength === 0 || !row['Meta Description 1'];

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
        
        // NEW: Track low internal links (indexable pages with < 3 inlinks)
        if (isIndexable && inlinks < 3) {
          counts.low_internal_links++;
          if (urlBuckets.urls_low_internal_links.length < MAX_DRILL_DOWN) {
            urlBuckets.urls_low_internal_links.push(entry);
          }
        }
        
        // NEW: Track missing meta descriptions
        if (isMissingMetaDesc) {
          counts.missing_meta_descriptions++;
          if (urlBuckets.urls_missing_meta_desc.length < MAX_DRILL_DOWN) {
            urlBuckets.urls_missing_meta_desc.push(entry);
          }
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
    const channel = pick(r, [
      'Session default channel group',
      'Session primary channel group',
      'Session default channel grouping',
      'Default channel group',
      'Channel',
      'Channel group',
    ]) ?? '';
    return channel && channel !== 'Total' && !channel.startsWith('(');
  });

  let totalSessions = 0;
  let totalUsers = 0;
  const channels: ChannelMetric[] = [];

  for (const row of dataRows) {
    const channel = pick(row, [
      'Session default channel group',
      'Session primary channel group',
      'Session default channel grouping',
      'Default channel group',
      'Channel',
      'Channel group',
    ]) ?? 'Unknown';
    const sessions = num(pick(row, ['Sessions', 'Session', 'Total sessions']));
    const users = num(pick(row, ['Active users', 'Users', 'Total users', 'Active Users']));
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
    .filter((r) => pick(r, ['Top queries', 'Query', 'Queries', 'Search query']))
    .slice(0, 20) // top 20 queries
    .map((row) => {
      // CTR may arrive as "12.3%" or a fraction "0.123". num() strips the %;
      // if the raw value already looked like a fraction (<= 1), keep it as-is.
      const ctrRawStr = pick(row, ['CTR', 'Click-through rate', 'Click through rate']) ?? '0';
      const ctrNumber = num(ctrRawStr);
      const ctr = ctrRawStr.includes('%') || ctrNumber > 1 ? ctrNumber / 100 : ctrNumber;
      return {
        query: pick(row, ['Top queries', 'Query', 'Queries', 'Search query']) ?? '',
        clicks: num(pick(row, ['Clicks', 'Click', 'Total clicks'])),
        impressions: num(pick(row, ['Impressions', 'Impression', 'Total impressions'])),
        ctr,
        position: num(pick(row, ['Position', 'Average position', 'Avg. position', 'Avg position'])),
      };
    });

  return { gsc_top_queries: queries };
}

/** Merge multiple partial metrics objects into one UnifiedMetrics */
export function mergeMetrics(...parts: Partial<UnifiedMetrics>[]): UnifiedMetrics {
  return Object.assign({}, ...parts) as UnifiedMetrics;
}
