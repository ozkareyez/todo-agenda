export interface Service {
  id: string;
  clientId: string;
  name: string;
  price: number;
  date: string;
  time: string;
  reminderSent: boolean;
  completed?: boolean;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone?: string;
  services: Service[];
  createdAt: string;
}

export type FilterPeriod = 'today' | 'week' | 'month';

export interface AppState {
  clients: Client[];
  selectedPeriod: FilterPeriod;
}