'use client';

import { useState } from 'react';
import { Send, TicketCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MOCK_TICKETS } from '@/lib/mock-data';

interface RequestsViewProps {
  clientColor: string;
  clientId?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-amber-50 text-amber-700',
  High: 'bg-orange-50 text-orange-700',
  Urgent: 'bg-red-50 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-purple-50 text-purple-700',
  'Awaiting Response': 'bg-amber-50 text-amber-700',
  Closed: 'bg-slate-100 text-slate-500',
};

export function RequestsView({ clientColor, clientId }: RequestsViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; issueKey?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch('/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, title, description, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      const message = data.issue_key
        ? `Ticket ${data.issue_key} created in Jira.`
        : data.message ?? 'Request submitted successfully.';
      setSubmitResult({ success: true, message, issueKey: data.issue_key });
      setTitle('');
      setDescription('');
      setPriority('Medium');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubmitResult({ success: false, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header — no time selector for timeless tabs */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Submit requests and track open tickets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* New Request Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-slate-400" />
              New Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-medium text-slate-700">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your request"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about what you need..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs font-medium text-slate-700">
                  Priority
                </Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {submitResult && (
                <div className={`rounded-md px-3 py-2 text-xs ${submitResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {submitResult.message}
                </div>
              )}
              <Button
                type="submit"
                className="w-full text-sm"
                style={{ backgroundColor: clientColor }}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4 animate-pulse" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit Request
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Open Tickets Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TicketCheck className="h-4 w-4 text-slate-400" />
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TICKETS.map((ticket, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {ticket.id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 text-sm">
                      {ticket.title}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="secondary"
                        className={`border-0 text-[10px] ${PRIORITY_COLORS[ticket.priority] || ''}`}
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-[10px] ${STATUS_COLORS[ticket.status] || ''}`}
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">
                      {ticket.created}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Jira integration note */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-300 uppercase tracking-wider">
                Powered by Jira Service Desk
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
