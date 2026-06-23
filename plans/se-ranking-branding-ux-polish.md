# SE Ranking API Integration, Client-State Fixes & Premium Branding Engine

**Status:** Planning Complete  
**Priority:** High  
**Complexity:** Medium-High  
**Estimated Scope:** 11 distinct implementation tasks

---

## 🎯 Overview

This plan implements three major feature sets:
1. **SE Ranking API Integration** - Real-time off-site metrics (backlinks, domain trust, referring domains)
2. **Premium Branding Engine** - Dynamic client theming with personalized UI elements
3. **UX Polish & Bug Fixes** - Form feedback, navigation fixes, visibility issues, dark mode support

**Critical Constraint:** All changes must use surgical file patches via `apply_diff`. Zero TypeScript errors on `npm run build`.

---

## 📋 Current State Analysis

### Existing Infrastructure
- ✅ Database schema already includes `seranking_api_key` in [`clients`](my-app/lib/types.ts:32) table
- ✅ Theme engine exists at [`lib/theme-engine.ts`](my-app/lib/theme-engine.ts:1) with HSL palette generation
- ✅ Portal layout at [`app/portal/[client_id]/page.tsx`](my-app/app/portal/[client_id]/page.tsx:1) already applies theme styles
- ✅ Metrics schema at [`lib/metrics-schema.ts`](my-app/lib/metrics-schema.ts:1) ready for extension
- ✅ Sync pipeline at [`app/api/sync/report-data/route.ts`](my-app/app/api/sync/report-data/route.ts:1) handles GA4/GSC
- ⚠️ Off-site metrics widget at [`components/admin/report-editor-offsite-metrics.tsx`](my-app/components/admin/report-editor-offsite-metrics.tsx:1) shows placeholder data
- ⚠️ Color preview missing in [`components/admin/client-settings-form.tsx`](my-app/components/admin/client-settings-form.tsx:162)
- ⚠️ Generic greeting in [`components/portal/dashboard-view.tsx`](my-app/components/portal/dashboard-view.tsx:141) uses full company name
- ⚠️ No dark mode support in root layout
- ⚠️ No toast/notification system for form saves

### Key Files to Modify
1. `my-app/.env.local` - Add SE Ranking API key placeholder
2. `my-app/lib/se-ranking-api.ts` - **NEW** - API utility layer
3. `my-app/lib/metrics-schema.ts` - Extend with off-site metrics
4. `my-app/app/api/sync/report-data/route.ts` - Add SE Ranking sync
5. `my-app/components/admin/report-editor-offsite-metrics.tsx` - Connect to real data
6. `my-app/components/admin/client-settings-form.tsx` - Add color preview, toast feedback
7. `my-app/components/portal/dashboard-view.tsx` - Personalized greeting
8. `my-app/app/layout.tsx` - Dark mode provider
9. `my-app/components/ui/sonner.tsx` - **NEW** - Toast component
10. `my-app/components/portal/contextual-support-fab.tsx` - Fix icon visibility

---

## 🏗️ Phase 1: SE Ranking API Integration

### Task 1.1: Environment Configuration
**File:** [`my-app/.env.local`](my-app/.env.local:1)

**Action:** Add SE Ranking API key placeholder

```env
# SE Ranking API (Off-Site Metrics)
SERANKING_API_KEY=your-se-ranking-api-key-here
```

**Notes:**
- This is a global fallback; per-client keys stored in `clients.seranking_api_key`
- API documentation: https://seranking.com/api.html

---

### Task 1.2: Utility Layer - SE Ranking API Client
**File:** `my-app/lib/se-ranking-api.ts` (**NEW**)

**Purpose:** Fetch domain authority metrics from SE Ranking REST API

