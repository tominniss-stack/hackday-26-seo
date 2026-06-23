'use client';

import { useState } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ContextualSupportFABProps {
  clientColor: string;
  clientId: string;
  reportingMonth?: string;
  activeTab?: string;
}

export function ContextualSupportFAB({ 
  clientColor, 
  clientId, 
  reportingMonth,
  activeTab = 'dashboard'
}: ContextualSupportFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; issueKey?: string } | null>(null);

  // Guard against invalid/too-light client colors that render the FAB invisible.
  // Fall back to a highly visible primary blue if the color is missing or white-ish.
  const isUsableColor = (c?: string) => {
    if (!c) return false;
    const hex = c.trim().toLowerCase();
    if (hex === '#fff' || hex === '#ffffff' || hex === 'white') return false;
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(hex) || hex.startsWith('rgb') || hex.startsWith('hsl');
  };
  const fabColor = isUsableColor(clientColor) ? clientColor : '#2563eb';

  // Generate contextual tag based on current view
  const getContextualTag = () => {
    if (!reportingMonth) return '';
    
    const date = new Date(reportingMonth);
    const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const tabLabels: Record<string, string> = {
      seo: 'SEO Report',
      ppc: 'PPC Report',
      dashboard: 'Dashboard',
      documents: 'Documents',
      requests: 'Requests',
    };
    
    const tabLabel = tabLabels[activeTab] || 'Portal';
    return `[${tabLabel} Query - ${month}]`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const contextualTag = getContextualTag();
      const enhancedTitle = contextualTag ? `${contextualTag} ${title}` : title;

      const res = await fetch('/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          title: enhancedTitle,
          description,
          priority: 'Medium',
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setSubmitResult({
        success: true,
        message: 'Your support request has been submitted successfully!',
        issueKey: data.issueKey,
      });

      // Reset form
      setTitle('');
      setDescription('');

      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitResult(null);
      }, 3000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setSubmitResult({
        success: false,
        message: `Failed to submit: ${msg}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 text-white"
        style={{ backgroundColor: fabColor }}
        aria-label="Get Support"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <HelpCircle className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Support Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <Card className="shadow-2xl border-2" style={{ borderColor: clientColor }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5" style={{ color: clientColor }} />
                Quick Support
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Ask a question or report an issue. We'll get back to you shortly.
              </p>
              {getContextualTag() && (
                <Badge 
                  variant="outline" 
                  className="mt-2 text-xs font-normal"
                  style={{ borderColor: clientColor, color: clientColor }}
                >
                  Auto-tagged: {getContextualTag()}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {submitResult ? (
                <div className={`p-4 rounded-lg ${
                  submitResult.success 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    submitResult.success ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {submitResult.message}
                  </p>
                  {submitResult.issueKey && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Ticket ID: {submitResult.issueKey}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="support-title" className="text-xs">
                      Subject
                    </Label>
                    <Input
                      id="support-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief description of your question"
                      required
                      disabled={submitting}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="support-description" className="text-xs">
                      Details
                    </Label>
                    <Textarea
                      id="support-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more context about your question or issue..."
                      rows={4}
                      required
                      disabled={submitting}
                      className="resize-none text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                    style={{ backgroundColor: clientColor }}
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop overlay when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
