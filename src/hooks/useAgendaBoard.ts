'use client';

import { useMemo, useState } from 'react';
import type { Barbero, Bloqueo, Cita } from '@/types';
import { useData } from '@/context/DataContext';
import { HOY, addDays, fDeMes, fromIso, sameDay } from '@/lib/format';
import { enVac, esFestivo, rangosDe } from '@/lib/domain/availability';
import { porAtender } from '@/lib/domain/sales';
import { useAgendaDia } from './useAgenda';
import { useBarberos } from './useBarberos';

const autoSel = (l: Cita[]) => (l.find((c) => c.est === 'encurso') || l.find(porAtender))?.id ?? null;

/** Estado de la agenda del administrador: día, vista, filtro por barbero y cita seleccionada */
export function useAgendaBoard(diaInicial?: string | null) {
  const { bloqueos } = useData();
  const { agendables } = useBarberos();
  const [dia, setDia] = useState<Date>(() => fromIso(diaInicial) || HOY);
  const [vista, setVista] = useState<'dia' | 'lista'>('dia');
  const [filtro, setFiltro] = useState('todos');
  const [selId, setSelId] = useState<string | null>(null);
  const { citas, loading, cambiarEstado } = useAgendaDia(dia);

  const cols = useMemo(() => agendables.filter((b) => filtro === 'todos' || b.id === filtro), [agendables, filtro]);
  const lista = useMemo(() => citas.filter((c) => filtro === 'todos' || c.b === filtro), [citas, filtro]);
  const sel = citas.find((c) => c.id === selId) || citas.find((c) => c.id === autoSel(citas)) || null;

  const rango = useMemo<[number, number]>(() => {
    let a = 540;
    let z = 1200;
    cols.forEach((b) => rangosDe(b, dia).forEach((r) => { a = Math.min(a, r[0]); z = Math.max(z, r[1]); }));
    lista.forEach((c) => { a = Math.min(a, c.ini); z = Math.max(z, c.ini + c.dur); });
    return [Math.floor(a / 60) * 60, Math.ceil(z / 60) * 60];
  }, [cols, lista, dia]);

  /** Bloques sin atención (fuera de turno, almuerzo, vacaciones…) de una columna */
  const offBlocks = (b: Barbero): Bloqueo[] => {
    const [a, z] = rango;
    if (enVac(b, dia)) return [{ b: b.id, ini: a, dur: z - a, label: 'De vacaciones hasta el ' + fDeMes(b.vac!.hasta), vac: true }];
    if (sameDay(dia, HOY)) return bloqueos.filter((x) => x.b === b.id);
    const rs = rangosDe(b, dia);
    if (!rs.length) return [{ b: b.id, ini: a, dur: z - a, label: esFestivo(dia) ? 'Festivo · día libre' : 'Día libre' }];
    const out: Bloqueo[] = [];
    let t = a;
    rs.forEach((r, i) => {
      if (r[0] > t) out.push({ b: b.id, ini: t, dur: r[0] - t, label: i === 0 ? 'Fuera de turno' : r[0] - t <= 60 ? 'Almuerzo' : 'Descanso' });
      t = Math.max(t, r[1]);
    });
    if (t < z) out.push({ b: b.id, ini: t, dur: z - t, label: 'Fuera de turno' });
    return out;
  };

  return {
    dia,
    vista,
    filtro,
    citas,
    lista,
    cols,
    sel,
    loading,
    rango,
    offBlocks,
    setVista,
    setFiltro,
    seleccionar: setSelId,
    moverDia: (d: number) => { setDia((x) => addDays(x, d)); setSelId(null); },
    irHoy: () => { setDia(HOY); setSelId(null); },
    cambiarEstado,
  };
}