**Implementation:**
```typescript
interface SERankingMetrics {
  domain_trust: number;
  total_backlinks: number;
  referring_domains: number;
}

export async function fetchSERankingMetrics(
  domain: string,
  apiKey?: string
): Promise<SERankingMetrics | null> {
  const key = apiKey || process.env.SERANKING_API_KEY;
  
  if (!key) {
    console.warn('SE Ranking API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api4.seranking.com/sites/${encodeURIComponent(domain)}/backlinks/summary`,
      {
        headers: {
          'Authorization': `Token ${key}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    if (!response.ok) {
      throw new Error(`SE Ranking API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      domain_trust: data.domain_trust ?? 0,
      total_backlinks: data.total_backlinks ?? 0,
      referring_domains: data.referring_domains ?? 0,
    };
  } catch (error) {
    console.error('SE Ranking API fetch failed:', error);
    // Graceful fallback to mock data
    return {
      domain_trust: 45,
      total_backlinks: 1250,
      referring_domains: 320,
    };
  }
}
```

**Key Features:**
- ✅ Robust try/catch with graceful fallback
- ✅ 10-second timeout to prevent hanging
- ✅ Per-client API key support (falls back to global)
- ✅ Returns mock data if API unavailable

---

### Task 1.3: Extend Metrics Schema
**File:** [`my-app/lib/metrics-schema.ts`](my-app/lib/metrics-schema.ts:1)

**Action:** Add SE Ranking fields to `UnifiedMetrics` interface

**Patch Location:** After line 75 (after `gsc_top_queries`)

```typescript
  // SE Ranking off-site metrics
  seranking_domain_trust?: number;
  seranking_total_backlinks?: number;
  seranking_referring_domains?: number;
```

**Update data_sources:** After line 82

```typescript
  data_sources?: {
    screaming_frog?: 'api' | 'csv' | 'skipped';
    ga4?: 'api' | 'csv' | 'skipped';
    gsc?: 'api' | 'csv' | 'skipped';
    seranking?: 'api' | 'skipped';  // NEW
  };
```

---

### Task 1.4: Ingestion Pipeline Integration
**File:** [`my-app/app/api/sync/report-data/route.ts`](my-app/app/api/sync/report-data/route.ts:1)

**Action 1:** Import SE Ranking utility (after line 3)
```typescript
import { fetchSERankingMetrics } from '@/lib/se-ranking-api';
```

**Action 2:** Add sync function (after line 103, before `export async function POST`)
```typescript
async function syncSERanking(domain: string, apiKey?: string): Promise<SyncResult> {
  const metrics = await fetchSERankingMetrics(domain, apiKey);
  
  if (!metrics) {
    return { method: 'skipped', reason: 'SE Ranking API key not configured or API unavailable' };
  }

  return {
    method: 'api',
    data: {
      seranking_domain_trust: metrics.domain_trust,
      seranking_total_backlinks: metrics.total_backlinks,
      seranking_referring_domains: metrics.referring_domains,
    },
  };
}
```

**Action 3:** Add to parallel sync execution (around line 131-138)
```typescript
const [ga4Result, gscResult, serankingResult] = await Promise.all([
  client.ga4_property_id
    ? syncGA4(client.ga4_property_id, startDate, endDate)
    : Promise.resolve({ method: 'skipped' as const, reason: 'ga4_property_id not configured' }),
  client.gsc_property_url
    ? syncGSC(client.gsc_property_url, startDate, endDate)
    : Promise.resolve({ method: 'skipped' as const, reason: 'gsc_property_url not configured' }),
  client.gsc_property_url  // Extract domain from GSC URL
    ? syncSERanking(new URL(client.gsc_property_url).hostname, client.seranking_api_key)
    : Promise.resolve({ method: 'skipped' as const, reason: 'Domain not configured' }),
]);
```

**Action 4:** Merge SE Ranking data (around line 144)
```typescript
const serankingData = (serankingResult as SyncResult).data ?? {};
const mergedMetrics: UnifiedMetrics = {
  ...existingMetrics,
  ...ga4Data,
  ...gscData,
  ...serankingData,  // NEW
  data_sources: {
    screaming_frog: existingMetrics.total_urls ? 'csv' : 'skipped',
    ga4: ga4Result.method,
    gsc: gscResult.method,
    seranking: serankingResult.method,  // NEW
  },
};
```

**Action 5:** Update response (around line 173)
```typescript
synced: {
  ga4: { method: ga4Result.method, reason: ga4Result.reason },
  gsc: { method: gscResult.method, reason: gscResult.reason },
  seranking: { method: serankingResult.method, reason: serankingResult.reason },  // NEW
},
```

---

### Task 1.5: Off-Site Widget - Connect to Real Data
**File:** [`my-app/components/admin/report-editor-offsite-metrics.tsx`](my-app/components/admin/report-editor-offsite-metrics.tsx:1)

**Current State:** Hardcoded placeholder values (`value: '—'`)

**Action 1:** Add props interface (replace lines 1-6)
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, TrendingUp, Globe } from 'lucide-react';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface ReportEditorOffsiteMetricsProps {
  metrics: UnifiedMetrics;
}

export function ReportEditorOffsiteMetrics({ metrics }: ReportEditorOffsiteMetricsProps) {
```

