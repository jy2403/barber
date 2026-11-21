import type { Servicio, ServicioPayload } from '@/types';
import { agendables } from '@/lib/domain/availability';
import { ApiError, respond } from './http';
import { db } from './mock/db';

/** GET /servicios */
export const listarServicios = () => respond(() => db.servicios);

/** POST /servicios · PUT /servicios/:id */
export const guardarServicio = (id: string | null, datos: ServicioPayload) =>
  respond<Servicio>(() => {
    const { barberos: ids, ...campos } = datos;
    let s = id ? db.servicios.find((x) => x.id === id) : undefined;
    if (id && !s) throw new ApiError('Servicio no encontrado', 404);
    if (s) Object.assign(s, campos);
    else {
      s = { id: 'svc' + (Date.now() % 100000), corto: campos.nombre.split(' ')[0], icon: 'sparkle', vendidos: 0, ingresos: 0, ...campos };
      db.servicios.splice(db.servicios.length - 1, 0, s);
    }
    const sid = s.id;
    agendables(db.barberos).forEach((b) => {
      const has = b.ofrece.indexOf(sid) >= 0;
      if (ids.includes(b.id) && !has) b.ofrece.push(sid);
      if (!ids.includes(b.id) && has) b.ofrece = b.ofrece.filter((x) => x !== sid);
    });
    return s;
  });

/** PATCH /servicios/:id/activo */
export const alternarServicio = (id: string) =>
  respond<Servicio>(() => {
    const s = db.servicios.find((x) => x.id === id);
    if (!s) throw new ApiError('Servicio no encontrado', 404);
    s.activo = !s.activo;
    return s;
  });
