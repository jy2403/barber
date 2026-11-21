'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Barbero, Franja, HorarioSemanal } from '@/types';
import { edToDow } from '@/lib/constants';

export interface DiaEditor {
  on: boolean;
  r: Franja[];
}
export interface ScheduleState {
  modo: 'semana' | 'dia';
  semana: boolean[];
  franjas: Franja[];
  dias: DiaEditor[];
}

const BASE: Franja[] = [[540, 780], [840, 1140]];
const copia = (r: Franja[]) => r.map((x) => [x[0], x[1]] as Franja);

function inicial(b: Barbero | null | undefined, modo: 'semana' | 'dia'): ScheduleState {
  const dias: DiaEditor[] = [];
  for (let i = 0; i < 7; i++) {
    const r = b && b.dias[edToDow(i)] ? copia(b.dias[edToDow(i)]!) : [];
    dias.push({ on: b ? r.length > 0 : i < 6, r: b ? r : copia(BASE) });
  }
  return { modo, semana: dias.map((d) => d.on), franjas: copia(BASE), dias };
}

const siguiente = (r: Franja[]): Franja => {
  const l = r[r.length - 1];
  const a = Math.min(l ? l[1] + 60 : 540, 1260);
  return [a, Math.min(a + 120, 1380)];
};

/** Estado del editor de horario semanal (igual para toda la semana o por día) */
export function useScheduleEditor(b: Barbero | null | undefined, modoInicial: 'semana' | 'dia') {
  const [s, setS] = useState<ScheduleState>(() => inicial(b, modoInicial));
  const upd = (fn: (d: ScheduleState) => void) =>
    setS((prev) => {
      const next: ScheduleState = { modo: prev.modo, semana: [...prev.semana], franjas: copia(prev.franjas), dias: prev.dias.map((d) => ({ on: d.on, r: copia(d.r) })) };
      fn(next);
      return next;
    });

  const total = useMemo(() => {
    if (s.modo === 'semana') {
      const porDia = s.franjas.reduce((a, f) => a + Math.max(0, f[1] - f[0]), 0);
      return porDia * s.semana.filter(Boolean).length;
    }
    return s.dias.reduce((t, d) => (d.on ? t + d.r.reduce((a, x) => a + x[1] - x[0], 0) : t), 0);
  }, [s]);

  const acciones = {
    setModo: (m: 'semana' | 'dia') => upd((d) => { d.modo = m; }),
    toggleChip: (i: number) => upd((d) => { d.semana[i] = !d.semana[i]; }),
    addFranja: () => upd((d) => { d.franjas.push(siguiente(d.franjas)); }),
    delFranja: (j: number) => upd((d) => { d.franjas.splice(j, 1); }),
    setFranja: (j: number, k: 0 | 1, v: number) =>
      upd((d) => {
        const f = d.franjas[j];
        f[k] = v;
        if (f[1] <= f[0]) f[1] = Math.min(f[0] + 60, 1380);
      }),
    toggleDia: (i: number) =>
      upd((d) => {
        const x = d.dias[i];
        x.on = !x.on;
        if (x.on && !x.r.length) x.r = copia(BASE);
      }),
    delRango: (i: number, k: number) =>
      upd((d) => {
        const x = d.dias[i];
        x.r.splice(k, 1);
        if (!x.r.length) x.on = false;
      }),
    addRango: (i: number) => upd((d) => { d.dias[i].r.push(siguiente(d.dias[i].r)); }),
    setRango: (i: number, k: number, a: number, z: number) =>
      upd((d) => {
        d.dias[i].r[k] = [a, z];
        d.dias[i].r.sort((p, q) => p[0] - q[0]);
      }),
    copiarLunes: () =>
      upd((d) => {
        const base = d.dias[0];
        d.dias = d.dias.map((x, k) => (k === 0 || k === 6 ? x : { on: base.on, r: copia(base.r) }));
      }),
  };

  /** Convierte el estado del editor al horario que guarda el backend */
  const toHorario = useCallback((): HorarioSemanal => {
    const dias: HorarioSemanal = {};
    if (s.modo === 'semana') s.semana.forEach((on, i) => { if (on) dias[edToDow(i)] = copia(s.franjas); });
    else s.dias.forEach((d, i) => { if (d.on && d.r.length) dias[edToDow(i)] = copia(d.r); });
    return dias;
  }, [s]);

  return { s, total, ...acciones, toHorario };
}

export type ScheduleEditorApi = ReturnType<typeof useScheduleEditor>;
