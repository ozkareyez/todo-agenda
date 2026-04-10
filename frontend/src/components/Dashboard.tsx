'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isThisWeek, isThisMonth, parseISO, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, DollarSign, ChevronRight, User, Bell, Download, Plus, CheckCircle } from 'lucide-react';
import { Client, FilterPeriod, Service } from '@/types';
import { toast } from 'sonner';

interface DashboardProps {
  clients: Client[];
  onAddClick: () => void;
  onAddClientOnly?: () => void;
  onToggleComplete?: (clientId: string, serviceId: string) => void;
}

interface ServiceWithClient extends Service {
  clientName: string;
  clientAddress: string;
  completed?: boolean;
}

export function Dashboard({ clients, onAddClick, onAddClientOnly, onToggleComplete }: DashboardProps) {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [showReminders, setShowReminders] = useState(false);

  const filteredServices = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const allServices: ServiceWithClient[] = [];
    
    clients.forEach(client => {
      const services = client.services || [];
      services.forEach(service => {
        allServices.push({
          ...service,
          clientName: client.name,
          clientAddress: client.address,
        });
      });
    });

    return allServices.filter(service => {
      const serviceDate = parseISO(service.date);
      
      switch (period) {
        case 'today':
          return service.date === todayStr;
        case 'week':
          return serviceDate >= weekStart && serviceDate <= weekEnd;
        case 'month':
          return serviceDate >= monthStart && serviceDate <= monthEnd;
        default:
          return true;
      }
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [clients, period]);

  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
  const tomorrowServices = useMemo(() => {
    const allServices: ServiceWithClient[] = [];
    clients.forEach(client => {
      const services = client.services || [];
      services.forEach(service => {
        allServices.push({
          ...service,
          clientName: client.name,
          clientAddress: client.address,
        });
      });
    });
    return allServices
      .filter(s => s.date === tomorrow && !s.reminderSent)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [clients, tomorrow]);

  useMemo(() => {
    if (tomorrowServices.length > 0 && !showReminders) {
      setShowReminders(true);
    }
  }, [tomorrowServices.length, showReminders]);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;

    clients.forEach(client => {
      const services = client.services || [];
      services.forEach(service => {
        const serviceDate = parseISO(service.date);
        const isCompleted = service.completed === true;
        
        if (service.date === today) {
          todayCount++;
          if (isCompleted) todayRevenue += service.price;
        }
        if (serviceDate >= weekStart && serviceDate <= weekEnd) {
          weekCount++;
          if (isCompleted) weekRevenue += service.price;
        }
        if (serviceDate >= monthStart && serviceDate <= monthEnd) {
          monthCount++;
          if (isCompleted) monthRevenue += service.price;
        }
      });
    });

    return { todayCount, weekCount, monthCount, todayRevenue, weekRevenue, monthRevenue };
  }, [clients]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-6 pt-6 pb-4 bg-gradient-to-b from-white to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">Agenda</h1>
            <p className="text-muted text-sm mt-1">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
          <div className="flex gap-2">
            {onAddClientOnly && clients.length > 0 && (
              <button
                onClick={onAddClientOnly}
                className="w-12 h-12 rounded-full bg-surface text-primary flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-border"
                title="Agregar cliente sin cita"
              >
                <User size={20} />
              </button>
            )}
            <button
              onClick={onAddClick}
              className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Hoy</p>
            <p className="text-2xl font-bold text-primary">{stats.todayCount}</p>
            <p className="text-xs text-muted">citas</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 shadow-card border border-border/50">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Semana</p>
            <p className="text-2xl font-bold text-primary">{stats.weekCount}</p>
            <p className="text-xs text-muted">citas</p>
          </div>
        </div>
      </header>

      {showReminders && tomorrowServices.length > 0 && (
        <div className="mx-6 mb-4 animate-fade-in">
          <button
            onClick={() => setShowReminders(!showReminders)}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-amber-900">{tomorrowServices.length} recordatorio{tomorrowServices.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-700">Cita{tomorrowServices.length > 1 ? 's' : ''} para mañana</p>
            </div>
            <ChevronRight className={`w-5 h-5 text-amber-400 transition-transform ${showReminders ? 'rotate-90' : ''}`} />
          </button>
          
          {showReminders && (
            <div className="mt-2 space-y-2 animate-slide-up">
              {tomorrowServices.map(service => (
                <div key={service.id} className="bg-amber-50/50 rounded-lg p-3 flex items-center gap-3 border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 text-sm">{service.clientName}</p>
                    <p className="text-xs text-amber-700">{service.name} - {service.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-6 mb-4">
        <div className="flex gap-2 p-1 bg-surface rounded-xl shadow-card border border-border/30">
          {(['today', 'week', 'month'] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                period === p
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">
            {period === 'today' ? 'Citas de hoy' : period === 'week' ? 'Esta semana' : 'Este mes'}
          </h2>
          <span className="text-sm text-muted">{filteredServices.length} cita{filteredServices.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center shadow-card">
              <Calendar className="w-10 h-10 text-muted/50" />
            </div>
            <p className="text-muted">No hay citas</p>
            <p className="text-sm text-muted/70 mt-1">Toca + para agregar una</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service, idx) => {
              const isCompleted = service.completed === true;
              return (
              <div
                key={`${service.id}-${idx}`}
                className={`bg-surface rounded-2xl p-4 shadow-card border border-border/30 hover:shadow-hover hover:border-accent/20 transition-all duration-200 animate-slide-up ${isCompleted ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      const client = clients.find(c => c.services?.some(s => s.id === service.id));
                      if (client && onToggleComplete) {
                        onToggleComplete(client.id, service.id);
                      }
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold truncate ${isCompleted ? 'line-through text-muted' : 'text-primary'}`}>
                        {service.clientName}
                      </h3>
                    </div>
                    
                    <p className={`text-sm font-medium mb-2 ${isCompleted ? 'text-muted line-through' : 'text-accent'}`}>
                      {service.name}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {service.time}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {service.clientAddress}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${isCompleted ? 'text-green-600' : 'text-primary'}`}>
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}

        {period === 'today' && stats.todayRevenue > 0 && (
          <div className="mt-6 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 text-white">
            <p className="text-sm text-white/70 mb-1">Ingresos de hoy</p>
            <p className="text-3xl font-bold">{formatPrice(stats.todayRevenue)}</p>
          </div>
        )}
        {period === 'week' && stats.weekRevenue > 0 && (
          <div className="mt-6 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 text-white">
            <p className="text-sm text-white/70 mb-1">Ingresos de la semana</p>
            <p className="text-3xl font-bold">{formatPrice(stats.weekRevenue)}</p>
          </div>
        )}
        {period === 'month' && stats.monthRevenue > 0 && (
          <div className="mt-6 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 text-white">
            <p className="text-sm text-white/70 mb-1">Ingresos del mes</p>
            <p className="text-3xl font-bold">{formatPrice(stats.monthRevenue)}</p>
          </div>
        )}
      </div>
    </div>
  );
}