'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ReportEditorKPISummary } from '@/components/admin/report-editor-kpi-summary';
import { ReportEditorTrafficCharts } from '@/components/admin/report-editor-traffic-charts';
import { ReportEditorTechnicalMetrics } from '@/components/admin/report-editor-technical-metrics';
import { ReportEditorOffsiteMetrics } from '@/components/admin/report-editor-offsite-metrics';
import { ReportEditorNarrativeSection } from '@/components/admin/report-editor-narrative-section';
import { ReportStatusBadge } from '@/components/admin/report-status-badge';
import { ReportPublishBar } from '@/components/admin/report-publish-bar';
import { ReportEditorPriorities } from '@/components/admin/report-editor-priorities';
import type { ManualPriority } from '@/lib/priority-calculator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Building2, RefreshCw, ExternalLink, Save, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
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
  manual_priorities: ManualPriority[] | null;
  client: {
    id: string;
    company_name: string;
    primary_color_hex: string | null;
    secure_access_token: string;
    approval_required: boolean;
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
  const [reportContext, setReportContext] = useState('');
  const [contextHasChanges, setContextHasChanges] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  const fetchReport = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reports')
        .select('*, client:clients(*), metrics:metrics_snapshots(*), narrative:narratives(*)')
        .eq('id', reportId)
        .single();
      if (error) throw error;
      setReport(data as ReportData);
      setReportContext(data.report_context_prompt || '');
      setContextHasChanges(false);
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

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    const sections: Array<'executive' | 'technical' | 'traffic'> = ['executive', 'technical', 'traffic'];
    let succeeded = 0;
    try {
      // Generate each section sequentially to stay within rate limits.
      for (const section of sections) {
        const res = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: reportId, section }),
        });
        const result = await res.json();
        if (!res.ok) {
          toast.error(`${section}: ${result.error ?? 'generation failed'}`);
        } else {
          succeeded += 1;
        }
      }
      await fetchReport();
      if (succeeded === sections.length) {
        toast.success('AI analysis generated for all sections');
      } else if (succeeded > 0) {
        toast.warning(`Generated ${succeeded} of ${sections.length} sections`);
      } else {
        toast.error('AI generation failed for all sections');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      toast.error(msg);
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleSaveContext = async () => {
    setSavingContext(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .update({ report_context_prompt: reportContext })
        .eq('id', reportId);
      if (error) throw error;
      setContextHasChanges(false);
      await fetchReport();
    } catch (err) {
      alert('Failed to save context. Please try again.');
    } finally {
      setSavingContext(false);
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/report/${reportId}?preview=true&key=${report.client.secure_access_token}`, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Live Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleSyncData} disabled={syncing}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Live Data'}
            </Button>
            <Button size="sm" onClick={handleGenerateAll} disabled={generatingAll}>
              {generatingAll ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              {generatingAll ? 'Generating...' : 'Generate AI Analysis'}
            </Button>
          </div>
        </div>

        {/* Section-Based Grid Layout */}
        <div className="space-y-8">
          {/* Row 0: Report Context (Full Width) */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Report Context
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Provide month-specific context to guide AI narrative generation. This will be used alongside global settings, client background, and historical data.
                  </p>
                </div>
                {contextHasChanges && (
                  <Button size="sm" onClick={handleSaveContext} disabled={savingContext}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {savingContext ? 'Saving...' : 'Save Context'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={reportContext}
                onChange={(e) => {
                  setReportContext(e.target.value);
                  setContextHasChanges(e.target.value !== (report?.report_context_prompt || ''));
                }}
                placeholder="Example: 'This month we launched a new product line and ran a major PR campaign. Focus on traffic spikes from referral sources and new landing page performance.'"
                rows={3}
                className="resize-none text-sm"
                disabled={savingContext}
              />
            </CardContent>
          </Card>

          {/* Row 1: Top Priorities (Full Width, editable) */}
          <ReportEditorPriorities
            reportId={reportId}
            metrics={metrics}
            initialManual={report.manual_priorities}
            onUpdate={fetchReport}
          />

          {/* Row 2: KPI Summary + Executive Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportEditorKPISummary metrics={metrics} />
            <ReportEditorNarrativeSection
              reportId={reportId}
              section="executive"
              title="Executive Summary"
              description="High-level performance overview for the client"
              narrative={report.narrative.find(n => n.section === 'executive')}
              onUpdate={fetchReport}
            />
          </div>

          {/* Row 3: Traffic Charts + Traffic AI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportEditorTrafficCharts metrics={metrics} />
            <ReportEditorNarrativeSection
              reportId={reportId}
              section="traffic"
              title="Traffic & Visibility Insights"
              description="GA4 sessions, GSC queries, and channel performance"
              narrative={report.narrative.find(n => n.section === 'traffic')}
              onUpdate={fetchReport}
            />
          </div>

          {/* Row 4: Technical Metrics + Technical AI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportEditorTechnicalMetrics metrics={metrics} />
            <ReportEditorNarrativeSection
              reportId={reportId}
              section="technical"
              title="Technical Health Insights"
              description="Crawl health, indexability, and error analysis"
              narrative={report.narrative.find(n => n.section === 'technical')}
              onUpdate={fetchReport}
            />
          </div>

          {/* Row 5: Off-Site Metrics + Authority AI (Placeholder) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportEditorOffsiteMetrics metrics={metrics} />
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 flex items-center justify-center">
              <p className="text-sm text-slate-400 text-center">
                Authority & Off-Site AI narrative<br />
                (Available when SE Ranking integration is complete)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky publish bar */}
      <ReportPublishBar
        reportId={reportId}
        clientId={report.client.id}
        accessKey={report.client.secure_access_token}
        status={report.published_status}
        approvalRequired={report.client.approval_required}
        onStatusChange={fetchReport}
      />
    </div>
  );
}
