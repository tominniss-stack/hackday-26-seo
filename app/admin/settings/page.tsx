'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Settings } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'global_system_prompt')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        if (data) setGlobalPrompt(data.value || '');
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'global_system_prompt', value: globalPrompt }, { onConflict: 'key' });
        
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Hub
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Global Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure system-wide AI behaviours and rules</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Global AI System Prompt</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  This base prompt is injected into every AI generation request across all clients. Use it to enforce agency tone of voice and formatting rules.
                </p>
              </div>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                {saved ? 'Saved!' : 'Save Prompt'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="globalPrompt" className="sr-only">Global System Prompt</Label>
              <Textarea
                id="globalPrompt"
                value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
                rows={15}
                className="font-mono text-sm leading-relaxed"
                placeholder="Enter the global system prompt..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
