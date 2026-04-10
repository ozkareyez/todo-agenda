'use client';

import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Client } from '@/types';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExcelExportProps {
  clients: Client[];
}

export function ExcelExport({ clients }: ExcelExportProps) {
  const exportToExcel = () => {
    if (clients.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const data: any[] = [];
    let totalIncome = 0;
    
    clients.forEach(client => {
      const services = client.services || [];
      services.forEach(service => {
        const isCompleted = service.completed === true;
        if (isCompleted) {
          totalIncome += service.price;
        }
        data.push({
          'Cliente': client.name,
          'Teléfono': client.phone || '',
          'Dirección': client.address,
          'Servicio': service.name,
          'Precio': service.price,
          'Fecha': format(parseISO(service.date), 'dd/MM/yyyy', { locale: es }),
          'Hora': service.time,
          'Estado': isCompleted ? 'Completado' : 'Pendiente',
        });
      });
    });

    // Agregar fila de totales
    data.push({
      'Cliente': '',
      'Teléfono': '',
      'Dirección': '',
      'Servicio': 'TOTAL INGRESOS',
      'Precio': totalIncome,
      'Fecha': '',
      'Hora': '',
      'Estado': '',
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Citas');

    const colWidths = [
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `agenda-citas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success(`Excel descargado - Ingresos: $${totalIncome.toLocaleString()}`);
  };

  return (
    <button
      onClick={exportToExcel}
      className="fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
      title="Exportar a Excel"
    >
      <Download className="w-6 h-6" />
    </button>
  );
}