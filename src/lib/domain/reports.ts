/* =========================================================
   Reportes: periodos y cálculo de ventas, comisiones y clientes
   ========================================================= */
import type { Barbero, MetodoPago, Periodo, PeriodoParams, ReporteCalc, Servicio } from '@/types';
import { NEGOCIO } from '../constants';
import { HOY, MESES, addDays, cap, diffDays, fDM, fDeMes, fromIso, iso, pad, sameDay } from '../format';
import { enVac } from './availability';

/** Base histórica mensual (lo que devolvería el backend de reportes) */
export const RBASE = {
  barberos: ['santiago', 'mateo', 'julian', 'valentina', 'andres'],
  matriz: {
    santiago: { corte: 74, combo: 52, barba: 30, cejas: 12 },
    mateo: { corte: 72, combo: 28, barba: 89, afeitado: 73 },
    julian: { corte: 117, combo: 42, barba: 77 },
    valentina: { corte: 96, barba: 32, cejas: 114 },
    andres: { corte: 18, combo: 38, cejas: 5 },
  } as Record<string, Record<string, number>>,
  desc: { santiago: 198000, mateo: 140000, julian: 137000, valentina: 91000, andres: 46000 } as Record<string, number>,
  propinas: { santiago: 486000, mateo: 612000, julian: 540000, valentina: 468000, andres: 234000 } as Record<string, number>,
  clientes: { santiago: 141, mateo: 178, julian: 164, valentina: 140, andres: 45 } as Record<string, number>,
  metodos: [['efectivo', 11214], ['nequi', 9870], ['tarjeta', 5240], ['daviplata', 2910], ['transferencia', 1611]] as [MetodoPago, number][],
  nuevos: 96,
  noShows: 31,
};
const SEAS = [0.9, 0.86, 0.95, 0.97, 1, 0.98, 0.97, 1.01, 0.96, 1, 1.04, 1.16];
const DOW_W = [0.55, 0.62, 0.7, 0.76, 0.86, 1.16, 1.36];

/** Últimos 5 meses como opciones [yyyy-mm, etiqueta] */
export function rpMeses(): [string, string][] {
  const out: [string, string][] = [];
  for (let k = 0; k < 5; k++) {
    const d = new Date(HOY.getFullYear(), HOY.getMonth() - k, 1);
    out.push([d.getFullYear() + '-' + pad(d.getMonth() + 1), cap(MESES[d.getMonth()]) + ' ' + d.getFullYear() + (k === 0 ? ' (en curso)' : '')]);
  }
  return out;
}

export function periodoInicial(): PeriodoParams {
  const a = new Date(HOY.getFullYear(), HOY.getMonth() - 1, 1);
  return { modo: 'mes', mes: rpMeses()[1][0], desde: iso(a), hasta: iso(new Date(HOY.getFullYear(), HOY.getMonth(), 0)) };
}

function rangoTxt(a: Date, b: Date) {
  if (sameDay(a, b)) return fDeMes(a) + ' de ' + a.getFullYear();
  if (a.getFullYear() !== b.getFullYear()) return fDeMes(a) + ' de ' + a.getFullYear() + ' – ' + fDeMes(b) + ' de ' + b.getFullYear();
  if (a.getMonth() !== b.getMonth()) return fDeMes(a) + ' – ' + fDeMes(b) + ' de ' + b.getFullYear();
  return a.getDate() + ' – ' + b.getDate() + ' de ' + MESES[a.getMonth()] + ' de ' + a.getFullYear();
}

export function rpPeriodo(p: PeriodoParams): Periodo {
  let desde: Date;
  let hasta: Date;
  let label: string;
  let enCurso = false;
  const fd = fromIso(p.desde);
  const fh = fromIso(p.hasta);
  if (p.modo === 'rango' && fd && fh) {
    desde = fd;
    hasta = fh;
    if (hasta < desde) [desde, hasta] = [hasta, desde];
    if (hasta > HOY) hasta = HOY;
    if (desde > hasta) desde = hasta;
    label = rangoTxt(desde, hasta);
  } else {
    const mes = p.mes || rpMeses()[1][0];
    const y = +mes.slice(0, 4);
    const m = +mes.slice(5, 7) - 1;
    desde = new Date(y, m, 1);
    hasta = new Date(y, m + 1, 0);
    if (hasta >= HOY) { hasta = HOY; enCurso = true; }
    label = MESES[m] + ' de ' + y + (enCurso ? ' (1 – ' + hasta.getDate() + ', en curso)' : '');
  }
  const dias = diffDays(hasta, desde) + 1;
  return { desde, hasta, dias, label, enCurso, f: (dias / 31) * SEAS[desde.getMonth()] };
}

