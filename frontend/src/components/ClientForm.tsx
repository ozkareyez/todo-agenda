'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, MapPin, User, Check } from 'lucide-react';
import { Client, Service } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ClientFormProps {
  onClose: () => void;
  onSave: (client: Client) => void;
  existingClients?: Client[];
}

interface ServiceFormData {
  name: string;
  price: string;
  date: string;
  time: string;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

export function ClientForm({ onClose, onSave, existingClients = [] }: ClientFormProps) {
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [services, setServices] = useState<ServiceFormData[]>([
    { name: '', price: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00' }
  ]);

  useEffect(() => {
    const stored = localStorage.getItem('serviciosPrecios');
    if (stored) {
      setServiceOptions(JSON.parse(stored));
    } else {
      fetch('http://localhost:3001/api/sheets?sheet=ServiciosPrecios')
        .then(res => res.json())
        .then(data => {
          setServiceOptions(data);
          localStorage.setItem('serviciosPrecios', JSON.stringify(data));
        })
        .catch(err => console.error('Error loading services:', err));
    }
  }, []);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowNewClient(false);
    if (clientId === 'new') {
      setShowNewClient(true);
      setClientName('');
      setClientAddress('');
      setClientPhone('');
    } else {
      const client = existingClients.find(c => c.id === clientId);
      if (client) {
        // Guardar datos del cliente seleccionado pero NO usar su ID
        setClientName(client.name);
        setClientAddress(client.address);
        setClientPhone(client.phone || '');
        // Marcar que es un cliente re-agendado (para generar nuevo ID)
        setSelectedClientId('existing');
      }
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  const addService = () => {
    setServices([...services, { 
      name: '', 
      price: '', 
      date: format(new Date(), 'yyyy-MM-dd'), 
      time: '09:00' 
    }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceFormData, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'name') {
      const selected = serviceOptions.find(s => s.name === value);
      if (selected) {
        updated[index].price = selected.price.toString();
      }
    }
    
    setServices(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientAddress.trim()) {
      toast.error('Nombre y dirección son obligatorios');
      return;
    }

    const validServices = services.filter(s => s.name.trim() && s.price.trim());
    
    if (validServices.length === 0) {
      toast.error('Selecciona al menos un servicio');
      return;
    }

    // Siempre generar un nuevo ID único para cada cita
    const clientId = generateId();
    const clientServices: Service[] = validServices.map(s => ({
      id: generateId(),
      clientId,
      name: s.name.trim(),
      price: parseFloat(s.price) || 0,
      date: s.date,
      time: s.time,
      reminderSent: false,
    }));

    const newClient: Client = {
      id: clientId,
      name: clientName.trim(),
      address: clientAddress.trim(),
      phone: clientPhone.trim() || undefined,
      services: clientServices,
      createdAt: new Date().toISOString(),
    };

    onSave(newClient);
    toast.success(`Cliente ${clientName} agregado`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="sticky top-0 bg-surface border-b border-border/50 p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Nueva Cita</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-background flex items-center justify-center hover:bg-border/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Cliente
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="">Seleccionar cliente...</option>
              {existingClients.map((client, idx) => (
                <option key={`${client.id}-${idx}`} value={client.id}>
                  {client.name} {client.phone ? `(${client.phone})` : ''}
                </option>
              ))}
              <option value="new">+ Nuevo cliente</option>
            </select>
          </div>

          {(showNewClient || selectedClientId) && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Nombre</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Dirección</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Dirección"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </>
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">Servicios</h3>
              <button
                type="button"
                onClick={addService}
                className="text-xs text-accent font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Agregar
              </button>
            </div>

            {services.map((service, idx) => (
              <div 
                key={idx} 
                className="relative bg-background rounded-xl p-3 border border-border/50 mb-2"
              >
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}

                <div className="space-y-2">
                  <select
                    value={service.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">Seleccionar servicio...</option>
                    {serviceOptions.map(opt => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name} - ${opt.price.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-muted mb-0.5">Fecha</label>
                      <input
                        type="date"
                        value={service.date}
                        onChange={(e) => updateService(idx, 'date', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-muted mb-0.5">Hora</label>
                      <input
                        type="time"
                        value={service.time}
                        onChange={(e) => updateService(idx, 'time', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-muted text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}