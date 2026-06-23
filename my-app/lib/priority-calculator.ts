import type { UnifiedMetrics } from './metrics-schema';

/**
 * Coerce any value to a finite number. undefined / null / NaN / Infinity all
 * collapse to 0 so downstream comparisons and arithmetic never produce NaN.
 */
function safeNum(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface PriorityIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  metric_value: number;
  category: 'internal_linking' | '404_errors' | '302_redirects' | 'technical';
  priority_rank: number;
}

export interface PriorityWeights {
  internal_linking: number;
  errors_404: number;
  redirects_302: number;
  errors_5xx: number;
  missing_h1: number;
  non_indexable: number;
  missing_meta_descriptions: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  internal_linking: 100,  // CRITICAL: Highest priority
  errors_404: 90,         // CRITICAL: 404s with link equity
  errors_5xx: 85,         // CRITICAL: Server errors
  redirects_302: 60,      // MEDIUM: Redirect chains
  missing_meta_descriptions: 60,  // MEDIUM: Missing meta descriptions
  missing_h1: 50,         // MEDIUM: Missing H1 tags
  non_indexable: 20,      // LOW: Intentional noindex pages
};

/**
 * Calculate top actionable priorities based on metrics and configurable weights.
 * Returns top 3 issues ranked by severity and impact.
 */
export function calculateReportPriorities(
  metrics: UnifiedMetrics,
  customWeights?: Partial<PriorityWeights>
): PriorityIssue[] {
  const weights = { ...DEFAULT_PRIORITY_WEIGHTS, ...customWeights };
  const issues: PriorityIssue[] = [];

  // CRITICAL PRIORITY 1: Low Internal Links (Indexable pages with < 3 inlinks)
  const lowInternalLinks = safeNum(metrics.low_internal_links);
  if (lowInternalLinks > 0) {
    issues.push({
      id: 'low_internal_links',
      title: 'Indexable Pages with Low Internal Links',
      description: `${lowInternalLinks} indexable pages have fewer than 3 internal links, limiting crawl depth and PageRank flow`,
      severity: lowInternalLinks > 50 ? 'critical' : lowInternalLinks > 20 ? 'high' : 'medium',
      metric_value: lowInternalLinks,
      category: 'internal_linking',
      priority_rank: weights.internal_linking,
    });
  }

  // CRITICAL PRIORITY 2: 404 Errors with Link Equity
  const errors404WithLinks = (metrics.urls_4xx ?? []).filter(url =>
    safeNum(url?.inlinks_count) > 0
  ).length;
  const total404s = safeNum(metrics.client_errors_4xx);
  
  if (errors404WithLinks > 0) {
    issues.push({
      id: '404_with_equity',
      title: '404 Errors with Incoming Links',
      description: `${errors404WithLinks} of ${total404s} broken pages still receiving internal link equity`,
      severity: errors404WithLinks > 20 ? 'critical' : errors404WithLinks > 5 ? 'high' : 'medium',
      metric_value: errors404WithLinks,
      category: '404_errors',
      priority_rank: weights.errors_404,
    });
  } else if (total404s > 0) {
    // Orphaned 404s (no inlinks) - lower priority
    issues.push({
      id: '404_orphaned',
      title: '404 Client Errors (Orphaned)',
      description: `${total404s} broken URLs with no incoming links`,
      severity: 'medium',
      metric_value: total404s,
      category: '404_errors',
      priority_rank: weights.errors_404 * 0.3, // Reduced priority
    });
  }

  // CRITICAL PRIORITY 3: 5xx Server Errors (always critical)
  const errors5xx = safeNum(metrics.server_errors_5xx);
  if (errors5xx > 0) {
    issues.push({
      id: '5xx_errors',
      title: '5xx Server Errors',
      description: `${errors5xx} server errors preventing page access`,
      severity: 'critical',
      metric_value: errors5xx,
      category: 'technical',
      priority_rank: weights.errors_5xx,
    });
  }

  // MEDIUM PRIORITY 1: Missing Meta Descriptions
  const missingMetaDesc = safeNum(metrics.missing_meta_descriptions);
  if (missingMetaDesc > 10) {
    issues.push({
      id: 'missing_meta_descriptions',
      title: 'Missing Meta Descriptions',
      description: `${missingMetaDesc} pages lack meta descriptions, reducing SERP click-through potential`,
      severity: 'medium',
      metric_value: missingMetaDesc,
      category: 'technical',
      priority_rank: weights.missing_meta_descriptions,
    });
  }

  // MEDIUM PRIORITY 2: 302 Redirect Chains
  const redirects302 = safeNum(metrics.redirects_3xx);
  if (redirects302 > 20) {
    issues.push({
      id: '302_redirects',
      title: '302 Redirect Chains',
      description: `${redirects302} temporary redirects detected (should be 301 permanent)`,
      severity: redirects302 > 100 ? 'high' : 'medium',
      metric_value: redirects302,
      category: '302_redirects',
      priority_rank: weights.redirects_302,
    });
  }

  // MEDIUM PRIORITY 3: Missing H1 Tags
  const missingH1 = safeNum(metrics.missing_h1);
  if (missingH1 > 10) {
    issues.push({
      id: 'missing_h1',
      title: 'Missing H1 Tags',
      description: `${missingH1} pages missing critical H1 heading tags`,
      severity: 'medium',
      metric_value: missingH1,
      category: 'technical',
      priority_rank: weights.missing_h1,
    });
  }

  // LOW PRIORITY: Non-Indexable Pages (only flag if excessive)
  const nonIndexable = safeNum(metrics.non_indexable);
  if (nonIndexable > 100) {
    issues.push({
      id: 'non_indexable',
      title: 'Non-Indexable Pages',
      description: `${nonIndexable} pages blocked from search engine indexing (review if intentional)`,
      severity: 'medium',
      metric_value: nonIndexable,
      category: 'technical',
      priority_rank: weights.non_indexable,
    });
  }

  // Sort by priority rank (descending) and return top 3
  return issues
    .sort((a, b) => b.priority_rank - a.priority_rank)
    .slice(0, 3);
}

