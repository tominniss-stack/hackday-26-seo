export type PortalTab = 'dashboard' | 'seo' | 'ppc' | 'documents' | 'requests' | 'settings';

export interface NavItem {
  id: PortalTab;
  label: string;
  icon: string; // lucide icon name reference
}

// Dashboard and Settings removed from sidebar
// Dashboard is the landing page, Settings is in user dropdown
export const NAV_ITEMS: NavItem[] = [
  { id: 'seo', label: 'SEO Performance', icon: 'BarChart3' },
  { id: 'ppc', label: 'Paid Media (PPC)', icon: 'Target' },
  { id: 'documents', label: 'Documents', icon: 'FileText' },
  { id: 'requests', label: 'Requests', icon: 'Inbox' },
];

/** Tabs that show time-based filters */
export const TIME_FILTERED_TABS: PortalTab[] = ['seo', 'ppc'];
