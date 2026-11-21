'use client';

import { useCallback, useMemo } from 'react';
import type { BarberoPayload, EstadoBarbero, HorarioSemanal } from '@/types';
import { useData } from '@/context/DataContext';
import { agendables } from '@/lib/domain/availability';
import * as api from '@/services/barberos.service';

export function useBarberos() {
  const { barberos, reload } = useData();
  const porId = useCallback((id?: string | null) => barberos.find((b) => b.id === id), [barberos]);
  const lista = useMemo(() => ({ agendables: agendables(barberos), activos: barberos.filter((b) => b.estado === 'activo') }), [barberos]);

  const refrescar = useCallback(() => reload('barberos'), [reload]);

  const crear = useCallback(async (p: BarberoPayload) => { const b = await api.crearBarbero(p); await refrescar(); return b; }, [refrescar]);
  const actualizar = useCallback(async (id: string, p: Partial<BarberoPayload>) => { const b = await api.actualizarBarbero(id, p); await refrescar(); return b; }, [refrescar]);
  const cambiarEstado = useCallback(
    async (id: string, d: { estado: EstadoBarbero; desde?: Date | null; hasta?: Date | null; ofrece: string[]; dias: HorarioSemanal }) => {
      const b = await api.cambiarEstadoBarbero(id, d);
      await refrescar();
      return b;
    },
    [refrescar],
  );
  const quitarServicio = useCallback(async (id: string, sid: string) => { const b = await api.quitarServicioBarbero(id, sid); await refrescar(); return b; }, [refrescar]);
  const asignarServicio = useCallback(async (sid: string, ids: string[]) => { await api.asignarServicio(sid, ids); await refrescar(); }, [refrescar]);

  return { barberos, porId, ...lista, crear, actualizar, cambiarEstado, quitarServicio, asignarServicio };
}
