import type { Barbero, BarberoPayload, BloqueoPersonal, EstadoBarbero, HorarioSemanal } from '@/types';
import { HOY, miles, norm, digits, fTel } from '@/lib/format';
import { ApiError, respond } from './http';
import { db } from './mock/db';

const buscar = (id: string) => {
  const b = db.barberos.find((x) => x.id === id);
  if (!b) throw new ApiError('Barbero no encontrado', 404);
  return b;
};
/** Un cambio de horario o servicios invalida las agendas generadas */
const invalidarAgendas = () => { db.agendaCache = {}; };

/** GET /barberos */
export const listarBarberos = () => respond(() => db.barberos);

/** POST /barberos */
export const crearBarbero = (p: BarberoPayload) =>
  respond<Barbero>(() => {
    const id = norm(p.nombre).replace(/[^a-z]/g, '').slice(0, 12) + (Date.now() % 1000);
    const b: Barbero = {
      id, nombre: p.nombre, corto: p.corto || p.nombre.split(' ')[0], esp: p.esp, espC: p.esp, exp: (p.exp || '1') + ' años de oficio',
      ig: '@' + ((p.ig || '').replace('@', '') || 'instagram'), tipoDoc: p.tipoDoc || 'CC', doc: miles(+digits(p.doc)), cel: fTel(p.cel), correo: p.correo,
      ingreso: HOY, estado: 'activo', ofrece: p.ofrece, dias: p.dias, lleno: [],
    };
    db.barberos.splice(db.barberos.length - 1, 0, b);
    invalidarAgendas();
    return b;
  });

/** PUT /barberos/:id (datos personales, servicios y horario) */
export const actualizarBarbero = (id: string, p: Partial<BarberoPayload>) =>
  respond<Barbero>(() => {
    const b = buscar(id);
    if (p.nombre) b.nombre = p.nombre;
    if (p.esp) { b.esp = p.esp; b.espC = p.esp; }
    if (p.cel) b.cel = fTel(p.cel);
    if (p.correo) b.correo = p.correo;
    if (p.ofrece) b.ofrece = p.ofrece;
    if (p.dias) b.dias = p.dias;
    invalidarAgendas();
    return b;
  });

/** PUT /barberos/:id/estado */
export const cambiarEstadoBarbero = (
  id: string,
  datos: { estado: EstadoBarbero; desde?: Date | null; hasta?: Date | null; ofrece: string[]; dias: HorarioSemanal },
) =>
  respond<Barbero>(() => {
    const b = buscar(id);
    if (['vacaciones', 'incapacidad', 'suspendido'].includes(datos.estado)) {
      if (!datos.desde || !datos.hasta || datos.hasta < datos.desde) throw new ApiError('Revisa las fechas: “Hasta” debe ser igual o posterior a “Desde”.');
      b.vac = { desde: datos.desde, hasta: datos.hasta };
    } else delete b.vac;
    if (datos.estado === 'inactivo') b.retiro = HOY;
    b.estado = datos.estado;
    b.ofrece = datos.ofrece;
    b.dias = datos.dias;
    invalidarAgendas();
    return b;
  });

/** DELETE /barberos/:id/servicios/:servicioId */
export const quitarServicioBarbero = (id: string, servicioId: string) =>
  respond<Barbero>(() => {
    const b = buscar(id);
    b.ofrece = b.ofrece.filter((x) => x !== servicioId);
    invalidarAgendas();
    return b;
  });

/** POST /servicios/:servicioId/barberos */
export const asignarServicio = (servicioId: string, barberoIds: string[]) =>
  respond<Barbero[]>(() => {
    barberoIds.forEach((id) => {
      const b = buscar(id);
      if (!b.ofrece.includes(servicioId)) b.ofrece.push(servicioId);
    });
    invalidarAgendas();
    return db.barberos;
  });

/** GET /barberos/:id/bloqueos */
export const listarBloqueosPersonales = (id: string) => respond(() => db.bloqueosPersonales.filter((x) => x.b === id));

/** POST /barberos/:id/bloqueos */
export const crearBloqueoPersonal = (id: string, d: Omit<BloqueoPersonal, 'id' | 'b'>) =>
  respond<BloqueoPersonal>(() => {
    if (d.z <= d.a) throw new ApiError('La hora final debe ser posterior a la inicial.');
    const x: BloqueoPersonal = { ...d, id: 'bp' + Date.now(), b: id };
    db.bloqueosPersonales.push(x);
    return x;
  });

/** DELETE /barberos/:id/bloqueos/:bloqueoId */
export const eliminarBloqueoPersonal = (bloqueoId: string) =>
  respond(() => {
    db.bloqueosPersonales = db.bloqueosPersonales.filter((x) => x.id !== bloqueoId);
    return true;
  });
