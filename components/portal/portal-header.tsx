'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { BarChart3, Target, FileText, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { NAV_ITEMS, type PortalTab } from '@/lib/portal-nav';

const iconMap = {
  BarChart3,
  Target,
  FileText,
  Inbox,
} as const;

interface PortalHeaderProps {
  companyName: string;
  logoUrl: string | null;
  clientColor: string;
  reportId: string;
  accessKey: string;
}

export function PortalHeader({
  companyName,
  logoUrl,
  clientColor,
  reportId,
  accessKey,
}: PortalHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as PortalTab) || 'seo';
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigateToTab = (tab: PortalTab) => {
    router.push(`/report/${reportId}?tab=${tab}&key=${accessKey}`);
    setSheetOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Left: Hamburger (mobile) + Brew Digital branding */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="flex md:hidden"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b border-slate-100 px-4 py-3">
                <SheetTitle className="text-sm font-semibold text-slate-900">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col py-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const isActive = activeTab === item.id;
                  return (
                    <SheetClose
                      key={item.id}
                      render={
                        <button
                          onClick={() => navigateToTab(item.id)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-slate-50 font-medium text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                          style={isActive ? { borderLeft: `3px solid ${clientColor}` } : { borderLeft: '3px solid transparent' }}
                        />
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Brew Digital logo */}
          <div className="font-bold text-lg tracking-tight text-slate-900">
            Brew Digital
          </div>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <span className="text-xs text-slate-400 tracking-wide uppercase hidden sm:block">
            Client Portal
          </span>
        </div>

        {/* Right: Client branding */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 hidden sm:block">
            {companyName}
          </span>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-100"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ring-1 ring-white/20"
              style={{ backgroundColor: clientColor }}
            >
              {companyName.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
