'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

type Section = 'executive' | 'technical' | 'traffic';

interface ReportEditorAnnotationsProps {
  reportId: string;
  initialNotes: Record<string, string>;
  onSaved: () => void;
}

const ANNOTATION_SECTIONS: { key: Section; label: string; placeholder: string }[] = [
  {
    key: 'executive',
    label: 'Executive Context',
    placeholder: 'e.g. This month saw a significant improvement following the site migration completed on 15th April...',
  },
  {
    key: 'technical',
    label: 'Technical Notes',
    placeholder: 'e.g. The 34 4xx errors are concentrated on legacy /blog/ URLs. Redirect mapping has been submitted to dev...',
  },
  {
    key: 'traffic',
    label: 'Traffic Notes',
    placeholder: 'e.g. The spike in branded queries is attributed to the Q1 PR campaign. Organic uplift expected to sustain...',
  },
];

export function ReportEditorAnnotations({ reportId, initialNotes, onSaved }: ReportEditorAnnotationsProps) {
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .update({ analyst_notes: notes })
        .eq('id', reportId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      alert('Failed to save annotations. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Analyst Notes</CardTitle>
            <p className="text-[10px] text-slate-400 mt-0.5">
              These notes appear on the client portal below each section's chart.
            </p>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            {saved ? 'Saved!' : 'Save Notes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ANNOTATION_SECTIONS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">{label}</Label>
            <Textarea
              value={notes[key] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={3}
              placeholder={placeholder}
              className="resize-none text-sm"
              disabled={saving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
