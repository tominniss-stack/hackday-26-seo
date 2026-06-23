'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SafeImage } from '@/components/ui/safe-image';
import { formatReportTitle } from '@/lib/report-utils';
import { ClientSettingsForm } from '@/components/admin/client-settings-form';
import { ClientIntegrationsForm } from '@/components/admin/client-integrations-form';
import { ReportStatusBadge } from '@/components/admin/report-status-badge';
import { ReportUpload } from '@/components/report-upload';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Settings, Plug, FileText, ExternalLink, Trash2, MoreHorizontal, ArrowUpDown, Badge as BadgeIcon } from 'lucide-react';
import type { Client } from '@/lib/types';

type Tab = 'settings' | 'integrations' | 'reports';

interface Report {
  id: string;
  reporting_month: string;
  report_category: 'SEO' | 'PPC';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{ id: string; month: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'monthly' | 'quarterly'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'SEO' | 'PPC'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [newReportDialogOpen, setNewReportDialogOpen] = useState(false);

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

  const handleDeleteClick = (reportId: string, reportingMonth: string, category: 'SEO' | 'PPC') => {
    setReportToDelete({ id: reportId, month: formatReportTitle(reportingMonth, category) });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportToDelete.id);
      
      if (error) throw error;

      setDeleteDialogOpen(false);
      setReportToDelete(null);
      toast.success('Report deleted');
      await fetchData(); // Refresh the list
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error deleting report:', err);
      toast.error(`Failed to delete report: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenAsClient = (reportId: string) => {
    if (!client) return;
    const url = `${window.location.origin}/report/${reportId}?tab=seo&key=${client.secure_access_token}`;
    window.open(url, '_blank');
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      if (reportTypeFilter !== 'all' && report.report_type !== reportTypeFilter) return false;
      if (categoryFilter !== 'all' && report.report_category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.reporting_month).getTime();
      const dateB = new Date(b.reporting_month).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

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
              <SafeImage
                src={client.logo_url}
                alt={client.company_name}
                className="h-10 w-10 rounded-full object-cover"
              />
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
                Reports ({filteredReports.length})
              </h2>
              <Button onClick={() => setNewReportDialogOpen(true)} size="sm">
                <FileText className="h-4 w-4 mr-1.5" />
                New Report
              </Button>
            </div>

            {/* Filters & Sorting */}
            <div className="flex items-center gap-3">
              <Select value={reportTypeFilter} onValueChange={(value: any) => setReportTypeFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="SEO">SEO Only</SelectItem>
                  <SelectItem value="PPC">PPC Only</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              >
                <ArrowUpDown className="h-4 w-4 mr-1.5" />
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {filteredReports.length === 0 ? (
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
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow
                          key={report.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => router.push(`/admin/reports/${report.id}`)}
                        >
                          <TableCell className="font-medium text-slate-900 align-middle">
                            {formatReportTitle(report.reporting_month, report.report_category)}
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                              report.report_type === 'quarterly'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {report.report_type ?? 'monthly'}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle">
                            <ReportStatusBadge status={report.published_status} />
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 hidden sm:table-cell align-middle">
                            {new Date(report.created_at).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell className="align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAsClient(report.id);
                                }}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open as Client
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(report.id, report.reporting_month, report.report_category);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the report for <strong>{reportToDelete?.month}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete the report and all associated metrics, narratives, and snapshots.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Report Type Selection Dialog */}
      <Dialog open={newReportDialogOpen} onOpenChange={setNewReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <p className="text-sm text-slate-600 mt-2">
              Select the type of report you want to create. Creating a report automatically generates both SEO and PPC versions.
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-medium text-blue-900 mb-1">Auto-Sync Data Sources:</p>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li>✓ Google Analytics (GA4)</li>
                <li>✓ Google Search Console</li>
                <li>✓ SE Ranking MCP Server</li>
              </ul>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* SEO Report Card */}
            <button
              onClick={() => {
                setNewReportDialogOpen(false);
                // Trigger the existing upload flow
                document.querySelector<HTMLButtonElement>('[data-report-upload-trigger]')?.click();
              }}
              className="group relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all"
            >
              <FileText className="h-10 w-10 text-slate-700 group-hover:text-slate-900" />
              <div className="text-center">
                <h3 className="font-semibold text-sm text-slate-900">SEO Report</h3>
                <p className="text-xs text-slate-500 mt-1">Upload Screaming Frog CSV</p>
              </div>
            </button>

            {/* PPC Report Card (Disabled) */}
            <div className="relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Coming Soon
                </span>
              </div>
              <FileText className="h-10 w-10 text-slate-400" />
              <div className="text-center">
                <h3 className="font-semibold text-sm text-slate-600">PPC Report</h3>
                <p className="text-xs text-slate-400 mt-1">Google Ads integration</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden ReportUpload component for triggering */}
      <div className="hidden">
        <ReportUpload clientId={clientId} onReportCreated={fetchData} />
      </div>
    </div>
  );
}
