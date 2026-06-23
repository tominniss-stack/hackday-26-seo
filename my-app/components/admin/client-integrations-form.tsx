'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import type { Client } from '@/lib/types';

interface ClientIntegrationsFormProps {
  client: Client;
  onSaved: () => void;
}

interface IntegrationField {
  key: keyof Client;
  label: string;
  placeholder: string;
  help: string;
  type?: string;
}

const INTEGRATION_FIELDS: IntegrationField[] = [
  {
    key: 'ga4_property_id',
    label: 'GA4 Property ID',
    placeholder: 'properties/123456789',
    help: 'Found in Google Analytics → Admin → Property Settings. Format: properties/XXXXXXXXX',
  },
  {
    key: 'gsc_property_url',
    label: 'GSC Property URL',
    placeholder: 'https://example.com/',
    help: 'The exact property URL from Google Search Console (include trailing slash).',
  },
  {
    key: 'seranking_api_key',
    label: 'SE Ranking API Key',
    placeholder: 'sr_xxxxxxxxxxxxxxxx',
    help: 'Found in SE Ranking → Account → API. Used for keyword position tracking.',
    type: 'password',
  },
  {
    key: 'seranking_domain',
    label: 'Target Domain',
    placeholder: 'northwind.example',
    help: 'The bare domain to pull backlinks & authority for (no https:// or trailing slash).',
  },
  {
    key: 'seranking_project_id',
    label: 'Project ID (Optional)',
    placeholder: '123456',
    help: 'Optional SE Ranking project reference for project-scoped lookups.',
  },
  {
    key: 'jira_email',
    label: 'Jira Account Email',
    placeholder: 'analyst@example.com',
    help: 'The Atlassian account email used to authenticate Jira API requests.',
  },
  {
    key: 'jira_api_key',
    label: 'Jira API Token',
    placeholder: 'ATATT3xFfGF0...',
    help: 'Generate at id.atlassian.com → Security → API tokens. Used for creating tickets.',
    type: 'password',
  },
  {
    key: 'jira_project_key',
    label: 'Jira Project Key',
    placeholder: 'BD',
    help: 'The short project key in Jira (e.g. "BD" for Brew Digital). New tickets will be created here.',
  },
];

export function ClientIntegrationsForm({ client, onSaved }: ClientIntegrationsFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    ga4_property_id: client.ga4_property_id ?? '',
    gsc_property_url: client.gsc_property_url ?? '',
    seranking_api_key: client.seranking_api_key ?? '',
    seranking_domain: client.seranking_domain ?? '',
    seranking_project_id: client.seranking_project_id ?? '',
    jira_email: client.jira_email ?? '',
    jira_api_key: client.jira_api_key ?? '',
    jira_project_key: client.jira_project_key ?? '',
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
          ga4_property_id: form.ga4_property_id || null,
          gsc_property_url: form.gsc_property_url || null,
          seranking_api_key: form.seranking_api_key || null,
          seranking_domain: form.seranking_domain || null,
          seranking_project_id: form.seranking_project_id || null,
          jira_email: form.jira_email || null,
          jira_api_key: form.jira_api_key || null,
          jira_project_key: form.jira_project_key || null,
        })
        .eq('id', client.id);
      if (error) throw error;
      onSaved();
    } catch (err) {
      // Supabase errors are plain objects ({}) under console.error — surface the
      // real message/details/code so failures are actionable.
      const e = err as { message?: string; details?: string; hint?: string; code?: string };
      console.error('Error saving integrations:', {
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
        code: e?.code,
        raw: err,
      });
      alert(`Failed to save integrations: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Google APIs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {INTEGRATION_FIELDS.slice(0, 2).map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-medium">{field.label}</Label>
              <Input
                id={field.key}
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400">{field.help}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SE Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SE Ranking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {INTEGRATION_FIELDS.slice(2, 5).map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-medium">{field.label}</Label>
              <Input
                id={field.key}
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400">{field.help}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Jira */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Jira Service Desk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {INTEGRATION_FIELDS.slice(5).map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-medium">{field.label}</Label>
              <Input
                id={field.key}
                type={field.type ?? 'text'}
                value={form[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-slate-400">{field.help}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Integrations
        </Button>
      </div>
    </div>
  );
}
