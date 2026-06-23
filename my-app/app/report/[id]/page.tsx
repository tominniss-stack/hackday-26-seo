'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SEOView } from '@/components/portal/seo-view';
import { PPCView } from '@/components/portal/ppc-view';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { ContextualSupportFAB } from '@/components/portal/contextual-support-fab';
import { Button } from '@/components/ui/button';
import { generateThemePalette, getThemeStyles } from '@/lib/theme-engine';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { resolveLogoUrl } from '@/lib/storage-helpers';

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
    logo_storage_path: string | null;
    theme_overrides: Record<string, string> | null;
    custom_ai_prompt: string | null;
    secure_access_token: string;
  };
  manual_priorities: import('@/lib/priority-calculator').ManualPriority[] | null;
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
  const router = useRouter();
  const reportId = params.id as string;
  const accessKey = searchParams.get('key') || '';
  const viewType = searchParams.get('view') || 'seo'; // 'seo' or 'ppc'
  const isPreview = searchParams.get('preview') === 'true';

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const handleBackToDashboard = () => {
    if (report) {
      router.push(`/portal/${report.client.id}?access_key=${accessKey}`);
    }
  };

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

        // Allow preview mode to bypass published status check
        if (!isPreview && reportData.published_status !== 'published') {
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
  const themePalette = generateThemePalette(
    clientColor,
    report.client.theme_overrides || undefined
  );
  const themeStyles = getThemeStyles(themePalette);
  
  const metrics = report.metrics?.[0]?.data_json || {};
  const narrativeText = report.narrative?.[0]?.final_text || '';
  const reportType = (report as any).report_type ?? 'monthly';
  const visibleWidgets = (report as any).visible_widgets ?? undefined;

  const resolvedLogoUrl = resolveLogoUrl(
    report.client.logo_url,
    report.client.logo_storage_path || null
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={themeStyles}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              {resolvedLogoUrl ? (
                <img
                  src={resolvedLogoUrl}
                  alt={report.client.company_name}
                  className="h-8 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              {resolvedLogoUrl ? (
                <div
                  className="h-10 w-10 rounded-lg items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: clientColor, display: 'none' }}
                >
                  {report.client.company_name.charAt(0)}
                </div>
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: clientColor }}
                >
                  {report.client.company_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Back to Dashboard Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDashboard}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Main content */}
      <div className="flex flex-1 overflow-hidden">
        <PortalSidebar
          clientColor={clientColor}
          reportId={reportId}
          accessKey={accessKey}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            {viewType === 'ppc' ? (
              <PPCView
                clientColor={clientColor}
                reportingMonth={report.reporting_month}
                campaigns={(metrics as { ppc_campaigns?: import('@/lib/metrics-schema').PpcCampaign[] }).ppc_campaigns}
              />
            ) : (
              <SEOView
                metrics={metrics}
                narrativeText={narrativeText}
                clientColor={clientColor}
                reportingMonth={report.reporting_month}
                visibleWidgets={visibleWidgets}
                reportType={reportType}
                manualPriorities={report.manual_priorities}
              />
            )}
          </div>
        </main>
      </div>

      {/* Contextual Support FAB */}
      <ContextualSupportFAB
        clientColor={clientColor}
        clientId={report.client.id}
        reportingMonth={report.reporting_month}
        activeTab={viewType === 'ppc' ? 'ppc' : 'seo'}
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
