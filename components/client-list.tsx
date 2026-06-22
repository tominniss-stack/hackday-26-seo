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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

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
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ClientForm onClientCreated={fetchClients} />
        
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
                    <div className="font-medium truncate">{client.company_name}</div>
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
