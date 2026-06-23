'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/types';
import { ClientForm } from './client-form';
import { Building2 } from 'lucide-react';

interface ClientListProps {
  onClientSelect: (client: Client) => void;
  selectedClientId?: string;
}

export function ClientList({ onClientSelect, selectedClientId }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const fetchClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter out archived clients unless explicitly showing them
      if (!showArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [showArchived]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ClientForm onClientCreated={fetchClients} />
        
        {/* Archive Filter Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <label htmlFor="show-archived" className="text-xs font-medium text-slate-700 cursor-pointer">
            Show Archived Clients
          </label>
          <button
            id="show-archived"
            role="switch"
            aria-checked={showArchived}
            onClick={() => setShowArchived(!showArchived)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              showArchived ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                showArchived ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No clients yet. Create your first client to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => onClientSelect(client)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedClientId === client.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card hover:bg-accent border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: client.primary_color_hex || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{client.company_name}</div>
                      {client.is_archived && (
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-slate-200 text-slate-600 uppercase tracking-wider">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Building2 className="h-4 w-4 opacity-50 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
