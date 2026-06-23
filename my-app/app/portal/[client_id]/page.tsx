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
import { SEOView } from '@/components/portal/seo-view';
import { PPCView } from '@/components/portal/ppc-view';
import { ContextualSupportFAB } from '@/components/portal/contextual-support-fab';
import { generateThemePalette, getThemeStyles } from '@/lib/theme-engine';
import type { PortalTab } from '@/lib/portal-nav';
import type { UnifiedMetrics, PpcCampaign } from '@/lib/metrics-schema';
import type { ManualPriority } from '@/lib/priority-calculator';
import { ShieldX, BarChart3, Target, ArrowUpRight } from 'lucide-react';

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

interface CategoryReport {
  id: string;
  reporting_month: string;
  report_type?: 'monthly' | 'quarterly';
  metrics: Array<{ data_json: UnifiedMetrics }>;
  narrative: Array<{ section: string; final_text: string }>;
}

function PortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.client_id as string;
  const accessKey = searchParams.get('access_key') || '';
  const activeTab = (searchParams.get('tab') as PortalTab) || 'dashboard';

  const [client, setClient] = useState<ClientData | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [seoReport, setSeoReport] = useState<CategoryReport | null>(null);
  const [ppcReport, setPpcReport] = useState<CategoryReport | null>(null);
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

        // Fetch the most-recent PUBLISHED report per category (SEO + PPC), with
        // its metrics + narrative, to power the sidebar SEO/PPC tabs.
        const fetchLatestByCategory = async (
          category: 'SEO' | 'PPC'
        ): Promise<CategoryReport | null> => {
          const { data: rows } = await supabase
            .from('reports')
            .select('id, reporting_month, report_type, metrics:metrics_snapshots(data_json), narrative:narratives(section, final_text)')
            .eq('client_id', clientId)
            .eq('report_category', category)
            .eq('published_status', 'published')
            .order('reporting_month', { ascending: false })
            .limit(1);
          return (rows?.[0] as unknown as CategoryReport) ?? null;
        };

        const [seo, ppc] = await Promise.all([
          fetchLatestByCategory('SEO'),
          fetchLatestByCategory('PPC'),
        ]);
        setSeoReport(seo);
        setPpcReport(ppc);
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

  // Compute the latest SEO technical-health score (same formula as the report
  // view) so the dashboard can show it alongside the DORA score.
  const seoMetrics = (seoReport?.metrics?.[0]?.data_json ?? {}) as Record<string, number | undefined>;
  const seoTotalUrls = seoMetrics.total_urls ?? 0;
  const seoHealthScore =
    seoReport && seoTotalUrls > 0
      ? Math.max(0, 100 - (((seoMetrics.client_errors_4xx ?? 0) + (seoMetrics.server_errors_5xx ?? 0)) / seoTotalUrls) * 100)
      : seoReport
        ? 100
        : null;

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
            seoHealthScore={seoHealthScore}
            seoHealthMonth={seoReport?.reporting_month ?? null}
          />
        );
      case 'seo': {
        if (!seoReport) {
          return (
            <ServiceUpsell
              clientColor={clientColor}
              Icon={BarChart3}
              title="No SEO reports published yet"
              body="Your search performance dashboard will appear here as soon as your first SEO report is published. Want to climb the rankings sooner? Our SEO specialists can audit your site, uncover quick wins, and build a roadmap for sustainable organic growth."
              ctaLabel="Explore our SEO services"
              ctaHref="https://brewdigital.com/services/digital-marketing/search-engine-optimisation"
            />
          );
        }
        return (
          <SEOView
            metrics={(seoReport.metrics?.[0]?.data_json ?? {}) as Record<string, unknown>}
            narrativeText={seoReport.narrative?.find((n) => n.section === 'executive')?.final_text ?? ''}
            trafficNarrative={seoReport.narrative?.find((n) => n.section === 'traffic')?.final_text ?? ''}
            technicalNarrative={seoReport.narrative?.find((n) => n.section === 'technical')?.final_text ?? ''}
            clientColor={clientColor}
            reportingMonth={seoReport.reporting_month}
            reportType={seoReport.report_type}
            manualPriorities={(seoReport.metrics?.[0]?.data_json as { manual_priorities?: ManualPriority[] } | undefined)?.manual_priorities ?? null}
          />
        );
      }
      case 'ppc': {
        if (!ppcReport) {
          return (
            <ServiceUpsell
              clientColor={clientColor}
              Icon={Target}
              title="No paid media reports published yet"
              body="There are currently no PPC reports for your account. If you're looking to drive qualified traffic and conversions through paid search and paid social, our performance marketing team would love to help you make every click count."
              ctaLabel="Discover our PPC & Paid Social services"
              ctaHref="https://brewdigital.com/services/digital-marketing/pay-per-click-ppc-and-paid-social-advertising"
            />
          );
        }
        return (
          <PPCView
            clientColor={clientColor}
            reportingMonth={ppcReport.reporting_month}
            campaigns={(ppcReport.metrics?.[0]?.data_json as { ppc_campaigns?: PpcCampaign[] } | undefined)?.ppc_campaigns}
          />
        );
      }
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
            seoHealthScore={seoHealthScore}
            seoHealthMonth={seoReport?.reporting_month ?? null}
          />
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col" style={themeStyles}>
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

/**
 * On-brand "service upsell" empty state shown when a client has no published
 * report for a given category (SEO/PPC). Uses the client's brand colour for
 * accents and links to the relevant Brew Digital service page.
 */
function ServiceUpsell({
  clientColor,
  Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  clientColor: string;
  Icon: React.ElementType;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${clientColor}14`, color: clientColor }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{body}</p>
      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: clientColor }}
      >
        {ctaLabel}
        <ArrowUpRight className="h-4 w-4" />
      </a>
      <p className="mt-4 text-xs text-slate-400">
        Or reach out to your account manager — we&apos;re always happy to help.
      </p>
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
