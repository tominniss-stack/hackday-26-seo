'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PortalHeader } from '@/components/portal/portal-header';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { DashboardView } from '@/components/portal/dashboard-view';
import { DocumentsView } from '@/components/portal/documents-view';
import { RequestsView } from '@/components/portal/requests-view';
import { SettingsView } from '@/components/portal/settings-view';
import { ContextualSupportFAB } from '@/components/portal/contextual-support-fab';
import { generateThemePalette, getThemeStyles } from '@/lib/theme-engine';
import type { PortalTab } from '@/lib/portal-nav';
import { ShieldX } from 'lucide-react';

interface ClientData {
  id: string;
  company_name: string;
  primary_color_hex: string | null;
  logo_url: string | null;
  logo_storage_path: string | null;
  theme_overrides: Record<string, string> | null;
  secure_access_token: string;
  contact_name: string | null;
}

interface RecentReport {
  id: string;
  reporting_month: string;
  report_category: 'SEO' | 'PPC';
  published_status: 'published' | 'pending_approval' | 'draft';
  created_at: string;
}

function PortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.client_id as string;
  const accessKey = searchParams.get('access_key') || '';
  const activeTab = (searchParams.get('tab') as PortalTab) || 'dashboard';

  const [client, setClient] = useState<ClientData | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchClient() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) throw error;

        const clientData = data as unknown as ClientData;

        // Security: validate access token
        if (!accessKey || clientData.secure_access_token !== accessKey) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setClient(clientData);

        // Fetch the client's published reports for the dashboard (real data).
        const { data: reportRows, error: reportsError } = await supabase
          .from('reports')
          .select('id, reporting_month, report_category, published_status, created_at')
          .eq('client_id', clientId)
          .eq('published_status', 'published')
          .order('reporting_month', { ascending: false })
          .limit(6);

        if (reportsError) {
          console.error('Error fetching reports:', reportsError);
        } else if (reportRows) {
          setRecentReports(reportRows as unknown as RecentReport[]);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [clientId, accessKey]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
          <p className="text-sm text-slate-400">Loading portal...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (unauthorized || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldX className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Access Denied</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            This portal link is invalid or has expired. Please contact your account
            manager for an updated access link.
          </p>
        </div>
      </div>
    );
  }

  const clientColor = client.primary_color_hex || '#3b82f6';
  const themePalette = generateThemePalette(
    clientColor,
    client.theme_overrides || undefined
  );
  const themeStyles = getThemeStyles(themePalette);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            clientColor={clientColor}
            clientId={client.id}
            clientName={client.company_name}
            contactName={client.contact_name ?? undefined}
            accessKey={accessKey}
            recentReports={recentReports}
          />
        );
      case 'documents':
        return <DocumentsView clientColor={clientColor} />;
      case 'requests':
        return <RequestsView clientColor={clientColor} clientId={client.id} />;
      case 'settings':
        return <SettingsView clientColor={clientColor} clientId={client.id} />;
      default:
        return (
          <DashboardView
            clientColor={clientColor}
            clientId={client.id}
            clientName={client.company_name}
            contactName={client.contact_name ?? undefined}
            accessKey={accessKey}
            recentReports={recentReports}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={themeStyles}>
      <PortalHeader
        companyName={client.company_name}
        logoUrl={client.logo_url}
        logoStoragePath={client.logo_storage_path}
        clientColor={clientColor}
        clientId={clientId}
        accessKey={accessKey}
      />

      <div className="flex flex-1 overflow-hidden">
        <PortalSidebar
          clientColor={clientColor}
          clientId={clientId}
          accessKey={accessKey}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Contextual Support FAB */}
      <ContextualSupportFAB
        clientColor={clientColor}
        clientId={client.id}
        activeTab={activeTab}
      />
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
            <p className="text-sm text-slate-400">Loading portal...</p>
          </div>
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
