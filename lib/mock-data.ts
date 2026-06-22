/**
 * Seeded MoM (Month-over-Month) mock data generator.
 * Uses a deterministic hash so values are consistent across re-renders.
 */

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export interface MoMChange {
  previousValue: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Generate a mock MoM change for a given metric.
 * Uses the metric key as a seed for deterministic results.
 *
 * @param currentValue - The current month's value
 * @param metricKey - A unique string key for this metric (used as seed)
 * @param options - Optional configuration
 */
export function generateMoMChange(
  currentValue: number,
  metricKey: string,
  options?: {
    minPercent?: number;
    maxPercent?: number;
    biasUp?: boolean; // If true, more likely to show improvement
  }
): MoMChange {
  const { minPercent = 5, maxPercent = 15, biasUp = false } = options || {};

  const seed = hashString(metricKey);
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);

  // Determine direction
  const directionThreshold = biasUp ? 0.35 : 0.5;
  const isUp = rand1 > directionThreshold;

  // Calculate percentage change
  const range = maxPercent - minPercent;
  const changePercent = parseFloat((minPercent + rand2 * range).toFixed(1));

  // Calculate previous value
  const multiplier = isUp ? (1 - changePercent / 100) : (1 + changePercent / 100);
  const previousValue = Math.round(currentValue * multiplier);

  return {
    previousValue,
    changePercent,
    direction: changePercent === 0 ? 'flat' : isUp ? 'up' : 'down',
  };
}

// ─── Static Mock Data ────────────────────────────────────────────────

export const MOCK_KEYWORD_DATA = [
  { keyword: 'digital marketing agency uk', position: 3, change: 2, volume: 2400, url: '/services/digital-marketing' },
  { keyword: 'seo services edinburgh', position: 1, change: 1, volume: 880, url: '/services/seo' },
  { keyword: 'ppc management services', position: 7, change: -3, volume: 1600, url: '/services/ppc' },
  { keyword: 'content marketing strategy', position: 12, change: 5, volume: 3200, url: '/blog/content-strategy' },
  { keyword: 'web design agency scotland', position: 4, change: 0, volume: 720, url: '/services/web-design' },
  { keyword: 'b2b lead generation', position: 18, change: -2, volume: 4100, url: '/services/lead-gen' },
  { keyword: 'technical seo audit', position: 6, change: 3, volume: 1200, url: '/services/technical-seo' },
  { keyword: 'social media management', position: 15, change: 1, volume: 5400, url: '/services/social-media' },
];

export const MOCK_TRAFFIC_DATA = [
  { channel: 'Organic Search', sessions: 12450, users: 9820, bounceRate: '42.3%', avgDuration: '2m 34s' },
  { channel: 'Direct', sessions: 4230, users: 3150, bounceRate: '38.1%', avgDuration: '3m 12s' },
  { channel: 'Paid Search', sessions: 3890, users: 3420, bounceRate: '45.7%', avgDuration: '1m 58s' },
  { channel: 'Social', sessions: 2100, users: 1890, bounceRate: '52.4%', avgDuration: '1m 22s' },
  { channel: 'Referral', sessions: 1560, users: 1340, bounceRate: '35.8%', avgDuration: '2m 45s' },
  { channel: 'Email', sessions: 890, users: 780, bounceRate: '28.9%', avgDuration: '3m 48s' },
];

