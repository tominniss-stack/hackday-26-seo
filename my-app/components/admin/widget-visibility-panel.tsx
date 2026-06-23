'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2, LayoutDashboard } from 'lucide-react';

export const DEFAULT_WIDGETS: Record<string, string> = {
  top_priorities: 'Top Actionable Priorities',
  technical_health: 'Technical Health Cards',
  indexability_chart: 'Indexability Chart',
  status_code_chart: 'Status Code Chart',
  mom_comparison: 'Month-on-Month Comparison',
  ga4_traffic: 'GA4 Traffic Table',
  gsc_queries: 'GSC Queries Table',
  keyword_movements: 'Keyword Movements',
  traffic_channels: 'Traffic by Channel',
};

interface WidgetVisibilityPanelProps {
  reportId: string;
  initialWidgets: Record<string, boolean> | null;
  onSaved: () => void;
}

export function WidgetVisibilityPanel({ reportId, initialWidgets, onSaved }: WidgetVisibilityPanelProps) {
  const [widgets, setWidgets] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    Object.keys(DEFAULT_WIDGETS).forEach((k) => { defaults[k] = true; });
    return { ...defaults, ...(initialWidgets ?? {}) };
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .update({ visible_widgets: widgets })
        .eq('id', reportId);
      if (error) throw error;
      onSaved();
    } catch (err) {
      alert('Failed to save widget layout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-sm">Widget Layout</CardTitle>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save Layout
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Toggle which sections appear on the client portal.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(DEFAULT_WIDGETS).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                {label}
              </span>
              <button
                role="switch"
                aria-checked={widgets[key] ?? true}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  (widgets[key] ?? true) ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    (widgets[key] ?? true) ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