export function rpCalc(per: Periodo, barberos: Barbero[], servicios: Servicio[]): ReporteCalc {
  const SV = (id: string) => servicios.find((s) => s.id === id);
  const r: ReporteCalc = { barberos: {}, svc: {}, bruto: 0, desc: 0, netas: 0, propinas: 0, servicios: 0, clientes: 0, metodos: [], semanas: [], nuevos: 0, noShows: 0, ticket: 0 };
  RBASE.barberos.forEach((id) => {
    const b = barberos.find((x) => x.id === id);
    if (!b) return;
    let lab = 0;
    for (let k = 0; k < per.dias; k++) if (!enVac(b, addDays(per.desde, k))) lab++;
    const fb = per.f * (lab / per.dias);
    const cells: Record<string, number> = {};
    let serv = 0; let bruto = 0; let brutoBase = 0;
    Object.keys(RBASE.matriz[id]).forEach((sid) => {
      const precio = SV(sid)?.precio || 0;
      const n = Math.round(RBASE.matriz[id][sid] * fb);
      cells[sid] = n; serv += n; bruto += n * precio; brutoBase += RBASE.matriz[id][sid] * precio;
      r.svc[sid] = (r.svc[sid] || 0) + n;
    });
    const desc = brutoBase ? Math.round((bruto * RBASE.desc[id]) / brutoBase / 100) * 100 : 0;
    const netas = bruto - desc;
    const prop = Math.round((RBASE.propinas[id] * fb) / 1000) * 1000;
    const cli = Math.round(RBASE.clientes[id] * fb);
    const vacNota = b.vac && per.desde <= b.vac.hasta && per.hasta >= b.vac.desde ? 'vacaciones desde el ' + fDM(b.vac.desde) : '';
    r.barberos[id] = { cells, serv, bruto, desc, netas, prop, cli, com: netas * NEGOCIO.comision, pagar: netas * NEGOCIO.comision + prop, vacNota };
    r.bruto += bruto; r.desc += desc; r.netas += netas; r.propinas += prop; r.servicios += serv; r.clientes += cli;
  });
  const totM = RBASE.metodos.reduce((a, m) => a + m[1], 0);
  let acc = 0;
  r.metodos = RBASE.metodos.map((m, i) => {
    const v = i === RBASE.metodos.length - 1 ? r.netas - acc : Math.round((r.netas * m[1]) / totM / 1000) * 1000;
    acc += v;
    return [m[0], v];
  });
  const semanas: { a: Date; b: Date; w: number }[] = [];
  let cur: { a: Date; b: Date; w: number } | null = null;
  let wsum = 0;
  for (let k = 0; k < per.dias; k++) {
    const d = addDays(per.desde, k);
    if (!cur || d.getDay() === 1) { cur = { a: d, b: d, w: 0 }; semanas.push(cur); }
    cur.b = d; cur.w += DOW_W[d.getDay()]; wsum += DOW_W[d.getDay()];
  }
  r.semanas = semanas.map((s) => ({
    label: s.a.getMonth() === s.b.getMonth() ? (sameDay(s.a, s.b) ? fDM(s.a) : s.a.getDate() + ' – ' + fDM(s.b)) : fDM(s.a) + ' – ' + fDM(s.b),
    v: wsum ? (r.netas * s.w) / wsum : 0,
  }));
  r.nuevos = Math.min(r.clientes, Math.round(RBASE.nuevos * per.f));
  r.noShows = Math.round(RBASE.noShows * per.f);
  r.ticket = r.clientes ? Math.round(r.netas / r.clientes / 100) * 100 : 0;
  return r;
}
