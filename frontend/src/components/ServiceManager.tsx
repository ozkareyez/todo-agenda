'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface ServiceManagerProps {
  onClose: () => void;
  onSaved: () => void;
}

export function ServiceManager({ onClose, onSaved }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('serviciosPrecios');
    if (stored) {
      setServices(JSON.parse(stored));
    }
  }, []);

  const saveToStorage = (newServices: Service[]) => {
    localStorage.setItem('serviciosPrecios', JSON.stringify(newServices));
    setServices(newServices);
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!newPrice.trim() || isNaN(Number(newPrice)) || Number(newPrice) <= 0) {
      toast.error('El precio debe ser un número mayor a 0');
      return;
    }

    const newService: Service = {
      id: Math.random().toString(36).substring(2, 10),
      name: newName.trim(),
      price: Number(newPrice),
    };

    const updated = [...services, newService];
    saveToStorage(updated);
    setNewName('');
    setNewPrice('');
    toast.success('Servicio agregado');
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditName(service.name);
    setEditPrice(service.price.toString());
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!editPrice.trim() || isNaN(Number(editPrice)) || Number(editPrice) <= 0) {
      toast.error('El precio debe ser un número mayor a 0');
      return;
    }

    const updated = services.map(s =>
      s.id === editingId ? { ...s, name: editName.trim(), price: Number(editPrice) } : s
    );

    saveToStorage(updated);
    setEditingId(null);
    toast.success('Servicio actualizado');
  };

  const handleDelete = (id: string) => {
    if (services.length <= 1) {
      toast.error('Debe haber al menos un servicio');
      return;
    }

    const updated = services.filter(s => s.id !== id);
    saveToStorage(updated);
    toast.success('Servicio eliminado');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full sm:max-w-lg max-h-[80vh] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="sticky top-0 bg-surface border-b border-border/50 p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Mis Servicios</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-background flex items-center justify-center hover:bg-border/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)] space-y-4">
          <div className="bg-background rounded-xl p-4 border border-border/50">
            <h3 className="text-sm font-semibold text-primary mb-3">Agregar nuevo</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del servicio"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Precio"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">Servicios existentes</h3>
            {services.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">No hay servicios</p>
            ) : (
              services.map((service) => (
                <div key={service.id} className="bg-background rounded-xl p-3 border border-border/50">
                  {editingId === service.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 rounded-lg border border-border text-muted text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary">{service.name}</p>
                        <p className="text-sm text-muted">${service.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(service)}
                          className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => { onSaved(); onClose(); }}
            className="w-full py-3 rounded-xl bg-accent text-white text-sm font-medium"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}