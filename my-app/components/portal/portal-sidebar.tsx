'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, BarChart3, Target, FileText, Inbox, Settings, BookOpen, Mic, Sparkles, ExternalLink } from 'lucide-react';
import { NAV_ITEMS, type PortalTab } from '@/lib/portal-nav';

const MORE_FROM_BREW = [
  { label: 'Resource Hub', href: 'https://brewdigital.com/resource-hub', icon: BookOpen },
  { label: 'Podcast', href: 'https://brewdigital.com/podcast', icon: Mic },
  { label: 'Explore Services', href: 'https://brewdigital.com/services', icon: Sparkles },
] as const;

const iconMap = {
  LayoutDashboard,
  BarChart3,
  Target,
  FileText,
  Inbox,
  Settings,
} as const;

interface PortalSidebarProps {
  clientColor: string;
  reportId?: string;
  clientId?: string;
  accessKey: string;
}

export function PortalSidebar({ clientColor, reportId, clientId, accessKey }: PortalSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as PortalTab) || 'dashboard';

  const navigateToTab = (tab: PortalTab) => {
    // Use clientId for portal route, reportId for report route
    const baseRoute = clientId ? `/portal/${clientId}` : `/report/${reportId}`;
    const keyParam = clientId ? 'access_key' : 'key';
    router.push(`${baseRoute}?tab=${tab}&${keyParam}=${accessKey}`);
  };

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white shrink-0 h-full overflow-y-auto">
      <nav className="flex flex-col py-4 gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigateToTab(item.id)}
              className={`group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-slate-50 font-medium text-slate-900 shadow-sm ring-1 ring-slate-200/60'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-500'
                }`}
                style={isActive ? { color: clientColor } : undefined}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* More from Brew — commercial ecosystem links */}
      <div className="mt-auto border-t border-slate-100 py-3">
        <p className="px-5 mb-1 text-[11px] font-medium text-slate-400 tracking-wide uppercase">
          More from Brew
        </p>
        {MORE_FROM_BREW.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
            <span className="flex-1">{label}</span>
            <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-slate-400" />
          </a>
        ))}
        <p className="px-5 pt-3 text-[11px] text-slate-300 tracking-wide uppercase">
          Powered by Brew Digital
        </p>
      </div>
    </aside>
  );
}
