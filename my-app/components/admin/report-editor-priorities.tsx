'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Plus, Save, Trash2, RotateCcw, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  KNOWN_ISSUE_TEMPLATES,
  resolvePriorities,
  type ManualPriority,
} from '@/lib/priority-calculator';
import type { UnifiedMetrics } from '@/lib/metrics-schema';

interface ReportEditorPrioritiesProps {
  reportId: string;
  metrics: UnifiedMetrics;
  /** Existing manual override (raw JSONB from reports.manual_priorities). */
  initialManual?: ManualPriority[] | null;
  onUpdate?: () => void;
}

const SEVERITIES: Array<ManualPriority['severity']> = ['critical', 'high', 'medium'];

function makeId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Seed the editable list from existing manual data, or from the auto-calculated set. */
function seedRows(metrics: UnifiedMetrics, manual?: ManualPriority[] | null): ManualPriority[] {
  if (manual && manual.length > 0) {
    return manual.map((m) => ({ ...m, id: m.id || makeId() }));
  }
  // Pre-fill from the auto-calculated priorities so the analyst starts with a sensible draft.
  return resolvePriorities(metrics, null).map((p) => ({
    id: makeId(),
    title: p.title,
    description: p.description,
    severity: p.severity,
    source: 'catalog' as const,
  }));
}

export function ReportEditorPriorities({
  reportId,
  metrics,
  initialManual,
  onUpdate,
}: ReportEditorPrioritiesProps) {
  const [rows, setRows] = useState<ManualPriority[]>(() => seedRows(metrics, initialManual));
  const [saving, setSaving] = useState(false);
  const [isManual, setIsManual] = useState<boolean>(Boolean(initialManual && initialManual.length > 0));

  const updateRow = (id: string, patch: Partial<ManualPriority>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const moveRow = (index: number, dir: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addFromTemplate = (value: string) => {
    const tpl = KNOWN_ISSUE_TEMPLATES.find((t) => t.value === value);
    if (!tpl) return;
    const isOther = tpl.value === 'other';
    setRows((prev) => [
      ...prev,
      {
        id: makeId(),
        title: tpl.title,
        description: tpl.description,
        severity: tpl.defaultSeverity,
        source: isOther ? 'custom' : 'catalog',
      },
    ]);
  };

  const handleSave = async () => {
    // Drop empty rows (no title) to avoid blank cards on the client report.
    const cleaned = rows
      .map((r) => ({ ...r, title: r.title.trim(), description: r.description.trim() }))
      .filter((r) => r.title.length > 0);

    if (cleaned.length === 0) {
      toast.error('Add at least one priority with a title, or reset to automatic.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .update({ manual_priorities: cleaned })
        .eq('id', reportId);
      if (error) throw error;
      setRows(cleaned);
      setIsManual(true);
      toast.success('Priorities saved');
      onUpdate?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save priorities';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToAuto = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .update({ manual_priorities: null })
        .eq('id', reportId);
      if (error) throw error;
      setRows(seedRows(metrics, null));
      setIsManual(false);
      toast.success('Reset to automatic priorities');
      onUpdate?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset priorities';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Top Actionable Priorities
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {isManual
                ? 'Manually curated — these override the automatic ranking on the client report.'
                : 'Auto-suggested from the crawl. Edit below to override what the client sees.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetToAuto} disabled={saving}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset to Auto
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save Priorities
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-slate-500 py-2">
            No priorities yet. Add one from the dropdown below.
          </p>
        )}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0 || saving}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1 || saving}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <Input
                value={row.title}
                onChange={(e) => updateRow(row.id, { title: e.target.value })}
                placeholder="Issue title (e.g. 404 Errors with Incoming Links)"
                className="flex-1 text-sm"
                disabled={saving}
              />
              <Select
                value={row.severity}
                onValueChange={(v) => updateRow(row.id, { severity: v as ManualPriority['severity'] })}
                disabled={saving}
              >
                <SelectTrigger className="w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.id)}
                disabled={saving}
                className="text-slate-400 hover:text-red-600"
                aria-label="Remove priority"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={row.description}
              onChange={(e) => updateRow(row.id, { description: e.target.value })}
              placeholder="Recommended fix / supporting copy shown to the client…"
              rows={2}
              className="resize-none text-sm"
              disabled={saving}
            />
          </div>
        ))}

        {/* Add-from-catalog dropdown */}
        <div className="flex items-center gap-2 pt-1">
          <Plus className="h-4 w-4 text-slate-400" />
          <Select value="" onValueChange={addFromTemplate} disabled={saving}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Add a priority — pick a known issue or 'Other (custom)'…" />
            </SelectTrigger>
            <SelectContent>
              {KNOWN_ISSUE_TEMPLATES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-sm">
                  {t.value === 'other' ? 'Other (manually enter)' : t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
