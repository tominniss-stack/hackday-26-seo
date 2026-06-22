'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ReportEditorMetrics } from '@/components/admin/report-editor-metrics';
import { ReportEditorAI } from '@/components/admin/report-editor-ai';
import { ReportEditorAnnotations } from '@/components/admin/report-editor-annotations';
import { ReportStatusBadge } from '@/components/admin/report-status-badge';
import { ReportPublishBar } from '@/components/admin/report-publish-bar';
import { WidgetVisibilityPanel } from '@/components/admin/widget-visibility-panel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Building2, RefreshCw } from 'lucide-react';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface NarrativeRow {
  id: string;
  section: 'executive' | 'technical' | 'traffic';
  final_text: string;
}

interface ReportData {
  id: string;
  reporting_month: string;
  published_status: 'draft' | 'pending_approval' | 'published';
  report_context_prompt: string | null;
  analyst_notes: Record<string, string> | null;
  visible_widgets: Record<string, boolean> | null;
  client: {
    id: string;
    company_name: string;
    primary_color_hex: string | null;
    secure_access_token: string;
  };
  metrics: Array<{ id: string; data_json: UnifiedMetrics }>;
  narrative: NarrativeRow[];
}

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchReport = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reports')
        .select('*, client:clients(*), metrics:metrics_snapshots(*), narrative:narratives(*)')
        .eq('id', reportId)
        .single();
      if (error) throw error;
      setReport(data as ReportData);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportId]);

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync/report-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      await fetchReport();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      alert(msg);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Report not found.</p>
      </div>
    );
  }

  const metrics = (report.metrics?.[0]?.data_json ?? {}) as UnifiedMetrics;
  const formatMonth = (d: string) => new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-slate-900">
                {formatMonth(report.reporting_month)} Report
              </h1>
              <ReportStatusBadge status={report.published_status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {report.client.company_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatMonth(report.reporting_month)}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSyncData} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Live Data'}
          </Button>
        </div>

        {/* Two-column workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Data + Annotations */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Data Overview
              </h2>
              <ReportEditorMetrics metrics={metrics} />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Analyst Notes
              </h2>
              <ReportEditorAnnotations
                reportId={reportId}
                initialNotes={report.analyst_notes ?? {}}
                onSaved={fetchReport}
              />
            </div>
          </div>

          {/* Right: AI Narrative Sections */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              AI Narrative Sections
            </h2>
            <ReportEditorAI
              reportId={reportId}
              narratives={report.narrative ?? []}
              onUpdate={fetchReport}
            />
          </div>
        </div>
      </div>

      {/* Sticky publish bar */}
      <ReportPublishBar
        reportId={reportId}
        clientId={report.client.id}
        accessKey={report.client.secure_access_token}
        status={report.published_status}
        onStatusChange={fetchReport}
      />
    </div>
  );
}
