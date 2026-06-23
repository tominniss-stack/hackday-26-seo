'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadClientLogo, deleteClientLogo, resolveLogoUrl } from '@/lib/storage-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import type { Client } from '@/lib/types';

interface ClientSettingsFormProps {
  client: Client;
  onSaved: () => void;
}

export function ClientSettingsForm({ client, onSaved }: ClientSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoMode, setLogoMode] = useState<'url' | 'upload'>(
    client.logo_storage_path ? 'upload' : 'url'
  );
  const [form, setForm] = useState({
    company_name: client.company_name,
    primary_color_hex: client.primary_color_hex ?? '#3b82f6',
    logo_url: client.logo_url ?? '',
    logo_storage_path: client.logo_storage_path ?? '',
    custom_ai_prompt: client.custom_ai_prompt ?? '',
    contact_name: client.contact_name ?? '',
    contact_email: client.contact_email ?? '',
    is_archived: client.is_archived ?? false,
    theme_overrides: client.theme_overrides ?? {},
  });

  const handleChange = (field: string, value: string | boolean | Record<string, string>) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleThemeOverride = (key: string, value: string) => {
    setForm((prev) => {
      const newOverrides = { ...prev.theme_overrides };
      if (value) {
        newOverrides[key] = value;
      } else {
        delete newOverrides[key];
      }
      return {
        ...prev,
        theme_overrides: newOverrides,
      };
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      // Delete old logo if exists
      if (form.logo_storage_path) {
        await deleteClientLogo(form.logo_storage_path);
      }

      // Upload new logo
      const result = await uploadClientLogo(client.id, file);
      if (!result) throw new Error('Upload failed');

      setForm((prev) => ({
        ...prev,
        logo_storage_path: result.path,
        logo_url: '', // Clear URL when using storage
      }));

      toast.success('Logo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [client.id, form.logo_storage_path]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  const handleClearLogo = async () => {
    if (form.logo_storage_path) {
      await deleteClientLogo(form.logo_storage_path);
    }
    setForm((prev) => ({
      ...prev,
      logo_storage_path: '',
      logo_url: '',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean up theme_overrides: remove empty values
      const cleanedOverrides = Object.fromEntries(
        Object.entries(form.theme_overrides).filter(([_, v]) => v)
      );

      const { error } = await (supabase as any)
        .from('clients')
        .update({
          company_name: form.company_name,
          primary_color_hex: form.primary_color_hex || null,
          logo_url: logoMode === 'url' ? (form.logo_url || null) : null,
          logo_storage_path: logoMode === 'upload' ? (form.logo_storage_path || null) : null,
          custom_ai_prompt: form.custom_ai_prompt || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          is_archived: form.is_archived,
          theme_overrides: Object.keys(cleanedOverrides).length > 0 ? cleanedOverrides : {},
        })
        .eq('id', client.id);
      if (error) throw error;
      toast.success('Client settings saved successfully');
      onSaved();
    } catch (err) {
      console.error('Error saving client settings:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentLogoUrl = resolveLogoUrl(form.logo_url, form.logo_storage_path);

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
            <div className="flex gap-2 items-center">
              <Input
                id="primary_color_hex"
                value={form.primary_color_hex}
                onChange={(e) => handleChange('primary_color_hex', e.target.value)}
                placeholder="#3b82f6"
                className="font-mono flex-1"
              />
              <div
                className="w-12 h-12 rounded-lg border-2 border-slate-300 shadow-sm shrink-0 transition-colors"
                style={{ backgroundColor: form.primary_color_hex }}
                title={`Preview: ${form.primary_color_hex}`}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              This color will be used throughout the client portal for branding
            </p>
          </div>
        </div>

        {/* Logo Configuration */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <Label className="text-xs font-medium">Logo Configuration</Label>
          
          {/* Logo Mode Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLogoMode('url')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                logoMode === 'url'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              External URL
            </button>
            <button
              type="button"
              onClick={() => setLogoMode('upload')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                logoMode === 'upload'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Upload File
            </button>
          </div>

          {/* URL Mode */}
          {logoMode === 'url' && (
            <div className="space-y-1.5">
              <Input
                id="logo_url"
                value={form.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-[10px] text-slate-400">
                Enter a direct URL to your logo image
              </p>
            </div>
          )}

          {/* Upload Mode */}
          {logoMode === 'upload' && (
            <div className="space-y-2">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                {uploading ? (
                  <p className="text-sm text-slate-600">Uploading...</p>
                ) : isDragActive ? (
                  <p className="text-sm text-slate-600">Drop logo here...</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-1">
                      Drop logo here or click to browse
                    </p>
                    <p className="text-xs text-slate-400">
                      PNG, JPG, SVG, WebP (max 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Current Logo Preview */}
          {currentLogoUrl && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="h-12 w-12 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={currentLogoUrl}
                  alt="Current logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<ImageIcon class="h-6 w-6 text-slate-300" />';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900">Current Logo</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {logoMode === 'upload' ? form.logo_storage_path : form.logo_url}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearLogo}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Advanced Theme Overrides */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div>
            <Label className="text-xs font-medium">Advanced Theme Overrides</Label>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Leave blank to auto-generate complementary colors from primary
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="secondary_color" className="text-[10px] text-slate-500">
                Secondary Color
              </Label>
              <Input
                id="secondary_color"
                value={form.theme_overrides.secondary || ''}
                onChange={(e) => handleThemeOverride('secondary', e.target.value)}
                placeholder="Auto-generated"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accent_color" className="text-[10px] text-slate-500">
                Accent Color
              </Label>
              <Input
                id="accent_color"
                value={form.theme_overrides.accent || ''}
                onChange={(e) => handleThemeOverride('accent', e.target.value)}
                placeholder="Auto-generated"
                className="font-mono text-xs"
              />
            </div>
          </div>
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

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="space-y-1.5">
            <Label htmlFor="contact_name" className="text-xs font-medium">Primary Contact Name</Label>
            <Input
              id="contact_name"
              value={form.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email" className="text-xs font-medium">Primary Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>

        {/* Archive Client */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex-1">
              <Label htmlFor="is_archived" className="text-sm font-medium text-slate-900 cursor-pointer">
                Archive Client
              </Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived clients are hidden from the main directory but retain all historical data
              </p>
            </div>
            <button
              role="switch"
              aria-checked={form.is_archived}
              onClick={() => handleChange('is_archived', !form.is_archived)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_archived ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.is_archived ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
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
