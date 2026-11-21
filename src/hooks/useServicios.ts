'use client';

import { useCallback, useMemo } from 'react';
import type { ServicioPayload } from '@/types';
import { useData } from '@/context/DataContext';
import { alternarServicio, guardarServicio } from '@/services/servicios.service';

export function useServicios() {
  const { servicios, reload } = useData();
  const activos = useMemo(() => servicios.filter((s) => s.activo), [servicios]);
  const porId = useCallback((id: string) => servicios.find((s) => s.id === id), [servicios]);

  const guardar = useCallback(async (id: string | null, datos: ServicioPayload) => {
    const s = await guardarServicio(id, datos);
    await reload('servicios', 'barberos');
    return s;
  }, [reload]);

  const alternar = useCallback(async (id: string) => {
    const s = await alternarServicio(id);
    await reload('servicios');
    return s;
  }, [reload]);

  return { servicios, activos, porId, guardar, alternar };
}
