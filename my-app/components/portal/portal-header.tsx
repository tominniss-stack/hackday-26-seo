'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, LogOut, User, Users, MessageSquare, ChevronDown } from 'lucide-react';
import { LayoutDashboard, BarChart3, Target, FileText, Inbox, Settings } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NAV_ITEMS, type PortalTab } from '@/lib/portal-nav';
import { resolveLogoUrl } from '@/lib/storage-helpers';

const iconMap = {
  LayoutDashboard,
  BarChart3,
  Target,
  FileText,
  Inbox,
  Settings,
} as const;

interface PortalHeaderProps {
  companyName: string;
  logoUrl: string | null;
  logoStoragePath?: string | null;
  clientColor: string;
  reportId?: string;
  clientId?: string;
  accessKey: string;
}

export function PortalHeader({
  companyName,
  logoUrl,
  logoStoragePath,
  clientColor,
  reportId,
  clientId,
  accessKey,
}: PortalHeaderProps) {
  const resolvedLogoUrl = resolveLogoUrl(logoUrl, logoStoragePath || null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as PortalTab) || 'dashboard';
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigateToTab = (tab: PortalTab) => {
    // Use clientId for portal route, reportId for report route
    const baseRoute = clientId ? `/portal/${clientId}` : `/report/${reportId}`;
    const keyParam = clientId ? 'access_key' : 'key';
    router.push(`${baseRoute}?tab=${tab}&${keyParam}=${accessKey}`);
    setSheetOpen(false);
  };

  const handleSignOut = () => {
    // Stubbed sign out function - will be implemented with NextAuth
    alert('Sign out functionality will be implemented with authentication');
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

          {/* Brew Digital branding - Always visible */}
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.brewdigital.com/favicons/brewdigitalstacked_black.svg"
              alt="Brew Digital"
              className="h-7 w-auto"
            />
          </div>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <span className="text-xs text-slate-400 tracking-wide uppercase hidden sm:block">
            Client Portal
          </span>
        </div>

        {/* Right: Client branding + User Menu */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 hidden sm:block">
            {companyName}
          </span>
          {resolvedLogoUrl ? (
            <img
              src={resolvedLogoUrl}
              alt={companyName}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-100"
              onError={(e) => {
                // Hide broken image, reveal initials fallback sibling
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          {resolvedLogoUrl ? (
            <div
              className="h-8 w-8 rounded-full items-center justify-center text-white text-sm font-bold ring-1 ring-white/20"
              style={{ backgroundColor: clientColor, display: 'none' }}
            >
              {companyName.charAt(0)}
            </div>
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ring-1 ring-white/20"
              style={{ backgroundColor: clientColor }}
            >
              {companyName.charAt(0)}
            </div>
          )}
          
          <Separator orientation="vertical" className="h-5" />
          
          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <User className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigateToTab('settings')}>
                <User className="h-4 w-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToTab('settings')}>
                <Users className="h-4 w-4 mr-2" />
                Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
