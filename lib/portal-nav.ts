export type PortalTab = 'seo' | 'ppc' | 'documents' | 'requests';

export interface NavItem {
  id: PortalTab;
  label: string;
  icon: string; // lucide icon name reference
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'seo', label: 'SEO Performance', icon: 'BarChart3' },
  { id: 'ppc', label: 'Paid Media (PPC)', icon: 'Target' },
  { id: 'documents', label: 'Documents', icon: 'FileText' },
  { id: 'requests', label: 'Requests', icon: 'Inbox' },
];

/** Tabs that show time-based filters */
export const TIME_FILTERED_TABS: PortalTab[] = ['seo', 'ppc'];
