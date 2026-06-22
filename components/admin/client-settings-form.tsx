'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import type { Client } from '@/lib/types';

interface ClientSettingsFormProps {
  client: Client;
  onSaved: () => void;
}

export function ClientSettingsForm({ client, onSaved }: ClientSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: client.company_name,
    primary_color_hex: client.primary_color_hex ?? '#3b82f6',
    logo_url: client.logo_url ?? '',
    custom_ai_prompt: client.custom_ai_prompt ?? '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('clients')
        .update({
          company_name: form.company_name,
          primary_color_hex: form.primary_color_hex || null,
          logo_url: form.logo_url || null,
          custom_ai_prompt: form.custom_ai_prompt || null,
        })
        .eq('id', client.id);
      if (error) throw error;
      onSaved();
    } catch (err) {
      console.error('Error saving client settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company_name" className="text-xs font-medium">Company Name</Label>
            <Input
              id="company_name"
              value={form.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primary_color_hex" className="text-xs font-medium">Brand Colour (Hex)</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color_hex"
                value={form.primary_color_hex}
                onChange={(e) => handleChange('primary_color_hex', e.target.value)}
                placeholder="#3b82f6"
                className="font-mono"
              />
              <div
                className="h-9 w-9 rounded-md border border-slate-200 shrink-0"
                style={{ backgroundColor: form.primary_color_hex }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="logo_url" className="text-xs font-medium">Logo URL</Label>
          <Input
            id="logo_url"
            value={form.logo_url}
            onChange={(e) => handleChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          <p className="text-[10px] text-slate-400">Displayed in the client portal header. Use a square image (min 64×64px).</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="custom_ai_prompt" className="text-xs font-medium">AI Context Prompt</Label>
          <Textarea
            id="custom_ai_prompt"
            value={form.custom_ai_prompt}
            onChange={(e) => handleChange('custom_ai_prompt', e.target.value)}
            rows={4}
            placeholder="e.g. This client is a B2B SaaS company targeting enterprise HR teams in the UK. They are in a competitive market with Workday and SAP..."
            className="resize-none text-sm"
          />
          <p className="text-[10px] text-slate-400">Injected into every AI generation prompt as client background context.</p>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
