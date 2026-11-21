import type { NuevaVentaPayload, Venta } from '@/types';
import { HOY, fTel } from '@/lib/format';
import { mkVenta } from '@/lib/domain/sales';
import { ApiError, respond } from './http';
import { db } from './mock/db';

/** GET /ventas?dia=hoy */
export const listarVentasHoy = () => respond(() => db.ventas);

/** GET /ventas/siguiente-ticket */
export const obtenerSiguienteTicket = () => respond(() => db.ticket);

/** POST /ventas */
export const registrarVenta = (p: NuevaVentaPayload) =>
  respond<Venta>(() => {
    if (!p.items.length) throw new ApiError('Agrega al menos un servicio antes de registrar la venta.');
    if (p.clienteNuevo) {
      db.clientes.unshift({
        nombre: p.clienteNuevo.nombre, cel: fTel(p.clienteNuevo.cel), correo: p.clienteNuevo.correo || '—', visitas: 1, dias: 0, total: 0,
        barbero: p.b, seg: 'nuevo', noShows: 0, desde: HOY, cumple: 'Sin registrar', pref: 'Sin notas.',
      });
    }
    const base = { t: p.t, cliente: p.cliente, b: p.b, items: p.items, desc: p.desc, propina: p.propina, metodo: p.metodo };
    const v: Venta = { ...mkVenta(db.servicios, base, db.ticket++), nueva: true };
    db.ventas.push(v);
    const k = db.clientes.find((c) => c.nombre === p.cliente);
    if (k) {
      k.total += v.neto;
      if (!p.clienteNuevo) k.visitas += 1;
      k.dias = 0;
    }
    if (p.citaId !== undefined) {
      const c = db.agendaHoy.find((x) => x.id === p.citaId);
      if (c) c.est = 'atendida';
    }
    return v;
  });

/** POST /caja/cierre */
export const cerrarCaja = (efectivoContado: number) => respond(() => ({ ok: true, efectivoContado }));
