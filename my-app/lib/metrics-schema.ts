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

/** A SE Ranking tracked keyword with position movement */
export interface SerankingKeyword {
  keyword: string;
  position: number;
  change: number;
  volume: number;
  url: string;
}

/** A PPC keyword / audience row within a campaign */
export interface PpcKeyword {
  keyword: string;
  matchType: string;
  clicks: number;
  impressions: number;
  ctr: string;
  avgCpc: string;
  conversions: number;
}

/** A PPC ad creative within a campaign */
export interface PpcCreative {
  headline: string;
  description: string;
  displayUrl: string;
  ctr: string;
  conversions: number;
}

/** A single paid-media campaign with drill-down detail */
export interface PpcCampaign {
  name: string;
  spend: number;
  conversions: number;
  cpa: number;
  roas: number;
  keywords: PpcKeyword[];
  creatives: PpcCreative[];
}

/** A URL entry with optional metadata for drill-down tables */
export interface UrlEntry {
  url: string;
  status_code?: number;
  title?: string;
  h1?: string;
  indexability?: string;
  inlinks_count?: number;
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
  low_internal_links?: number;
  missing_meta_descriptions?: number;

  // Deep-parsed URL arrays (top 50 per issue type)
  urls_4xx?: UrlEntry[];
  urls_5xx?: UrlEntry[];
  urls_3xx?: UrlEntry[];
  urls_non_indexable?: UrlEntry[];
  urls_missing_h1?: UrlEntry[];
  urls_low_internal_links?: UrlEntry[];
  urls_missing_meta_desc?: UrlEntry[];

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

  // SE Ranking off-site metrics
  seranking_domain_trust?: number;
  seranking_total_backlinks?: number;
  seranking_referring_domains?: number;
  seranking_keywords?: SerankingKeyword[];

  // Paid media (PPC) campaigns for the PPC report view
  ppc_campaigns?: PpcCampaign[];

  // Source tracking
  data_sources?: {
    screaming_frog?: 'api' | 'csv' | 'skipped';
    ga4?: 'api' | 'csv' | 'skipped';
    gsc?: 'api' | 'csv' | 'skipped';
    seranking?: 'api' | 'skipped';
  };
}
