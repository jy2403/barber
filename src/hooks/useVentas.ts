'use client';

import { useCallback } from 'react';
import type { NuevaVentaPayload } from '@/types';
import { useData } from '@/context/DataContext';
import { caja } from '@/lib/domain/sales';
import { cerrarCaja, registrarVenta } from '@/services/ventas.service';

export function useVentas() {
  const { ventas, ticket, reload } = useData();

  const cajaDe = useCallback((bid?: string) => caja(ventas, bid), [ventas]);

  const registrar = useCallback(async (p: NuevaVentaPayload) => {
    const v = await registrarVenta(p);
    await reload('ventas', 'ticket', 'clientes', 'agendaHoy');
    return v;
  }, [reload]);

  return { ventas, ticket, caja: cajaDe, registrar, cerrarCaja };
}