export const MOCK_PPC_CAMPAIGNS = [
  {
    name: 'Google Ads — Brand Search',
    spend: 4250,
    conversions: 142,
    cpa: 29.93,
    roas: 5.2,
    keywords: [
      { keyword: 'brew digital', matchType: 'Exact', clicks: 890, impressions: 12400, ctr: '7.2%', avgCpc: '£0.42', conversions: 68 },
      { keyword: 'brew digital agency', matchType: 'Phrase', clicks: 340, impressions: 4200, ctr: '8.1%', avgCpc: '£0.38', conversions: 31 },
      { keyword: 'brew digital edinburgh', matchType: 'Exact', clicks: 210, impressions: 2800, ctr: '7.5%', avgCpc: '£0.45', conversions: 22 },
      { keyword: 'brew digital reviews', matchType: 'Broad', clicks: 180, impressions: 3100, ctr: '5.8%', avgCpc: '£0.51', conversions: 21 },
    ],
    creatives: [
      { headline: 'Award-Winning Digital Agency | Brew Digital', description: 'Transform your online presence with data-driven strategies. 15+ years of experience. Free consultation.', displayUrl: 'brewdigital.com/services', ctr: '8.4%', conversions: 45 },
      { headline: 'Brew Digital — Results That Matter', description: 'SEO, PPC & Content Marketing experts. Trusted by 200+ UK businesses. Get your free audit today.', displayUrl: 'brewdigital.com/free-audit', ctr: '6.9%', conversions: 38 },
    ],
  },
  {
    name: 'LinkedIn — Lead Gen',
    spend: 6800,
    conversions: 89,
    cpa: 76.40,
    roas: 3.1,
    keywords: [
      { keyword: 'B2B Marketing Decision Makers', matchType: 'Audience', clicks: 420, impressions: 18500, ctr: '2.3%', avgCpc: '£4.12', conversions: 34 },
      { keyword: 'CMO / VP Marketing', matchType: 'Audience', clicks: 280, impressions: 12200, ctr: '2.3%', avgCpc: '£5.80', conversions: 28 },
      { keyword: 'Digital Transformation Leaders', matchType: 'Audience', clicks: 190, impressions: 9800, ctr: '1.9%', avgCpc: '£6.20', conversions: 27 },
    ],
    creatives: [
      { headline: 'Stop Guessing, Start Growing', description: 'Download our 2026 B2B Digital Marketing Playbook. Data-backed strategies for enterprise growth.', displayUrl: 'brewdigital.com/playbook', ctr: '2.8%', conversions: 52 },
      { headline: 'Your Competitors Are Already Here', description: 'Join 200+ B2B brands using Brew Digital to drive qualified pipeline. Book a strategy call.', displayUrl: 'brewdigital.com/b2b', ctr: '2.1%', conversions: 37 },
    ],
  },
  {
    name: 'Meta — Retargeting',
    spend: 2100,
    conversions: 67,
    cpa: 31.34,
    roas: 4.8,
    keywords: [
      { keyword: 'Website Visitors (7d)', matchType: 'Retarget', clicks: 580, impressions: 24000, ctr: '2.4%', avgCpc: '£1.20', conversions: 32 },
      { keyword: 'Engaged Social (30d)', matchType: 'Retarget', clicks: 340, impressions: 15600, ctr: '2.2%', avgCpc: '£1.45', conversions: 20 },
      { keyword: 'Email Subscribers', matchType: 'Custom', clicks: 210, impressions: 8900, ctr: '2.4%', avgCpc: '£1.10', conversions: 15 },
    ],
    creatives: [
      { headline: 'Still Thinking About It?', description: 'Come back and see what\'s new. Exclusive offer for returning visitors — 20% off your first project.', displayUrl: 'brewdigital.com/welcome-back', ctr: '3.2%', conversions: 38 },
      { headline: 'Ready to Scale Your Marketing?', description: 'You visited us for a reason. Let\'s pick up where we left off. Free 30-min strategy session.', displayUrl: 'brewdigital.com/book', ctr: '2.7%', conversions: 29 },
    ],
  },
];

export const MOCK_DOCUMENTS = [
  { name: 'Brew_Digital_MSA_2026.pdf', type: 'Contract', size: '2.4 MB', date: '15 Jan 2026' },
  { name: 'Q1_Strategy_Deck.pdf', type: 'Strategy', size: '8.1 MB', date: '02 Mar 2026' },
  { name: 'SEO_Technical_Audit_Apr2026.pdf', type: 'Report', size: '3.7 MB', date: '01 Apr 2026' },
  { name: 'Brand_Guidelines_v3.pdf', type: 'Brand', size: '12.5 MB', date: '20 Feb 2026' },
  { name: 'Monthly_Analytics_Report_May2026.pdf', type: 'Report', size: '5.2 MB', date: '01 May 2026' },
];

export const MOCK_TICKETS = [
  { id: 'BD-1042', title: 'Update homepage meta descriptions', priority: 'Medium' as const, status: 'Open' as const, created: '18 Jun 2026' },
  { id: 'BD-1038', title: 'Add new landing page for Q3 campaign', priority: 'High' as const, status: 'In Progress' as const, created: '12 Jun 2026' },
  { id: 'BD-1035', title: 'Fix broken links on /resources page', priority: 'Low' as const, status: 'Open' as const, created: '08 Jun 2026' },
  { id: 'BD-1029', title: 'Review and approve blog content calendar', priority: 'Medium' as const, status: 'Awaiting Response' as const, created: '01 Jun 2026' },
];
