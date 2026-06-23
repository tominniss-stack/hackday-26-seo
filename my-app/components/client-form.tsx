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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types';
import { Plus } from 'lucide-react';

interface ClientFormProps {
  onClientCreated?: () => void;
}

export function ClientForm({ onClientCreated }: ClientFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    primary_color_hex: '#3b82f6',
    custom_ai_prompt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: formData.company_name,
          primary_color_hex: formData.primary_color_hex,
          custom_ai_prompt: formData.custom_ai_prompt || null,
        } as any)
        .select();

      if (error) throw error;

      // Reset form and close dialog
      setFormData({
        company_name: '',
        primary_color_hex: '#3b82f6',
        custom_ai_prompt: '',
      });
      setOpen(false);
      
      // Notify parent component
      if (onClientCreated) {
        onClientCreated();
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Client
      </Button>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to manage their SEO reports.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                placeholder="Acme Corporation"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primary_color_hex">Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color_hex"
                  type="color"
                  value={formData.primary_color_hex}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_color_hex: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.primary_color_hex}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_color_hex: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom_ai_prompt">Custom AI Prompt (Optional)</Label>
              <Textarea
                id="custom_ai_prompt"
                value={formData.custom_ai_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, custom_ai_prompt: e.target.value })
                }
                placeholder="E.g., Focus on technical SEO improvements and use a professional tone..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
