'use client';

import { useState, useEffect, useCallback } from 'react';
import { Client, Service } from '@/types';
import * as sheets from '@/lib/googleSheets';
import { toast } from 'sonner';

const CLIENTS_KEY = 'agenda-citas-clients';
const SERVICES_KEY = 'agenda-citas-services';
const SYNC_PENDING_KEY = 'agenda-citas-sync-pending';

interface PendingSync {
  clients: Client[];
  services: Service[];
}

export function useSheets() {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

  const handleOnlineChange = useCallback(() => {
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      syncData();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, [handleOnlineChange]);

  const loadFromStorage = useCallback(() => {
    try {
      const storedClients = localStorage.getItem(CLIENTS_KEY);
      const storedServices = localStorage.getItem(SERVICES_KEY);
      if (storedClients) setClients(JSON.parse(storedClients));
      if (storedServices) setServices(JSON.parse(storedServices));
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  const saveToStorage = useCallback((c: Client[], s: Service[]) => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(c));
    localStorage.setItem(SERVICES_KEY, JSON.stringify(s));
  }, []);

  const syncData = useCallback(async () => {
    if (!sheets.isOnline()) return;
    setIsSyncing(true);
    try {
      const [remoteClients, remoteServices] = await Promise.all([
        sheets.getClients(),
        sheets.getServices(),
      ]);
      setClients(remoteClients);
      setServices(remoteServices);
      saveToStorage(remoteClients, remoteServices);
    } catch (e) {
      console.error('Sync error:', e);
      loadFromStorage();
    } finally {
      setIsSyncing(false);
    }
  }, [loadFromStorage, saveToStorage]);

  const addClient = useCallback(async (client: Client) => {
    const normalize = (s: string) => s.trim().toLowerCase();
    const clientName = normalize(client.name);
    const clientPhone = client.phone || '';

    const existingClientIndex = clients.findIndex(c => 
      normalize(c.name) === clientName && (c.phone || '') === clientPhone
    );

    if (existingClientIndex >= 0) {
      const existingClient = clients[existingClientIndex];
      
      const newServices = client.services.map(s => ({
        ...s,
        clientId: existingClient.id
      }));

      const hasConflict = services.some(s => 
        newServices.some(cs => cs.date === s.date && cs.time === s.time)
      );
      
      if (hasConflict) {
        toast.error('Ya existe una cita para esta fecha y hora');
        return;
      }

      const updatedClient = {
        ...existingClient,
        services: [...(existingClient.services || []), ...newServices]
      };

      const updatedClients = [...clients];
      updatedClients[existingClientIndex] = updatedClient;

      setClients(updatedClients);
      setServices(prev => [...prev, ...newServices]);
      saveToStorage(updatedClients, [...services, ...newServices]);

      toast.success(`Cita agregada a ${existingClient.name}`);
      return;
    }

    const hasConflict = services.some(s => 
      client.services.some(cs => cs.date === s.date && cs.time === s.time)
    );
    
    if (hasConflict) {
      toast.error('Ya existe una cita para esta fecha y hora');
      return;
    }

    setClients(prev => [...prev, client]);
    setServices(prev => [...prev, ...client.services]);
    saveToStorage([...clients, client], [...services, ...client.services]);

    if (sheets.isOnline()) {
      try {
        await sheets.saveClient(client);
        for (const svc of client.services) {
          await sheets.saveService(svc);
        }
      } catch (e: unknown) {
        const err = e as { message?: string; status?: number };
        if (err.status === 409 || err.message?.includes('409') || err.message?.includes('ya existe')) {
          setClients(prev => prev.filter(c => c.id !== client.id));
          setServices(services);
          saveToStorage(clients, services);
          toast.error('Ya existe una cita para esta fecha y hora');
          return;
        }
        console.error('Failed to sync client:', e);
      }
    }
  }, [clients, services, saveToStorage]);

  const updateClient = useCallback(async (clientId: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, ...updates } : c
    ));

    if (sheets.isOnline()) {
      try {
        const client = clients.find(c => c.id === clientId);
        if (client) await sheets.saveClient({ ...client, ...updates });
      } catch (e) {
        console.error('Failed to sync update:', e);
      }
    }

    const updated = clients.map(c => c.id === clientId ? { ...c, ...updates } : c);
    saveToStorage(updated, services);
  }, [clients, services, saveToStorage]);

  const deleteClient = useCallback(async (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    setServices(prev => prev.filter(s => s.clientId !== clientId));

    const updatedClients = clients.filter(c => c.id !== clientId);
    const updatedServices = services.filter(s => s.clientId !== clientId);
    saveToStorage(updatedClients, updatedServices);
  }, [clients, services, saveToStorage]);

  const addServiceToClient = useCallback(async (clientId: string, service: Service) => {
    setServices(prev => [...prev, service]);
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, services: [...c.services, service] }
        : c
    ));

    if (sheets.isOnline()) {
      try {
        await sheets.saveService(service);
      } catch (e) {
        console.error('Failed to sync service:', e);
      }
    }

    const updatedServices = [...services, service];
    const updatedClients = clients.map(c =>
      c.id === clientId
        ? { ...c, services: [...c.services, service] }
        : c
    );
    saveToStorage(updatedClients, updatedServices);
  }, [clients, services, saveToStorage]);

  const removeServiceFromClient = useCallback(async (clientId: string, serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, services: c.services.filter(s => s.id !== serviceId) }
        : c
    ));

    const updatedServices = services.filter(s => s.id !== serviceId);
    const updatedClients = clients.map(c =>
      c.id === clientId
        ? { ...c, services: c.services.filter(s => s.id !== serviceId) }
        : c
    );
    saveToStorage(updatedClients, updatedServices);
  }, [clients, services, saveToStorage]);

  const updateService = useCallback((clientId: string, serviceId: string) => {
    setServices(prev => prev.map(s => 
      s.id === serviceId ? { ...s, completed: !s.completed } : s
    ));
    setClients(prev => prev.map(c => 
      c.id === clientId
        ? { ...c, services: c.services.map(s => 
            s.id === serviceId ? { ...s, completed: !s.completed } : s
          )}
        : c
    ));

    const updatedServices = services.map(s => 
      s.id === serviceId ? { ...s, completed: !s.completed } : s
    );
    const updatedClients = clients.map(c => 
      c.id === clientId
        ? { ...c, services: c.services.map(s => 
            s.id === serviceId ? { ...s, completed: !s.completed } : s
          )}
        : c
    );
    saveToStorage(updatedClients, updatedServices);
  }, [clients, services, saveToStorage]);

  useEffect(() => {
    if (sheets.isOnline()) {
      syncData();
    } else {
      loadFromStorage();
    }
    setIsLoaded(true);
  }, []);

  const updateServiceData = useCallback((clientId: string, updatedService: Service) => {
    const updatedClients = clients.map(c => {
      if (c.id === clientId) {
        const newServices = c.services?.map(s => 
          s.id === updatedService.id ? updatedService : s
        ) || [updatedService];
        return { ...c, services: newServices };
      }
      return c;
    });
    
    const updatedServicesList = services.map(s => 
      s.id === updatedService.id ? updatedService : s
    );
    
    setClients(updatedClients);
    setServices(updatedServicesList);
    saveToStorage(updatedClients, updatedServicesList);
  }, [clients, services, saveToStorage]);

  return {
    clients,
    services,
    isLoaded,
    isOnline,
    isSyncing,
    addClient,
    updateClient,
    deleteClient,
    addServiceToClient,
    removeServiceFromClient,
    updateService,
    updateServiceData,
    syncData,
  };
}