'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PeriodoParams } from '@/types';
import { useData } from '@/context/DataContext';
import { pad } from '@/lib/format';
import { periodoInicial, rpCalc, rpMeses, rpPeriodo } from '@/lib/domain/reports';

/** Periodo elegido y cálculo del reporte */
export function useReport() {
  const { barberos, servicios } = useData();
  const [params, setParams] = useState<PeriodoParams>(periodoInicial);
  const periodo = useMemo(() => rpPeriodo(params), [params]);
  const calc = useMemo(() => rpCalc(periodo, barberos, servicios), [periodo, barberos, servicios]);
  const set = useCallback((p: Partial<PeriodoParams>) => setParams((prev) => ({ ...prev, ...p })), []);
  return { params, set, periodo, calc, meses: rpMeses() };
}

/** Imprime (o guarda como PDF) la hoja del reporte que está en pantalla */
export function usePrintReport() {
  return useCallback((tipo: string, desde: Date) => {
    const p = document.querySelector('#report-preview .paper');
    const root = document.getElementById('print-root');
    if (!p || !root) return;
    root.innerHTML = p.outerHTML;
    const t = document.title;
    document.title = 'Reporte-' + tipo + '-' + desde.getFullYear() + '-' + pad(desde.getMonth() + 1);
    document.body.classList.add('printing');
    const done = () => {
      document.body.classList.remove('printing');
      root.innerHTML = '';
      document.title = t;
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(() => {
      window.print();
      setTimeout(() => { if (document.body.classList.contains('printing') && !window.matchMedia('print').matches) done(); }, 1500);
    }, 60);
  }, []);
}
