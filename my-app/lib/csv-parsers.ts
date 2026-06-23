/**
 * CSV parsers for Screaming Frog, GA4, and GSC exports.
 * All parsers return data conforming to UnifiedMetrics.
 * Uses streaming (step) for large files to avoid browser memory issues.
 */

import Papa from 'papaparse';
import type { UnifiedMetrics, ChannelMetric, GscQuery, UrlEntry, DirectoryPattern } from './metrics-schema';

const MAX_DRILL_DOWN = 50;

type CsvRow = Record<string, string>;

function parseString(csv: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(csv, {
      header: true,
      skipEmptyLines: true,
      // Trim BOM/whitespace from headers so column matching is reliable across
      // GA4/GSC export variants and locales.
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
      complete: (results) => resolve(results.data),
      error: (err: unknown) => reject(err),
    });
  });
}

/**
 * Standard GA4/GSC CSV exports prepend up to ~9 rows of metadata before the
 * real header row (e.g. "# ----------------------------------------",
 * "# Account: Brew Digital", blank lines, etc.). PapaParse reads the first
 * line as the header and then fails to find the real columns — producing
 * all-zero metrics.
 *
 * This helper splits the raw text by newlines, finds the index of the actual
 * header row by looking for known GA4/GSC column markers, and slices off every
 * metadata row above it. If no marker is found the original text is returned
 * unchanged (so well-formed exports still parse).
 */
function stripCsvMetadata(raw: string): string {
  // GA4/GSC exports prepend up to ~9 metadata rows before the real header.
  // We identify the header row by the exact, stable GA4/GSC column names it
  // must contain. These markers are matched case-insensitively but as exact
  // substrings of a header cell — not fuzzy — to avoid false positives.
  const headerMarkers = [
    'session default channel group', // GA4 Traffic acquisition
    'session primary channel group', // GA4 (newer variant)
    'page path',                     // GA4 Pages report
    'top queries',                   // GSC Queries
    'query',                         // GSC (variant)
  ];

  const lines = raw.split(/\r\n|\r|\n/);
  const headerIndex = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return headerMarkers.some((marker) => lower.includes(marker));
  });

  if (headerIndex < 0) {
    // No recognised header marker found — log the first few rows so we can
    // debug why detection failed, then leave the text untouched.
    console.warn(
      '[CSV] stripCsvMetadata: no header marker found. First 3 rows:',
      lines.slice(0, 3)
    );
    return raw;
  }

  // Log the extracted header row so a failed parse is debuggable in the terminal.
  console.log(`[CSV] stripCsvMetadata: header row detected at line ${headerIndex}: "${lines[headerIndex]}"`);

  if (headerIndex === 0) return raw; // header already first row
  return lines.slice(headerIndex).join('\n');
}

/** Read a File as text, then strip GA4/GSC metadata rows above the header. */
async function readCleanCsv(file: File): Promise<string> {
  const raw = await file.text();
  return stripCsvMetadata(raw);
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

/**
 * Build a normalized key map for a Screaming Frog row: lowercased + single-spaced
 * keys → original value. Lets us alias columns despite capitalisation/spacing
 * variances (e.g. "Status Code" vs "HTTP Status", "Inlinks" vs "Unique Inlinks").
 */
function normalizeRow(row: CsvRow): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    const norm = key.replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, ' ').trim();
    out[norm] = row[key];
  }
  return out;
}

