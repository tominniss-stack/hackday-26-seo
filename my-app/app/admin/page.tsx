'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ClientForm } from '@/components/client-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ChevronRight, FileText, Settings } from 'lucide-react';
import type { Client } from '@/lib/types';

interface ClientWithReportCount extends Client {
  report_count: number;
  latest_status: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithReportCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const { data: clientsData } = await (supabase as any).from('clients').select('*').order('company_name');
      if (!clientsData) return;

      // Fetch report counts and latest status for each client
      const enriched = await Promise.all(
        (clientsData as Client[]).map(async (client) => {
          const { data: reports } = await (supabase as any)
            .from('reports')
            .select('published_status')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

          return {
            ...client,
            report_count: reports?.length ?? 0,
            latest_status: reports?.[0]?.published_status ?? null,
          } as ClientWithReportCount;
        })
      );
      setClients(enriched);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const STATUS_COLORS: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700',
    pending_approval: 'bg-amber-50 text-amber-700',
    draft: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Manage clients, integrations, and reports</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <ClientForm onClientCreated={fetchClients} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No clients yet</p>
              <p className="text-sm text-slate-400 mt-1">Click "New Client" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/admin/client/${client.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {client.logo_url ? (
                        <img
                          src={client.logo_url}
                          alt={client.company_name}
                          className="h-9 w-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: client.primary_color_hex || '#3b82f6' }}
                        >
                          {client.company_name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{client.company_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <FileText className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{client.report_count} report{client.report_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                  </div>

                  {client.latest_status && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[client.latest_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        Latest: {client.latest_status.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
