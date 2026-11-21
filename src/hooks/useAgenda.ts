'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Cita, EstadoCita } from '@/types';
import { useData } from '@/context/DataContext';
import { HOY, iso, sameDay } from '@/lib/format';
import { cambiarEstadoCita, obtenerAgendaDia, obtenerAgendaRango } from '@/services/citas.service';

/**
 * Agenda de un día. La de hoy vive en el contexto (la comparten dashboard,
 * ventas y panel del barbero); la de otros días se pide al backend.
 */
export function useAgendaDia(dia: Date) {
  const { agendaHoy, barberos, reload } = useData();
  const esHoy = sameDay(dia, HOY);
  const key = iso(dia);
  const [otro, setOtro] = useState<{ key: string; citas: Cita[] } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (esHoy) return;
    let vivo = true;
    obtenerAgendaDia(dia).then((c) => { if (vivo) setOtro({ key, citas: c }); });
    return () => { vivo = false; };
    // `barberos` invalida la agenda generada cuando cambia un horario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, esHoy, version, barberos]);

  const citas = esHoy ? agendaHoy : otro && otro.key === key ? otro.citas : [];
  const loading = !esHoy && (!otro || otro.key !== key);

  const cambiarEstado = useCallback(
    async (id: string, est: EstadoCita) => {
      const c = await cambiarEstadoCita(dia, id, est);
      if (esHoy) await reload('agendaHoy');
      else setVersion((v) => v + 1);
      return c;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, esHoy, reload],
  );

  return { citas, loading, cambiarEstado };
}

/** Agenda de varios días seguidos (clave yyyy-mm-dd) */
export function useAgendaRango(desde: Date, dias: number) {
  const { agendaHoy, barberos } = useData();
  const [data, setData] = useState<Record<string, Cita[]>>({});
  const key = iso(desde) + ':' + dias;
  useEffect(() => {
    let vivo = true;
    obtenerAgendaRango(desde, dias).then((d) => { if (vivo) setData(d); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, barberos]);
  const get = useCallback((d: Date) => (sameDay(d, HOY) ? agendaHoy : data[iso(d)] || []), [data, agendaHoy]);
  return { get };
}