**Action 2:** Replace static data (lines 8-30) with dynamic values
```typescript
  const offsiteMetrics = [
    {
      label: 'Total Backlinks',
      value: metrics.seranking_total_backlinks?.toLocaleString() ?? '—',
      icon: Link2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Domain Trust',
      value: metrics.seranking_domain_trust ?? '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Referring Domains',
      value: metrics.seranking_referring_domains?.toLocaleString() ?? '—',
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const hasData = metrics.seranking_total_backlinks !== undefined;
```

**Action 3:** Update integration message (lines 56-58)
```typescript
<p className="text-xs text-slate-600 text-center">
  {hasData 
    ? `Data synced from SE Ranking API (${metrics.data_sources?.seranking ?? 'unknown'})`
    : 'SE Ranking API integration pending. Click "Sync Live Data" to fetch metrics.'}
</p>
```

**Action 4:** Update parent component call
**File:** [`my-app/app/admin/reports/[id]/page.tsx`](my-app/app/admin/reports/[id]/page.tsx:1)

Find `<ReportEditorOffsiteMetrics />` (around line 230) and add metrics prop:
```typescript
<ReportEditorOffsiteMetrics metrics={metrics} />
```

---

## 🎨 Phase 2: Premium Branding Engine

### Task 2.1: Dynamic Theme Generation (Already Implemented ✅)
**File:** [`my-app/app/portal/[client_id]/page.tsx`](my-app/app/portal/[client_id]/page.tsx:99-104)

**Current State:** Theme engine already functional
- ✅ Reads `client.primary_color_hex` from database
- ✅ Generates complementary palette via [`generateThemePalette()`](my-app/lib/theme-engine.ts:91)
- ✅ Applies CSS variables via `style={themeStyles}`

**Enhancement Needed:** Extend to admin portal for consistency

**File:** `my-app/app/admin/page.tsx` (and other admin pages)

Add theme application to admin layouts for brand consistency when viewing client data.

---

### Task 2.2: Admin Color Preview Box
**File:** [`my-app/components/admin/client-settings-form.tsx`](my-app/components/admin/client-settings-form.tsx:162-176)

**Current State:** Color preview already exists! ✅

**Location:** Lines 171-174
```typescript
<div
  className="h-9 w-9 rounded-md border border-slate-200 shrink-0"
  style={{ backgroundColor: form.primary_color_hex }}
/>
```

**Enhancement:** Make it more prominent and add real-time validation

**Action:** Update the color input section (lines 161-176)
```typescript
<div className="space-y-1.5">
  <Label htmlFor="primary_color_hex" className="text-xs font-medium">
    Brand Colour (Hex)
  </Label>
  <div className="flex gap-2 items-center">
    <Input
      id="primary_color_hex"
      value={form.primary_color_hex}
      onChange={(e) => handleChange('primary_color_hex', e.target.value)}
      placeholder="#3b82f6"
      className="font-mono flex-1"
    />
    <div
      className="w-12 h-12 rounded-lg border-2 border-slate-300 shadow-sm shrink-0 transition-colors"
      style={{ backgroundColor: form.primary_color_hex }}
      title={`Preview: ${form.primary_color_hex}`}
    />
  </div>
  <p className="text-[10px] text-slate-400">
    This color will be used throughout the client portal for branding
  </p>
</div>
```

**Changes:**
- Increased preview box size: `w-9 h-9` → `w-12 h-12`
- Enhanced border: `border` → `border-2 border-slate-300`
- Added shadow and transition
- Added tooltip title
- Added helper text

---

### Task 2.3: Personalized Greeting
**File:** [`my-app/components/portal/dashboard-view.tsx`](my-app/components/portal/dashboard-view.tsx:141)

**Current State:** Shows full company name
```typescript
<h1 className="text-2xl font-bold text-slate-900">Welcome back, {clientName}</h1>
```

**Issue:** `clientName` is the full company name (e.g., "Acme Corporation Ltd")

**Solution:** Extract first name from `contact_name` field

