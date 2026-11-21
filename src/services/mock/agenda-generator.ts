/* Genera (de forma determinística) la agenda de días distintos a hoy para la demostración */
import type { Barbero, Cita, EstadoCita } from '@/types';
import { NOTAS, PAQ } from '@/lib/constants';
import { HOY, diffDays, iso } from '@/lib/format';
import { agendables, rangosDe } from '@/lib/domain/availability';

const POOL_NOMBRES = ['Tomás Hoyos', 'Gabriel Montoya', 'Luis Fernando Arias', 'Simón Cardona', 'Kevin Restrepo', 'Nicolás Uribe', 'Martín Ospina', 'Diego Salazar', 'Julián Mesa', 'Esteban Cano', 'Felipe Duque', 'Samuel Vélez', 'Mateo Lopera', 'Juan Camilo Torres', 'Daniel Restrepo', 'Cristian Muñoz', 'Óscar Pérez', 'Ricardo Gil', 'Manuel Zapata', 'Sergio Quintero', 'Pablo Arango', 'Hernán Cifuentes', 'Iván Montoya', 'Laura Mejía', 'Camila Henao', 'Alejandro Toro'];
const PAQ_DUR: Record<string, number> = { Corte: 45, Barba: 30, Combo: 75, 'Combo + cejas': 90, Afeitado: 45, Cejas: 15 };
const PAQ_PESO = ['Corte', 'Corte', 'Corte', 'Combo', 'Combo', 'Barba', 'Barba', 'Cejas', 'Afeitado', 'Combo + cejas'];

const hsh = (n: number) => {
  let x = n | 0;
  x = (x ^ 61) ^ (x >>> 16);
  x = x + (x << 3);
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return Math.abs(x);
};

export function generarAgenda(barberos: Barbero[], d: Date): Cita[] {
  const key = iso(d);
  const off = diffDays(d, HOY);
  const out: Cita[] = [];
  agendables(barberos).forEach((b, bi) => {
    const rs = rangosDe(b, d);
    const full = b.lleno.indexOf(off) >= 0;
    const keys = PAQ_PESO.filter((k) => PAQ[k].items.every((i) => b.ofrece.indexOf(i) >= 0));
    if (!keys.length) return;
    let k = 0;
    rs.forEach((r) => {
      let t = r[0];
      for (let guard = 0; guard < 40; guard++) {
        const h = hsh(d.getDate() * 131 + (d.getMonth() + 1) * 977 + bi * 7919 + k * 13 + 3);
        const pk = keys[h % keys.length];
        const dur = PAQ_DUR[pk];
        if (t + dur > r[1]) {
          if (dur > 30 && t + 30 <= r[1]) { k++; continue; }
          break;
        }
        const skip = !full && h % 10 < (off > 0 ? Math.min(6, 1 + off / 3) : 2);
        if (skip) { t += 30; k++; continue; }
        let est: EstadoCita;
        if (off < 0) est = h % 17 === 0 ? 'noasistio' : h % 23 === 0 ? 'cancelada' : 'atendida';
        else est = h % (off === 1 ? 5 : 3) === 0 ? 'pendiente' : h % 29 === 0 ? 'cancelada' : 'confirmada';
        const p = PAQ[pk];
        out.push({
          id: key + '-' + out.length, b: b.id, ini: t, dur, cliente: POOL_NOMBRES[(h >>> 3) % POOL_NOMBRES.length], paquete: pk, items: p.items, largo: p.largo, precio: p.precio, est,
          tel: '3' + (10 + (h % 10)) + ' 555 ' + String(1000 + (h % 9000)).slice(0, 4),
          hist: h % 5 === 0 ? 'Primera visita' : 2 + (h % 12) + ' visitas',
          nota: h % 6 === 0 ? NOTAS[h % 4] : '',
          origen: h % 4 === 1 ? 'Agendada por el administrador' : 'Agendada en línea',
        });
        t += dur + (h % 3 === 0 ? 15 : 0);
        k++;
      }
    });
  });
  return out;
}
