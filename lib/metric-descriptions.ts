/**
 * Professional metric tooltip descriptions for the Technical Health cards.
 * Each key matches the metric label used in the SEO view.
 */
export const METRIC_DESCRIPTIONS: Record<string, string> = {
  'Total URLs':
    'The total number of unique URLs discovered during the technical crawl. This represents the full scope of your website\'s indexable and non-indexable pages.',

  'Non-Indexable':
    'Pages blocked from search engine indexing via robots.txt directives, noindex meta tags, or canonical redirects. Review regularly to ensure important pages are not accidentally excluded.',

  '3xx Redirects':
    'Indicates URLs that forward to new destinations. Essential for preserving link equity during site migrations. Excessive redirect chains (3+ hops) can dilute PageRank and slow crawl efficiency.',

  '4xx Errors':
    'Client-side errors indicating broken or missing pages. These create poor user experiences and waste crawl budget. Prioritise fixing pages with inbound links or high historical traffic.',

  '5xx Errors':
    'Server-side errors indicating infrastructure or application failures. These are critical — search engines may temporarily de-index affected pages if errors persist beyond 24 hours.',

  'Missing H1':
    'Pages lacking a primary heading tag, which impacts content hierarchy and accessibility. Each page should have exactly one H1 that clearly describes the page\'s primary topic.',
};
