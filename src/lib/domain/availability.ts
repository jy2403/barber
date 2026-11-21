/* =========================================================
   Disponibilidad: horarios, festivos y horas libres
   ========================================================= */
import type { Barbero, Franja, Servicio } from '@/types';
import { CERRADO, FESTIVOS, VENTANA } from '../constants';
import { HOY, NOW, addDays, diffDays, fDM, fDMA, fMedia, hora, iso } from '../format';

export const esFestivo = (d: Date) => !!FESTIVOS[iso(d)];
/** Los festivos se atienden con el horario del domingo */
export const dowEf = (d: Date) => (esFestivo(d) ? 0 : d.getDay());
export const enVac = (b: Barbero, d: Date) => !!(b.vac && d >= b.vac.desde && d <= b.vac.hasta);

export function rangosDe(b: Barbero, d: Date): Franja[] {
  if (b.estado === 'inactivo' || b.estado === 'suspendido' || CERRADO[iso(d)] || enVac(b, d)) return [];
  return b.dias[dowEf(d)] || [];
}

export const agendables = (barberos: Barbero[]) => barberos.filter((b) => b.estado === 'activo' || b.estado === 'vacaciones');

export function slotsDe(b: Barbero, sv: Servicio | undefined, d: Date): number[] {
  if (!sv || b.ofrece.indexOf(sv.id) < 0) return [];
  const off = diffDays(d, HOY);
  if (off < 0 || off > VENTANA) return [];
  if (b.lleno.indexOf(off) >= 0) return [];
  const out: number[] = [];
  rangosDe(b, d).forEach((r) => {
    for (let t = r[0]; t + sv.dur <= r[1]; t += 30) out.push(t);
  });
  // Ocupación simulada (determinística) para la demostración
  const dw = d.getDay();
  const ocupado = dw === 5 || dw === 6 ? 2 : 1;
  const seed = d.getDate() * 7 + (d.getMonth() + 1) * 3 + b.id.length * 5;
  let res = out.filter((t) => (seed + (t / 30) * 3) % 5 >= ocupado);
  if (off === 0) {
    const lim = NOW.getHours() * 60 + NOW.getMinutes() + 120;
    res = res.filter((t) => t >= lim);
  }
  return res;
}

/** Horas libres de un barbero, o de cualquiera si bid = 'cualquier' */
export function slots(barberos: Barbero[], bid: string, sv: Servicio | undefined, d: Date): number[] {
  if (bid !== 'cualquier') {
    const b = barberos.find((x) => x.id === bid);
    return b ? slotsDe(b, sv, d) : [];
  }
  const set: Record<number, true> = {};
  agendables(barberos).forEach((b) => slotsDe(b, sv, d).forEach((t) => { set[t] = true; }));
  return Object.keys(set).map(Number).sort((a, z) => a - z);
}

export function proximaHora(barberos: Barbero[], b: Barbero | null, sv: Servicio): string {
  for (let k = 0; k <= VENTANA; k++) {
    const d = addDays(HOY, k);
    const ls = b ? slotsDe(b, sv, d) : slots(barberos, 'cualquier', sv, d);
    if (ls.length) return 'Próxima hora libre: ' + (k === 0 ? 'hoy' : k === 1 ? 'mañana' : fMedia(d)) + ', ' + hora(ls[0]);
  }
  return 'Sin horas libres en los próximos ' + VENTANA + ' días';
}

/** Meses que cubre la ventana de reserva */
export function mesesReserva(): Date[] {
  const out: Date[] = [];
  const fin = addDays(HOY, VENTANA);
  for (let d = new Date(HOY.getFullYear(), HOY.getMonth(), 1); d <= fin; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) out.push(d);
  return out;
}

export const notaEstado = (b: Barbero) => {
  if (b.estado === 'vacaciones' && b.vac) return 'Del ' + fDM(b.vac.desde) + ' al ' + fDM(b.vac.hasta);
  if (b.estado === 'inactivo' && b.retiro) return 'Retirado el ' + fDMA(b.retiro);
  return '';
};
