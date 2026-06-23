'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ReportStatusBadge } from './report-status-badge';
import { Send, CheckCircle, Link2, RotateCcw, Loader2 } from 'lucide-react';

type PublishedStatus = 'draft' | 'pending_approval' | 'published';

interface ReportPublishBarProps {
  reportId: string;
  clientId: string;
  accessKey: string;
  status: PublishedStatus;
  approvalRequired?: boolean;
  onStatusChange: () => void;
}

export function ReportPublishBar({
  reportId,
  clientId,
  accessKey,
  status,
  approvalRequired = true,
  onStatusChange,
}: ReportPublishBarProps) {
  // TODO: Get current user's can_approve_reports permission from session
  // For now, assume user has approval rights (will be implemented with NextAuth)
  const userCanApprove = true;
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateStatus = async (newStatus: PublishedStatus) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .update({ published_status: newStatus })
        .eq('id', reportId);
      if (error) throw error;
      onStatusChange();
    } catch (err) {
      alert('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPortalLink = () => {
    const url = `${window.location.origin}/portal/${clientId}?access_key=${accessKey}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <ReportStatusBadge status={status} size="md" />
        </div>

        <div className="flex items-center gap-2">
          {status === 'draft' && (
            <>
              {approvalRequired && !userCanApprove ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus('pending_approval')}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Submit for Approval
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => updateStatus('published')}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                  {approvalRequired ? 'Approve & Publish' : 'Publish'}
                </Button>
              )}
            </>
          )}

          {status === 'pending_approval' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus('draft')}
                disabled={loading}
                className="text-slate-600"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reject to Draft
              </Button>
              {userCanApprove && (
                <Button
                  size="sm"
                  onClick={() => updateStatus('published')}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                  Approve & Publish
                </Button>
              )}
            </>
          )}

          {status === 'published' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus('draft')}
                disabled={loading}
                className="text-slate-600"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Unpublish
              </Button>
              <Button
                size="sm"
                onClick={copyPortalLink}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                {copied ? 'Copied!' : 'Copy Portal Link'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