/**
 * A manually authored / overridden priority. Either picked from the known
 * issue catalog (and optionally tweaked) or a fully custom "Other" entry.
 */
export interface ManualPriority {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  /** 'catalog' = chosen from a known issue; 'custom' = analyst free-text. */
  source: 'catalog' | 'custom';
}

/**
 * The catalog of known issue types an analyst can pick from a dropdown.
 * `value` is a stable id; selecting one pre-fills title + description, which
 * the analyst can still edit before saving.
 */
export interface IssueTemplate {
  value: string;
  title: string;
  description: string;
  defaultSeverity: 'critical' | 'high' | 'medium';
}

export const KNOWN_ISSUE_TEMPLATES: IssueTemplate[] = [
  {
    value: 'low_internal_links',
    title: 'Indexable Pages with Low Internal Links',
    description: 'Indexable pages have fewer than 3 internal links, limiting crawl depth and PageRank flow.',
    defaultSeverity: 'critical',
  },
  {
    value: '404_with_equity',
    title: '404 Errors with Incoming Links',
    description: 'Broken pages are still receiving internal link equity that should be redirected.',
    defaultSeverity: 'critical',
  },
  {
    value: '404_orphaned',
    title: '404 Client Errors (Orphaned)',
    description: 'Broken URLs with no incoming links should be reviewed and removed or restored.',
    defaultSeverity: 'medium',
  },
  {
    value: '5xx_errors',
    title: '5xx Server Errors',
    description: 'Server errors are preventing page access and may cause temporary de-indexing.',
    defaultSeverity: 'critical',
  },
  {
    value: 'missing_meta_descriptions',
    title: 'Missing Meta Descriptions',
    description: 'Pages lack meta descriptions, reducing SERP click-through potential.',
    defaultSeverity: 'medium',
  },
  {
    value: '302_redirects',
    title: '302 Redirect Chains',
    description: 'Temporary (302) redirects detected that should be permanent (301).',
    defaultSeverity: 'medium',
  },
  {
    value: 'missing_h1',
    title: 'Missing H1 Tags',
    description: 'Pages are missing critical H1 heading tags, weakening content hierarchy.',
    defaultSeverity: 'medium',
  },
  {
    value: 'non_indexable',
    title: 'Non-Indexable Pages',
    description: 'A large number of pages are blocked from indexing — confirm this is intentional.',
    defaultSeverity: 'medium',
  },
  {
    value: 'other',
    title: '',
    description: '',
    defaultSeverity: 'high',
  },
];

/**
 * Resolve the priorities to render for a report. When the analyst has saved
 * manual overrides, those win; otherwise fall back to the auto-calculated set.
 * Manual entries are mapped into the same PriorityIssue shape used by the UI.
 */
export function resolvePriorities(
  metrics: UnifiedMetrics,
  manual?: ManualPriority[] | null,
  customWeights?: Partial<PriorityWeights>
): PriorityIssue[] {
  if (manual && manual.length > 0) {
    return manual.map((m, idx) => ({
      id: m.id || `manual_${idx}`,
      title: m.title,
      description: m.description,
      severity: m.severity,
      metric_value: 0,
      category: 'technical',
      priority_rank: 1000 - idx, // preserve analyst-defined order
    }));
  }
  return calculateReportPriorities(metrics, customWeights);
}
