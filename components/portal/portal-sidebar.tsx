'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Target, FileText, Inbox } from 'lucide-react';
import { NAV_ITEMS, type PortalTab } from '@/lib/portal-nav';

const iconMap = {
  BarChart3,
  Target,
  FileText,
  Inbox,
} as const;

interface PortalSidebarProps {
  clientColor: string;
  reportId: string;
  accessKey: string;
}

export function PortalSidebar({ clientColor, reportId, accessKey }: PortalSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as PortalTab) || 'seo';

  const navigateToTab = (tab: PortalTab) => {
    router.push(`/report/${reportId}?tab=${tab}&key=${accessKey}`);
  };

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white shrink-0">
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

      {/* Footer branding */}
      <div className="mt-auto border-t border-slate-100 px-4 py-3">
        <p className="text-[10px] text-slate-300 tracking-wide uppercase">
          Powered by Brew Digital
        </p>
      </div>
    </aside>
  );
}
