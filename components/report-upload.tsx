'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Upload, FileText, Loader2, Zap, FolderOpen } from 'lucide-react';
import {
  parseScreamingFrogCsv,
  parseGa4Csv,
  parseGscCsv,
  mergeMetrics,
} from '@/lib/csv-parsers';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface ReportUploadProps {
  clientId: string;
  onReportCreated?: () => void;
}

type UploadMode = 'auto' | 'manual';

interface FileSlot {
  key: 'sf' | 'ga4' | 'gsc';
  label: string;
  description: string;
  required: boolean;
}

const FILE_SLOTS: FileSlot[] = [
  { key: 'sf', label: 'Screaming Frog CSV', description: 'Internal All export', required: true },
  { key: 'ga4', label: 'GA4 Traffic CSV', description: 'Traffic acquisition report', required: false },
  { key: 'gsc', label: 'GSC Queries CSV', description: 'Search performance queries', required: false },
];

function FileDropzone({
  slot,
  file,
  onFile,
  disabled,
}: {
  slot: FileSlot;
  file: File | null;
  onFile: (f: File) => void;
  disabled: boolean;
}) {
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) onFile(f);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
        drag ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div className="flex items-center gap-2">
        <FileText className={`h-4 w-4 shrink-0 ${file ? 'text-emerald-500' : 'text-slate-300'}`} />
        <div className="text-left min-w-0">
          <p className="text-xs font-medium text-slate-700">
            {slot.label}
            {slot.required && <span className="text-red-500 ml-0.5">*</span>}
          </p>
          {file ? (
            <p className="text-[10px] text-emerald-600 truncate">{file.name}</p>
          ) : (
            <p className="text-[10px] text-slate-400">{slot.description} — drag or click</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReportUpload({ clientId, onReportCreated }: ReportUploadProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<UploadMode>('auto');
  const [reportingMonth, setReportingMonth] = useState('');
  const [reportContext, setReportContext] = useState('');
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [progress, setProgress] = useState('');
  const [files, setFiles] = useState<Record<string, File | null>>({ sf: null, ga4: null, gsc: null });

  const setFile = (key: string, file: File) => setFiles((prev) => ({ ...prev, [key]: file }));

  const reset = () => {
    setLoading(false);
    setProgress('');
    setReportingMonth('');
    setReportContext('');
    setReportType('monthly');
    setFiles({ sf: null, ga4: null, gsc: null });
    setMode('auto');
  };

  const createReportRecord = async (): Promise<string> => {
    const reportDate = `${reportingMonth}-01`;
    const { data, error } = await (supabase as any)
      .from('reports')
      .insert([{ client_id: clientId, reporting_month: reportDate, published_status: 'draft', report_context_prompt: reportContext || null, report_type: reportType }])
      .select()
      .single();
    if (error) throw error;
    return data.id as string;
  };

  const saveMetrics = async (reportId: string, metrics: UnifiedMetrics) => {
    const { error } = await (supabase as any)
      .from('metrics_snapshots')
      .insert([{ report_id: reportId, metric_category: 'full_site_audit', data_json: metrics }]);
    if (error) throw error;
  };

  const createNarrativePlaceholders = async (reportId: string) => {
    const sections = ['executive', 'technical', 'traffic'];
    for (const section of sections) {
      await (supabase as any)
        .from('narratives')
        .insert([{ report_id: reportId, section, final_text: '' }]);
    }
  };

  const handleAutoSync = async () => {
    if (!reportingMonth) { alert('Please select a reporting month.'); return; }
    setLoading(true);
    try {
      setProgress('Creating report record...');
      const reportId = await createReportRecord();

      setProgress('Syncing data from Google APIs...');
      const res = await fetch('/api/sync/report-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Sync failed');

      const skipped = Object.entries(result.synced ?? {})
        .filter(([, v]: [string, unknown]) => (v as { method: string }).method === 'skipped')
        .map(([k]) => k);

      if (skipped.length > 0) {
        setProgress(`Synced. Note: ${skipped.join(', ')} skipped (credentials not configured).`);
      } else {
        setProgress('All data synced successfully!');
      }

      setProgress('Creating narrative placeholders...');
      await createNarrativePlaceholders(reportId);

      setTimeout(() => { setOpen(false); reset(); onReportCreated?.(); }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Auto-sync failed: ${msg}`);
      setLoading(false);
      setProgress('');
    }
  };

  const handleManualUpload = async () => {
    if (!reportingMonth || !files.sf) {
      alert('Reporting month and Screaming Frog CSV are required.');
      return;
    }
    setLoading(true);
    try {
      setProgress('Parsing CSV files...');
      const parts: Partial<UnifiedMetrics>[] = [];

      const sfData = await parseScreamingFrogCsv(files.sf!);
      parts.push({ ...sfData, data_sources: { screaming_frog: 'csv', ga4: files.ga4 ? 'csv' : 'skipped', gsc: files.gsc ? 'csv' : 'skipped' } });

      if (files.ga4) {
        setProgress('Parsing GA4 CSV...');
        parts.push(await parseGa4Csv(files.ga4));
      }
      if (files.gsc) {
        setProgress('Parsing GSC CSV...');
        parts.push(await parseGscCsv(files.gsc));
      }

      const metrics = mergeMetrics(...parts);

      setProgress('Creating report record...');
      const reportId = await createReportRecord();

      // Upload raw SF CSV to Storage bucket for infinite drill-down
      setProgress('Uploading raw CSV to storage...');
      const storagePath = `${clientId}/${reportId}/screaming_frog.csv`;
      const { error: uploadError } = await supabase.storage
        .from('client_reports_data')
        .upload(storagePath, files.sf!, { contentType: 'text/csv', upsert: true });

      if (!uploadError) {
        // Save storage path reference to report
        await (supabase as any)
          .from('reports')
          .update({ raw_sf_file_url: storagePath })
          .eq('id', reportId);
        // Also embed path in metrics for drill-down access
        metrics.raw_sf_storage_path = storagePath;
      } else {
        console.warn('Storage upload failed (non-critical):', uploadError.message);
      }

      setProgress('Saving metrics...');
      await saveMetrics(reportId, metrics);

      setProgress('Creating narrative placeholders...');
      await createNarrativePlaceholders(reportId);

      setProgress('Report created successfully!');
      setTimeout(() => { setOpen(false); reset(); onReportCreated?.(); }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Upload failed: ${msg}`);
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Upload className="mr-2 h-4 w-4" />
        New Report
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Choose how to populate this report's data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Report Type Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700">Report Type:</span>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(['monthly', 'quarterly'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    disabled={loading}
                    className={`px-3 py-1 text-xs font-medium transition-colors capitalize ${
                      reportType === type
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Month + Context */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="month" className="text-xs font-medium">
                  Reporting Month <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="month"
                  type="month"
                  value={reportingMonth}
                  onChange={(e) => setReportingMonth(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="context" className="text-xs font-medium">Context (optional)</Label>
                <Textarea
                  id="context"
                  value={reportContext}
                  onChange={(e) => setReportContext(e.target.value)}
                  rows={1}
                  disabled={loading}
                  placeholder="e.g. Post-migration cleanup month"
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('auto')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                  mode === 'auto' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Zap className={`h-4 w-4 shrink-0 ${mode === 'auto' ? 'text-slate-900' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Auto-Sync</p>
                  <p className="text-[10px] text-slate-500">Pull from Google APIs</p>
                </div>
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                  mode === 'manual' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FolderOpen className={`h-4 w-4 shrink-0 ${mode === 'manual' ? 'text-slate-900' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-semibold text-slate-900">Manual Upload</p>
                  <p className="text-[10px] text-slate-500">Upload CSV exports</p>
                </div>
              </button>
            </div>

            {/* Auto-sync info */}
            {mode === 'auto' && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                Will pull GA4 sessions/channels and GSC top queries for the selected month.
                If credentials are not configured, those sources will be skipped gracefully.
              </div>
            )}

            {/* Manual upload dropzones */}
            {mode === 'manual' && (
              <div className="space-y-2">
                {FILE_SLOTS.map((slot) => (
                  <FileDropzone
                    key={slot.key}
                    slot={slot}
                    file={files[slot.key]}
                    onFile={(f) => setFile(slot.key, f)}
                    disabled={loading}
                  />
                ))}
              </div>
            )}

            {/* Progress */}
            {progress && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {progress}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={mode === 'auto' ? handleAutoSync : handleManualUpload}
              disabled={loading || !reportingMonth || (mode === 'manual' && !files.sf)}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {mode === 'auto' ? 'Sync Data' : 'Upload & Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
