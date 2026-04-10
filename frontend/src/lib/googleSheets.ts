import { Client, Service } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CLIENTS_SHEET = 'Clientes';
const SERVICIOS_SHEET = 'Servicios';

export async function getClients(): Promise<Client[]> {
  const response = await fetch(`${API_BASE}/api/sheets?sheet=${CLIENTS_SHEET}`);
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  const data = await response.json();
  if (Array.isArray(data) && data.length > 0 && !Array.isArray(data[0])) {
    return data as Client[];
  }
  return data.map((row: string[]) => ({
    id: row[0] || '',
    name: row[1] || '',
    address: row[2] || '',
    phone: row[3] || '',
    services: [],
    createdAt: row[4] || new Date().toISOString(),
  })).filter((c: Client) => c.id);
}

export async function getServices(): Promise<Service[]> {
  const response = await fetch(`${API_BASE}/api/sheets?sheet=${SERVICIOS_SHEET}`);
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  const data = await response.json();
  if (Array.isArray(data) && data.length > 0 && !Array.isArray(data[0])) {
    return data as Service[];
  }
  return data.map((row: string[]) => ({
    id: row[0] || '',
    clientId: row[1] || '',
    name: row[2] || '',
    price: parseFloat(row[3]) || 0,
    date: row[4] || '',
    time: row[5] || '',
    reminderSent: row[6] === 'TRUE',
  })).filter((s: Service) => s.id);
}

export async function saveClient(client: Client): Promise<string> {
  const response = await fetch(`${API_BASE}/api/sheets?sheet=${CLIENTS_SHEET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      values: [client.id, client.name, client.address, client.phone || '', client.createdAt],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to save client');
  }

  return client.id;
}

export async function saveService(service: Service): Promise<string> {
  const response = await fetch(`${API_BASE}/api/sheets?sheet=${SERVICIOS_SHEET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      values: [
        service.id,
        service.clientId,
        service.name,
        service.price.toString(),
        service.date,
        service.time,
        service.reminderSent ? 'TRUE' : 'FALSE',
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to save service');
  }

  return service.id;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}