/** Alias lookup against a normalized row — returns first matching candidate. */
function aliasGet(norm: Record<string, string>, candidates: string[]): string | undefined {
  for (const cand of candidates) {
    const key = cand.toLowerCase().replace(/\s+/g, ' ').trim();
    const v = norm[key];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/**
 * GSC MoM exports prefix metric headers with the date range, e.g.
 * "01/05/2026 - 31/05/2026 Clicks". Build a map from the actual headers to the
 * canonical GscQuery keys using STRICT suffix matching (endsWith ' Clicks',
 * etc.) plus exact-equality for plain headers. We deliberately avoid
 * includes('Clicks') so a query containing the word "clicks" never matches.
 * First matched header for each metric wins.
 */
type GscHeaderMap = {
  query?: string;
  clicks?: string;
  impressions?: string;
  ctr?: string;
  position?: string;
};

function buildGscHeaderMap(headers: string[]): GscHeaderMap {
  const map: GscHeaderMap = {};
  const cleaned = headers.map((h) => h.replace(/^\uFEFF/, '').trim());

  const matchSuffix = (h: string, metric: string) => {
    const lower = h.toLowerCase();
    return lower === metric.toLowerCase() || lower.endsWith(` ${metric.toLowerCase()}`);
  };

  for (const h of cleaned) {
    const lower = h.toLowerCase();
    // Query/keyword column (exact or known synonyms).
    if (map.query === undefined && (lower === 'top queries' || lower === 'query' || lower === 'queries' || lower === 'search query')) {
      map.query = h;
    }
    if (map.clicks === undefined && matchSuffix(h, 'Clicks')) map.clicks = h;
    if (map.impressions === undefined && matchSuffix(h, 'Impressions')) map.impressions = h;
    if (map.ctr === undefined && matchSuffix(h, 'CTR')) map.ctr = h;
    if (map.position === undefined && matchSuffix(h, 'Position')) map.position = h;
  }
  return map;
}

/** Parse a numeric cell that may contain commas, currency, %, or spaces. */
function num(value: string | undefined): number {
  if (value === undefined) return 0;
  const cleaned = String(value).replace(/[,%£$\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function rowToUrlEntry(norm: Record<string, string>): UrlEntry {
  const statusRaw = aliasGet(norm, ['Status Code', 'HTTP Status', 'Status']);
  const parsedStatus = statusRaw ? parseInt(statusRaw, 10) : NaN;
  return {
    url: aliasGet(norm, ['Address', 'URL', 'Page']) ?? '',
    status_code: Number.isFinite(parsedStatus) ? parsedStatus : undefined,
    title: aliasGet(norm, ['Title 1', 'Title']) ?? undefined,
    h1: aliasGet(norm, ['H1-1', 'H1']) ?? undefined,
    indexability: aliasGet(norm, ['Indexability', 'Indexable']) ?? undefined,
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

        // Normalize keys once so aliasing tolerates case/spacing variance.
        const norm = normalizeRow(row);
        const entry = rowToUrlEntry(norm);
        const status = String(aliasGet(norm, ['Status Code', 'HTTP Status', 'Status']) ?? '');
        const indexability = (aliasGet(norm, ['Indexability', 'Indexable']) ?? '').trim();
        const isNonIndexable = indexability === 'Non-Indexable';
        const isIndexable = indexability === 'Indexable';
        const h1Val = aliasGet(norm, ['H1-1', 'H1']) ?? '';
        const isMissingH1 = h1Val.trim() === '';
        const dir = extractDirectory(entry.url);

        // Parse inlinks count (Inlinks or Unique Inlinks)
        const inlinksRaw = aliasGet(norm, ['Inlinks', 'Unique Inlinks']) ?? '0';
        const parsedInlinks = parseInt(inlinksRaw, 10);
        const inlinks = Number.isFinite(parsedInlinks) ? parsedInlinks : 0;
        entry.inlinks_count = inlinks;

        // Parse meta description (length column aliased; fall back to presence of text)
        const metaDescLenRaw = aliasGet(norm, ['Meta Description 1 Length', 'Description Length', 'Meta Description Length']) ?? '0';
        const parsedMetaLen = parseInt(metaDescLenRaw, 10);
        const metaDescLength = Number.isFinite(parsedMetaLen) ? parsedMetaLen : 0;
        const metaDescText = aliasGet(norm, ['Meta Description 1', 'Meta Description', 'Description']) ?? '';
        const isMissingMetaDesc = metaDescLength === 0 || metaDescText.trim() === '';

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
  const cleaned = await readCleanCsv(file);
  const rows = await parseString(cleaned);

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
  const cleaned = await readCleanCsv(file);
  const rows = await parseString(cleaned);

  if (rows.length === 0) return { gsc_top_queries: [] };

  // Resolve the real header names ONCE using strict suffix matching so MoM
  // date-prefixed headers ("01/05/2026 - 31/05/2026 Clicks") map correctly and
  // a query containing the word "clicks" can never be mistaken for the column.
  const headers = Object.keys(rows[0]);
  const hmap = buildGscHeaderMap(headers);

  const getByHeader = (row: CsvRow, header: string | undefined): string | undefined =>
    header ? row[header] : undefined;

  const queries: GscQuery[] = rows
    .filter((r) => {
      const q = getByHeader(r, hmap.query) ?? pick(r, ['Top queries', 'Query', 'Queries', 'Search query']);
      return q !== undefined && String(q).trim() !== '';
    })
    .slice(0, 20) // top 20 queries
    .map((row) => {
      // CTR may arrive as "12.3%" or a fraction "0.123". num() strips the %;
      // if the raw value already looked like a fraction (<= 1), keep it as-is.
      const ctrRawStr = getByHeader(row, hmap.ctr) ?? pick(row, ['CTR', 'Click-through rate', 'Click through rate']) ?? '0';
      const ctrNumber = num(ctrRawStr);
      const ctr = ctrRawStr.includes('%') || ctrNumber > 1 ? ctrNumber / 100 : ctrNumber;
      return {
        query: getByHeader(row, hmap.query) ?? pick(row, ['Top queries', 'Query', 'Queries', 'Search query']) ?? '',
        clicks: num(getByHeader(row, hmap.clicks) ?? pick(row, ['Clicks', 'Click', 'Total clicks'])),
        impressions: num(getByHeader(row, hmap.impressions) ?? pick(row, ['Impressions', 'Impression', 'Total impressions'])),
        ctr,
        position: num(getByHeader(row, hmap.position) ?? pick(row, ['Position', 'Average position', 'Avg. position', 'Avg position'])),
      };
    });

  return { gsc_top_queries: queries };
}

/** Merge multiple partial metrics objects into one UnifiedMetrics */
export function mergeMetrics(...parts: Partial<UnifiedMetrics>[]): UnifiedMetrics {
  return Object.assign({}, ...parts) as UnifiedMetrics;
}
