/**
 * Unified metrics data structure.
 * Both the API sync route and CSV parsers produce this same shape,
 * which is then saved to metrics_snapshots.data_json.
 */

export interface ChannelMetric {
  channel: string;
  sessions: number;
  users: number;
}

export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** A URL entry with optional metadata for drill-down tables */
export interface UrlEntry {
  url: string;
  status_code?: number;
  title?: string;
  h1?: string;
  indexability?: string;
}

/** Top affected directories for a given issue type */
export interface DirectoryPattern {
  directory: string;
  count: number;
}

export interface DirectoryPatterns {
  errors_4xx?: DirectoryPattern[];
  errors_3xx?: DirectoryPattern[];
  non_indexable?: DirectoryPattern[];
}

export interface UnifiedMetrics {
  // Screaming Frog technical health (counts)
  total_urls?: number;
  non_indexable?: number;
  client_errors_4xx?: number;
  server_errors_5xx?: number;
  redirects_3xx?: number;
  missing_h1?: number;

  // Deep-parsed URL arrays (top 50 per issue type)
  urls_4xx?: UrlEntry[];
  urls_5xx?: UrlEntry[];
  urls_3xx?: UrlEntry[];
  urls_non_indexable?: UrlEntry[];
  urls_missing_h1?: UrlEntry[];

  // Directory pattern analysis (top 3 affected directories per issue)
  directory_patterns?: DirectoryPatterns;

  // Storage bucket reference for full raw CSV
  raw_sf_storage_path?: string;

  // GA4 traffic
  ga4_sessions?: number;
  ga4_active_users?: number;
  ga4_channels?: ChannelMetric[];

  // GSC visibility
  gsc_top_queries?: GscQuery[];

  // Source tracking
  data_sources?: {
    screaming_frog?: 'api' | 'csv' | 'skipped';
    ga4?: 'api' | 'csv' | 'skipped';
    gsc?: 'api' | 'csv' | 'skipped';
  };
}
