'use client';

import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { ClientForm } from '@/components/ClientForm';
import { ExcelExport } from '@/components/ExcelExport';
import { useSheets } from '@/hooks/useSheets';
import { Client, Service } from '@/types';
import { Settings, Users } from 'lucide-react';

export default function Home() {
  const { clients, services, addClient, updateService, isLoaded, isOnline, syncData } = useSheets();
  const [showForm, setShowForm] = useState(false);
  const [showClientOnly, setShowClientOnly] = useState(false);
  const [showClients, setShowClients] = useState(false);

  const handleSaveClient = (client: Client) => {
    addClient(client);
  };

  const handleToggleComplete = (clientId: string, serviceId: string) => {
    updateService(clientId, serviceId);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="sm:max-w-md sm:mx-auto sm:border-x sm:border-border/30 sm:min-h-screen relative">
        <Dashboard 
          clients={clients} 
          onAddClick={() => setShowForm(true)}
          onAddClientOnly={() => setShowClientOnly(true)}
          onToggleComplete={handleToggleComplete}
        />

        {clients.length > 0 && (
          <button
            onClick={() => setShowClients(!showClients)}
            className="fixed bottom-20 left-6 z-40 w-14 h-14 rounded-full bg-surface text-primary flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-border"
            title="Ver clientes"
          >
            <Users className="w-6 h-6" />
          </button>
        )}

        {showClients && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div 
              className="absolute inset-0 bg-primary/30 backdrop-blur-sm" 
              onClick={() => setShowClients(false)}
            />
            <div className="relative w-full sm:max-w-lg max-h-[80vh] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
              <div className="sticky top-0 bg-surface border-b border-border/50 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-primary">Clientes ({clients.length})</h2>
                  <button 
                    onClick={() => setShowClients(false)}
                    className="w-8 h-8 rounded-full bg-background flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="space-y-2">
                  {clients.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i).map((client, idx) => (
                    <div 
                      key={`${client.id}-${idx}`}
                      className="p-3 rounded-xl bg-background border border-border/30"
                    >
                      <p className="font-medium text-primary">{client.name}</p>
                      <p className="text-sm text-muted">{(client.services || []).length} servicio{(client.services || []).length !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <ExcelExport clients={clients} />

        {showForm && (
          <ClientForm 
            onClose={() => setShowForm(false)}
            onSave={handleSaveClient}
            existingClients={clients}
          />
        )}

        {showClientOnly && (
          <ClientForm 
            onClose={() => setShowClientOnly(false)}
            onSave={(client) => {
              addClient({ ...client, services: [] });
              setShowClientOnly(false);
            }}
            existingClients={clients}
            clientOnlyMode={true}
          />
        )}
      </div>
    </main>
  );
}