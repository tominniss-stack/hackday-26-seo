'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PortalHeader } from '@/components/portal/portal-header';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { SEOView } from '@/components/portal/seo-view';
import { PPCView } from '@/components/portal/ppc-view';
import { DocumentsView } from '@/components/portal/documents-view';
import { RequestsView } from '@/components/portal/requests-view';
import type { PortalTab } from '@/lib/portal-nav';
import { ShieldX } from 'lucide-react';

interface ReportData {
  id: string;
  reporting_month: string;
  published_status: string;
  created_at: string;
  report_context_prompt: string | null;
  client: {
    id: string;
    company_name: string;
    primary_color_hex: string | null;
    logo_url: string | null;
    custom_ai_prompt: string | null;
    secure_access_token: string;
  };
  metrics: Array<{
    id: string;
    metric_category: string;
    data_json: Record<string, unknown>;
  }>;
  narrative: Array<{
    id: string;
    final_text: string;
  }>;
}

function PortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params.id as string;
  const accessKey = searchParams.get('key') || '';
  const activeTab = (searchParams.get('tab') as PortalTab) || 'seo';

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            client:clients(*),
            metrics:metrics_snapshots(*),
            narrative:narratives(*)
          `)
          .eq('id', reportId)
          .single();

        if (error) throw error;

        const reportData = data as unknown as ReportData;

        // Security: validate access token
        if (!accessKey || reportData.client.secure_access_token !== accessKey) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setReport(reportData);
      } catch (error) {
        console.error('Error fetching report:', error);
        setUnauthorized(true);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId, accessKey]);

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
  if (unauthorized || !report) {
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

  const clientColor = report.client.primary_color_hex || '#3b82f6';
  const metrics = report.metrics?.[0]?.data_json || {};
  const narrativeText = report.narrative?.[0]?.final_text || '';
  const reportType = (report as any).report_type ?? 'monthly';
  const visibleWidgets = (report as any).visible_widgets ?? undefined;

  const renderContent = () => {
    switch (activeTab) {
      case 'seo':
        return (
          <SEOView
            metrics={metrics}
            narrativeText={narrativeText}
            clientColor={clientColor}
            reportingMonth={report.reporting_month}
            visibleWidgets={visibleWidgets}
            reportType={reportType}
          />
        );
      case 'ppc':
        return (
          <PPCView
            clientColor={clientColor}
            reportingMonth={report.reporting_month}
          />
        );
      case 'documents':
        return <DocumentsView clientColor={clientColor} />;
      case 'requests':
        return <RequestsView clientColor={clientColor} clientId={report.client.id} />;
      default:
        return (
          <SEOView
            metrics={metrics}
            narrativeText={narrativeText}
            clientColor={clientColor}
            reportingMonth={report.reporting_month}
            visibleWidgets={visibleWidgets}
            reportType={reportType}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader
        companyName={report.client.company_name}
        logoUrl={report.client.logo_url}
        clientColor={clientColor}
        reportId={reportId}
        accessKey={accessKey}
      />

      <div className="flex flex-1 overflow-hidden">
        <PortalSidebar
          clientColor={clientColor}
          reportId={reportId}
          accessKey={accessKey}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl">
            {renderContent()}
          </div>
        </main>
      </div>
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
