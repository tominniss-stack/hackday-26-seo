/**
 * Utility functions for report formatting and display
 */

/**
 * Format a report title with month, year, and category
 * @param reportingMonth Date string in format "YYYY-MM-DD"
 * @param category Report category (SEO or PPC)
 * @returns Formatted title like "March 2026 - SEO"
 */
export function formatReportTitle(reportingMonth: string, category?: 'SEO' | 'PPC' | null): string {
  const date = new Date(reportingMonth);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  // Guard against a missing category so the title never renders "- undefined".
  const discipline = category ?? 'SEO';
  return `${month} ${year} - ${discipline}`;
}

/**
 * Format a short report title (month and year only)
 * @param reportingMonth Date string in format "YYYY-MM-DD"
 * @returns Formatted title like "March 2026"
 */
export function formatReportMonth(reportingMonth: string): string {
  const date = new Date(reportingMonth);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}
