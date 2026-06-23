import type { UnifiedMetrics } from './metrics-schema';

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
  const lowInternalLinks = metrics.low_internal_links ?? 0;
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
    (url.inlinks_count ?? 0) > 0
  ).length;
  const total404s = metrics.client_errors_4xx ?? 0;
  
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
  const errors5xx = metrics.server_errors_5xx ?? 0;
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
  const missingMetaDesc = metrics.missing_meta_descriptions ?? 0;
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
  const redirects302 = metrics.redirects_3xx ?? 0;
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
  const missingH1 = metrics.missing_h1 ?? 0;
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
  const nonIndexable = metrics.non_indexable ?? 0;
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