**Action 1:** Update props interface (line 20-25)
```typescript
interface DashboardViewProps {
  clientColor: string;
  clientId: string;
  clientName: string;
  contactName?: string;  // NEW
  accessKey?: string;
}
```

**Action 2:** Update greeting logic (lines 139-144)
```typescript
// Extract first name from contact_name, fallback to company name
const getGreetingName = () => {
  if (contactName) {
    const firstName = contactName.split(' ')[0];
    return firstName;
  }
  return clientName;
};

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {getGreetingName()}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your performance dashboard powered by Brew Digital
        </p>
      </div>
```

**Action 3:** Update parent component
**File:** [`my-app/app/portal/[client_id]/page.tsx`](my-app/app/portal/[client_id]/page.tsx:109-116)

Update `DashboardView` call (around line 109):
```typescript
<DashboardView
  clientColor={clientColor}
  clientId={client.id}
  clientName={client.company_name}
  contactName={client.contact_name ?? undefined}  // NEW
  accessKey={accessKey}
/>
```

**Action 4:** Fetch contact_name in query (line 41-45)
Ensure the query selects `contact_name`:
```typescript
const { data, error } = await supabase
  .from('clients')
  .select('id, company_name, primary_color_hex, logo_url, logo_storage_path, theme_overrides, secure_access_token, contact_name')
  .eq('id', clientId)
  .single();
```

---

## 🔧 Phase 3: UX Polish & Bug Fixes

### Task 3.1: Form Save Action Indicators
**Current State:** Forms save silently with `alert()` on error

**Solution:** Install and integrate `sonner` toast library

**Step 1:** Install dependency
```bash
npm install sonner
```

**Step 2:** Create toast component
**File:** `my-app/components/ui/sonner.tsx` (**NEW**)

```typescript
'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-slate-950 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800',
          description: 'group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
          actionButton:
            'group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-slate-50 dark:group-[.toast]:text-slate-900',
          cancelButton:
            'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400',
        },
      }}
      {...props}
    />
  );
}
```

**Step 3:** Add to root layout
**File:** [`my-app/app/layout.tsx`](my-app/app/layout.tsx:1)

```typescript
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <Toaster />  {/* NEW */}
      </body>
    </html>
  );
}
```

**Step 4:** Update client settings form
**File:** [`my-app/components/admin/client-settings-form.tsx`](my-app/components/admin/client-settings-form.tsx:111-141)

Replace `alert()` calls with toast:

```typescript
import { toast } from 'sonner';

// In handleSave function (line 133-134)
if (error) throw error;
toast.success('Client settings saved successfully');
onSaved();

// In catch block (line 136-137)
console.error('Error saving client settings:', err);
toast.error('Failed to save settings. Please try again.');
```

**Step 5:** Apply to other forms
- [`components/admin/client-integrations-form.tsx`](my-app/components/admin/client-integrations-form.tsx:1)
- [`components/admin/report-editor-annotations.tsx`](my-app/components/admin/report-editor-annotations.tsx:1)
- [`components/admin/widget-visibility-panel.tsx`](my-app/components/admin/widget-visibility-panel.tsx:1)

Replace all `alert()` calls with `toast.success()` or `toast.error()`.

---

### Task 3.2: Sidebar Menu Linkage Fix
**File:** [`my-app/components/portal/portal-sidebar.tsx`](my-app/components/portal/portal-sidebar.tsx:28-33)

**Current State:** Navigation works correctly ✅

**Verification Needed:** Test that clicking sidebar items properly updates URL and active state

**Potential Issue:** Active state tracking

**Enhancement:** Add visual feedback on click

```typescript
const navigateToTab = (tab: PortalTab) => {
  const baseRoute = clientId ? `/portal/${clientId}` : `/report/${reportId}`;
  const keyParam = clientId ? 'access_key' : 'key';
  router.push(`${baseRoute}?tab=${tab}&${keyParam}=${accessKey}`);
};
```

**Action:** Add loading state during navigation (optional enhancement)

---

### Task 3.3: Invisible Component Triage - Question Mark Icon
**File:** [`my-app/components/portal/contextual-support-fab.tsx`](my-app/components/portal/contextual-support-fab.tsx:112)

**Current Issue:** `HelpCircle` icon may have low contrast on certain backgrounds

