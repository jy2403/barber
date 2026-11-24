/**
 * Sitio público: landing y reserva en línea (módulos `agenda`, `verificacion`,
 * `negocio`, `catalogo` y `barberos`). Sin sesión.
 *
 * Flujo de la reserva:
 * 1. `getServiciosPublicos()` -> el cliente elige servicio.
 * 2. `getBarberosParaServicio(servicio_id)` -> elige barbero o «Cualquier barbero» (`null`).
 * 3. `getCalendario(...)` y `getHorasLibres(...)` -> elige día y hora.
 * 4. `pedirCodigo(celular)` -> llega un código de 4 dígitos por WhatsApp (vence en 10 min).
 * 5. `confirmarCodigo(id, codigo)` -> `comprobante` de un solo uso y, si el celular ya
 *    existía, sus datos para autocompletar.
 * 6. `reservar({ comprobante, …, politica_version_id })` -> la cita y su enlace de gestión.
 *    Si alguien tomó la hora: `409 conflicto_horario` con `error.alternativas`.
 * 7. El cliente gestiona su cita con el token del enlace (`/cita/{token}`):
 *    `getGestion`, `cancelarPorEnlace`, `reprogramarPorEnlace`, `cambiarRecordatorios`.
 *
 * Endpoints:
 * - GET  /publico/landing -> Landing (caché de 60 s)
 * - GET  /publico/servicios -> Servicio[] (agendables que algún barbero ofrece)
 * - GET  /publico/barberos?servicio_id -> OpcionBarbero[]
 * - GET  /publico/disponibilidad/calendario?servicio_id&barbero_id&mes=AAAA-MM -> Calendario
 * - GET  /publico/disponibilidad/horas?servicio_id&barbero_id&fecha -> HorasDelDia
 * - POST /publico/verificaciones { celular } -> 202 CodigoEnviado
 *   | 429 demasiados_intentos (3 por celular cada 15 min, 10 por IP por hora; trae `reintentarEn`)
 *   | 422 validacion (celular inválido)
 * - POST /publico/verificaciones/{id}/confirmar { codigo } -> Verificacion
 *   | 422 codigo_incorrecto (5 intentos; luego se invalida) | 410 codigo_vencido | 404
 * - POST /publico/citas -> 201 CitaCreada | 409 conflicto_horario (con `alternativas`)
 *   | 410 comprobante_vencido (ya usado o vencido) | 403 reserva_bloqueada (inasistencias)
 *   | 422 validacion
 * - GET  /publico/citas/gestion/{token} -> GestionCita | 410 enlace_vencido (vencido, reemplazado
 *   por uno nuevo tras un cambio de hora, o inexistente)
 * - POST /publico/citas/gestion/{token}/cancelar -> GestionCita (tardía dentro del aviso mínimo)
 *   | 409 estado_invalido
 * - POST /publico/citas/gestion/{token}/reprogramar { inicio, barbero_id } -> GestionCita
 *   | 409 conflicto_horario | 409 estado_invalido
 * - PUT  /publico/citas/gestion/{token}/recordatorios { activos } -> GestionCita
 */

import { conParametros, request, segmento } from './client';
import type {
  Calendario,
  CitaCreada,
  CodigoEnviado,
  Fecha,
  GestionCita,
  HorasDelDia,
  Landing,
  Mes,
  OpcionBarbero,
  ReprogramacionDto,
  ReservaDto,
  Servicio,
  Verificacion,
} from './tipos';

export function getLanding(signal?: AbortSignal): Promise<Landing> {
  return request<Landing>('/publico/landing', undefined, { signal });
}

export function getServiciosPublicos(signal?: AbortSignal): Promise<Servicio[]> {
  return request<Servicio[]>('/publico/servicios', undefined, { signal });
}

export function getBarberosParaServicio(servicioId: number, signal?: AbortSignal): Promise<OpcionBarbero[]> {
  return request<OpcionBarbero[]>(conParametros('/publico/barberos', { servicio_id: servicioId }), undefined, {
    signal,
  });
}

/** `barberoId` `null` = «Cualquier barbero». */
export function getCalendario(
  consulta: { servicioId: number; barberoId?: number | null; mes: Mes },
  signal?: AbortSignal,
): Promise<Calendario> {
  const path = conParametros('/publico/disponibilidad/calendario', {
    servicio_id: consulta.servicioId,
    barbero_id: consulta.barberoId,
    mes: consulta.mes,
  });
  return request<Calendario>(path, undefined, { signal });
}

/** `barberoId` `null` = «Cualquier barbero»: cada hora trae el barbero que se asignaría. */
export function getHorasLibres(
  consulta: { servicioId: number; barberoId?: number | null; fecha: Fecha },
  signal?: AbortSignal,
): Promise<HorasDelDia> {
  const path = conParametros('/publico/disponibilidad/horas', {
    servicio_id: consulta.servicioId,
    barbero_id: consulta.barberoId,
    fecha: consulta.fecha,
  });
  return request<HorasDelDia>(path, undefined, { signal });
}

/** Envía el código por WhatsApp. `celular`: 10 dígitos, empieza por 3. */
export function pedirCodigo(celular: string): Promise<CodigoEnviado> {
  return request<CodigoEnviado>('/publico/verificaciones', { celular });
}

export function confirmarCodigo(verificacionId: number, codigo: string): Promise<Verificacion> {
  return request<Verificacion>(`/publico/verificaciones/${segmento(verificacionId)}/confirmar`, { codigo });
}

export function reservar(reserva: ReservaDto): Promise<CitaCreada> {
  return request<CitaCreada>('/publico/citas', reserva);
}

/** El token es el último segmento del enlace de gestión (`…/cita/{token}`). */
export function tokenDeEnlaceGestion(enlace: string): string {
  return (enlace.split(/[?#]/)[0] ?? '').replace(/\/+$/, '').split('/').pop() ?? '';
}

const gestion = (token: string) => `/publico/citas/gestion/${segmento(token)}`;

export function getGestion(token: string, signal?: AbortSignal): Promise<GestionCita> {
  return request<GestionCita>(gestion(token), undefined, { signal });
}

export function cancelarPorEnlace(token: string): Promise<GestionCita> {
  return request<GestionCita>(`${gestion(token)}/cancelar`, {});
}

export function reprogramarPorEnlace(token: string, cambio: ReprogramacionDto): Promise<GestionCita> {
  return request<GestionCita>(`${gestion(token)}/reprogramar`, cambio);
}

export function cambiarRecordatorios(token: string, activos: boolean): Promise<GestionCita> {
  return request<GestionCita>(`${gestion(token)}/recordatorios`, { activos }, { method: 'PUT' });
}
