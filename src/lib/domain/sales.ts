/* =========================================================
   Ventas y caja
   ========================================================= */
import type { Caja, Cita, Cliente, DescuentoId, MetodoPago, Servicio, Venta } from '@/types';
import { DESCUENTOS, METODOS } from '../constants';
import { AHORA_DEMO, HOY, addDays, fDM, plural } from '../format';

export function calcularVenta(servicios: Servicio[], items: string[], descId: DescuentoId, propina: number) {
  const sub = items.reduce((s, id) => s + (servicios.find((x) => x.id === id)?.precio || 0), 0);
  const d = DESCUENTOS.find((x) => x.id === descId) || DESCUENTOS[0];
  const desc = Math.round(d.calc(sub));
  return { sub, desc, dtxt: d.txt, neto: sub - desc, total: sub - desc + propina };
}

export function mkVenta(
  servicios: Servicio[],
  v: { t: number; cliente: string; b: string; items: string[]; desc: DescuentoId; propina: number; metodo: MetodoPago },
  ticket: number,
): Venta {
  const c = calcularVenta(servicios, v.items, v.desc, v.propina);
  return { ...v, ticket, sub: c.sub, descVal: c.desc, neto: c.neto, total: c.total };
}

export const itemsTxt = (servicios: Servicio[], items: string[]) => items.map((id) => servicios.find((s) => s.id === id)?.corto || id).join(' + ');

export function caja(ventas: Venta[], bid?: string): Caja {
  const vs = bid ? ventas.filter((v) => v.b === bid) : ventas;
  const metodos = {} as Record<MetodoPago, number>;
  METODOS.forEach((m) => { metodos[m[0]] = 0; });
  const r: Caja = { n: vs.length, total: 0, propinas: 0, servicios: 0, clientes: vs.length, metodos };
  vs.forEach((v) => {
    r.total += v.neto;
    r.propinas += v.propina;
    r.servicios += v.items.length;
    r.metodos[v.metodo] += v.neto;
  });
  return r;
}

/** Hora (en minutos) que se asigna al siguiente ticket de la demostración */
export const horaTicket = (ticket: number) => AHORA_DEMO + 2 + (ticket - 148) * 3;

export const porAtender = (c: Cita) => c.est === 'confirmada' || c.est === 'pendiente' || c.est === 'encurso';

/** Citas que se pueden cargar en el formulario de venta */
export function citasCobrables(agenda: Cita[], rol: 'admin' | 'barbero', yo: string) {
  return agenda
    .filter((c) => (rol === 'barbero' ? c.b === yo : true) && (c.est === 'encurso' || ((c.est === 'confirmada' || c.est === 'pendiente') && c.ini >= AHORA_DEMO)))
    .sort((a, z) => (a.est === 'encurso' ? -1 : 0) - (z.est === 'encurso' ? -1 : 0) || a.ini - z.ini || a.b.localeCompare(z.b))
    .slice(0, rol === 'barbero' ? 2 : 3);
}

export const ultimaTxt = (c: Cliente) => (c.dias === 0 ? 'Hoy' : fDM(addDays(HOY, -c.dias)));

export interface ClienteVenta {
  nombre: string;
  detalle: string;
  seg: Cliente['seg'];
}

export function clienteResumen(k: Cliente): ClienteVenta {
  return { nombre: k.nombre, detalle: k.cel + ' · ' + plural(k.visitas, 'visita', 'visitas') + ' · última: ' + ultimaTxt(k).toLowerCase(), seg: k.seg };
}
