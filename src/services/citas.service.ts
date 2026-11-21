import type { Cita, Confirmacion, EstadoCita, ReservaPayload } from '@/types';
import { HOY, addDays, iso, sameDay } from '@/lib/format';
import { agendables, slotsDe } from '@/lib/domain/availability';
import { ApiError, respond } from './http';
import { db } from './mock/db';
import { generarAgenda } from './mock/agenda-generator';

function agendaDe(d: Date): Cita[] {
  if (sameDay(d, HOY)) return db.agendaHoy;
  const key = iso(d);
  if (!db.agendaCache[key]) db.agendaCache[key] = generarAgenda(db.barberos, d);
  return db.agendaCache[key];
}

/** GET /citas?dia=yyyy-mm-dd */
export const obtenerAgendaDia = (d: Date) => respond(() => agendaDe(d));

/** GET /citas?desde=…&dias=n · Agenda de varios días seguidos (clave = yyyy-mm-dd) */
export const obtenerAgendaRango = (desde: Date, dias: number) =>
  respond(() => {
    const out: Record<string, Cita[]> = {};
    for (let k = 0; k < dias; k++) {
      const d = addDays(desde, k);
      out[iso(d)] = agendaDe(d);
    }
    return out;
  });

/** GET /bloqueos?dia=hoy */
export const obtenerBloqueosHoy = () => respond(() => db.bloqueos);

/** PATCH /citas/:id/estado */
export const cambiarEstadoCita = (d: Date, id: string, est: EstadoCita) =>
  respond<Cita>(() => {
    const c = agendaDe(d).find((x) => x.id === id);
    if (!c) throw new ApiError('Cita no encontrada', 404);
    c.est = est;
    return c;
  });

/** POST /reservas · Reserva en línea desde el sitio público */
export const crearReserva = (p: ReservaPayload) =>
  respond<Confirmacion>(() => {
    const sv = db.servicios.find((s) => s.id === p.servicioId);
    if (!sv) throw new ApiError('Servicio no disponible');
    let b = db.barberos.find((x) => x.id === p.barberoId);
    if (!b) b = agendables(db.barberos).find((x) => slotsDe(x, sv, p.dia).includes(p.hora));
    if (!b) b = db.barberos[0];
    return { nombre: p.nombre.trim(), cel: p.cel, sv, b, dia: p.dia, hora: p.hora };
  });
