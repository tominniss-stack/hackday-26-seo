'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, Save, RefreshCw } from 'lucide-react';

interface EditableNarrativeProps {
  reportId: string;
  narrativeId: string;
  initialText: string;
  onUpdate?: () => void;
}

export function EditableNarrative({
  reportId,
  narrativeId,
  initialText,
  onUpdate,
}: EditableNarrativeProps) {
  const [text, setText] = useState(initialText);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report_id: reportId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setText(data.text);
      setHasChanges(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error generating summary:', error);
      alert(error.message || 'Failed to generate AI summary. Please try again.');
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
        .eq('id', narrativeId);

      if (error) throw error;

      setHasChanges(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving narrative:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setHasChanges(e.target.value !== initialText);
  };

  const isEmpty = !text || text.trim() === '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Executive Summary</CardTitle>
          <div className="flex gap-2">
            {!isEmpty && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generating || saving}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
            {!isEmpty && hasChanges && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={generating || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No summary generated yet. Click the button below to generate an AI-powered
              executive summary based on the audit metrics.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with Claude...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Draft
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={handleTextChange}
              rows={6}
              className="resize-none"
              placeholder="Edit the executive summary..."
              disabled={generating || saving}
            />
            {hasChanges && (
              <p className="text-xs text-muted-foreground">
                You have unsaved changes. Click "Save Changes" to update.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
