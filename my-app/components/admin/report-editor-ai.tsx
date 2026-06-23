'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Save, RefreshCw } from 'lucide-react';

type Section = 'executive' | 'technical' | 'traffic';

interface NarrativeRow {
  id: string;
  section: Section;
  final_text: string;
}

interface ReportEditorAIProps {
  reportId: string;
  narratives: NarrativeRow[];
  onUpdate: () => void;
}

const SECTION_CONFIG: Record<Section, { title: string; description: string }> = {
  executive: {
    title: 'Executive Summary',
    description: 'High-level performance overview for the client',
  },
  technical: {
    title: 'Technical Health',
    description: 'Crawl health, indexability, and error analysis',
  },
  traffic: {
    title: 'Traffic & Visibility',
    description: 'GA4 sessions, GSC queries, and channel performance',
  },
};

function NarrativeBlock({
  reportId,
  narrative,
  onUpdate,
}: {
  reportId: string;
  narrative: NarrativeRow;
  onUpdate: () => void;
}) {
  const [text, setText] = useState(narrative.final_text);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const config = SECTION_CONFIG[narrative.section];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, section: narrative.section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setText(data.text);
      setHasChanges(false);
      onUpdate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Generation failed: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('narratives')
        .update({ final_text: text })
        .eq('id', narrative.id);
      if (error) throw error;
      setHasChanges(false);
      onUpdate();
    } catch (err) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = !text || text.trim() === '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{config.title}</CardTitle>
            <p className="text-[11px] text-slate-500 mt-0.5">{config.description}</p>
          </div>
          <div className="flex gap-2">
            {!isEmpty && (
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating || saving}>
                {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Regenerate
              </Button>
            )}
            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={generating || saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-lg">
            <Sparkles className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-500 mb-3">No content yet. Generate an AI draft or type manually.</p>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              Generate with AI
            </Button>
          </div>
        ) : (
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setHasChanges(e.target.value !== narrative.final_text); }}
            rows={5}
            className="resize-none text-sm"
            disabled={generating || saving}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function ReportEditorAI({ reportId, narratives, onUpdate }: ReportEditorAIProps) {
  const sections: Section[] = ['executive', 'technical', 'traffic'];

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const narrative = narratives.find((n) => n.section === section) ?? {
          id: '',
          section,
          final_text: '',
        };
        return (
          <NarrativeBlock
            key={section}
            reportId={reportId}
            narrative={narrative}
            onUpdate={onUpdate}
          />
        );
      })}
    </div>
  );
}