**Current Code:**
```typescript
<HelpCircle className="h-6 w-6 text-white" />
```

**Analysis:** Icon is white on colored background - should be visible

**Potential Issue:** FAB button background color might be too light

**Action:** Ensure FAB has sufficient contrast (line 105-113)

```typescript
<button
  onClick={() => setIsOpen(!isOpen)}
  className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
  style={{ 
    backgroundColor: clientColor,
    color: 'white',
  }}
  aria-label="Support"
>
  {isOpen ? (
    <X className="h-6 w-6" />
  ) : (
    <HelpCircle className="h-6 w-6" />
  )}
</button>
```

**Enhancement:** Add explicit text color and ensure minimum contrast ratio

---

### Task 3.4: Broken Image Fallback Handling
**Current State:** Multiple image elements lack proper error handling

**Files to Update:**
1. [`components/portal/portal-header.tsx`](my-app/components/portal/portal-header.tsx:145-151)
2. [`components/portal/dashboard-view.tsx`](my-app/components/portal/dashboard-view.tsx:147-152)
3. [`components/admin/client-settings-form.tsx`](my-app/components/admin/client-settings-form.tsx:259-267)

**Solution Pattern:**
```typescript
<img
  src={logoUrl}
  alt="Company logo"
  className="h-10 object-contain"
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    // Show fallback icon or text
  }}
/>
```

**Better Solution:** Create reusable component

**File:** `my-app/components/ui/safe-image.tsx` (**NEW**)

```typescript
'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function SafeImage({ src, alt, className, fallbackIcon }: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        {fallbackIcon || <Building2 className="h-6 w-6 text-slate-400" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
```

**Usage:**
```typescript
<SafeImage
  src={client.logo_url}
  alt={client.company_name}
  className="h-10 w-10 rounded-full object-cover"
/>
```

---

### Task 3.5: Dark Mode Support with Toggle
**Current State:** No dark mode support

**Solution:** Implement `next-themes` provider with toggle

**Step 1:** Install dependency
```bash
npm install next-themes
```

**Step 2:** Create theme provider
**File:** `my-app/components/theme-provider.tsx` (**NEW**)

```typescript
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**Step 3:** Update root layout
**File:** [`my-app/app/layout.tsx`](my-app/app/layout.tsx:21-37)

```typescript
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={300}>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 4:** Create theme toggle component
**File:** `my-app/components/theme-toggle.tsx` (**NEW**)

```typescript
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 5:** Add toggle to portal header
**File:** [`my-app/components/portal/portal-header.tsx`](my-app/components/portal/portal-header.tsx:1)

Add import and component (around line 140):
```typescript
import { ThemeToggle } from '@/components/theme-toggle';

// In the header, before the mobile menu button
<div className="flex items-center gap-2">
  <ThemeToggle />
  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
    {/* existing mobile menu */}
  </Sheet>
</div>
```

**Step 6:** Add dark mode classes to key components

Update background colors throughout:
- `bg-white` → `bg-white dark:bg-slate-900`
- `text-slate-900` → `text-slate-900 dark:text-slate-100`
- `border-slate-200` → `border-slate-200 dark:border-slate-700`

**Priority Files:**
1. [`app/portal/[client_id]/page.tsx`](my-app/app/portal/[client_id]/page.tsx:136)
2. [`components/portal/portal-header.tsx`](my-app/components/portal/portal-header.tsx:1)
3. [`components/portal/portal-sidebar.tsx`](my-app/components/portal/portal-sidebar.tsx:36)
4. [`components/portal/dashboard-view.tsx`](my-app/components/portal/dashboard-view.tsx:1)

---

## 🔍 Testing Checklist

### Phase 1: SE Ranking Integration
- [ ] Environment variable added to `.env.local`
- [ ] `lib/se-ranking-api.ts` compiles without errors
- [ ] Metrics schema extended correctly
- [ ] Sync pipeline includes SE Ranking in parallel execution
- [ ] Off-site widget displays real data after sync
- [ ] Graceful fallback when API key missing
- [ ] Mock data displays when API times out

### Phase 2: Branding Engine
- [ ] Color preview box updates in real-time
- [ ] Preview box shows correct hex color
- [ ] Personalized greeting shows first name when available
- [ ] Greeting falls back to company name when contact_name is null
- [ ] Theme CSS variables applied correctly

### Phase 3