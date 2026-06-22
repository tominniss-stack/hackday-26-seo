'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ClientSettingsForm } from '@/components/admin/client-settings-form';
import { ClientIntegrationsForm } from '@/components/admin/client-integrations-form';
import { ReportStatusBadge } from '@/components/admin/report-status-badge';
import { ReportUpload } from '@/components/report-upload';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Plug, FileText, ExternalLink } from 'lucide-react';
import type { Client } from '@/lib/types';

type Tab = 'settings' | 'integrations' | 'reports';

interface Report {
  id: string;
  reporting_month: string;
  published_status: 'draft' | 'pending_approval' | 'published';
  report_type: 'monthly' | 'quarterly';
  created_at: string;
}

export default function ClientHubPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('reports');

  const fetchData = async () => {
    try {
      const [{ data: clientData }, { data: reportsData }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        (supabase as any).from('reports').select('id, reporting_month, published_status, created_at')
          .eq('client_id', clientId).order('reporting_month', { ascending: false }),
      ]);
      if (clientData) setClient(clientData as Client);
      if (reportsData) setReports(reportsData as Report[]);
    } catch (err) {
      console.error('Error fetching client hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [clientId]);

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Client not found.</p>
      </div>
    );
  }

  const clientColor = client.primary_color_hex || '#3b82f6';

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'reports', label: 'Reports', Icon: FileText },
    { id: 'settings', label: 'Settings', Icon: Settings },
    { id: 'integrations', label: 'Integrations', Icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Back nav */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Clients
        </Button>

        {/* Client header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: clientColor }}
          >
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.company_name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              client.company_name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{client.company_name}</h1>
            <p className="text-xs text-slate-400 font-mono">{client.id}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'settings' && (
          <ClientSettingsForm client={client} onSaved={fetchData} />
        )}

        {activeTab === 'integrations' && (
          <ClientIntegrationsForm client={client} onSaved={fetchData} />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Reports ({reports.length})
              </h2>
              <ReportUpload clientId={clientId} onReportCreated={fetchData} />
            </div>

            <Card>
              <CardContent className="p-0">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">No reports yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "New Report" to upload a Screaming Frog CSV.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reporting Month</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} className="cursor-pointer hover:bg-slate-50">
                          <TableCell className="font-medium text-slate-900">
                            {formatMonth(report.reporting_month)}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                              report.report_type === 'quarterly'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {report.report_type ?? 'monthly'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <ReportStatusBadge status={report.published_status} />
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
                            {new Date(report.created_at).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/reports/${report.id}`)}
                              className="text-xs"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Open Editor
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
