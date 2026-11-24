/**
 * Agenda del panel (módulo `agenda`). Lo público está en `./publico`.
 *
 * Las acciones sobre una cita (confirmar, iniciar, cancelar…) son `POST` a un
 * subrecurso y devuelven la cita actualizada con su historial y sus mensajes
 * (`DetalleCita`). Una transición que no aplica responde `409 estado_invalido`.
 * El barbero solo ve y toca las suyas: las de otro responden `404`.
 *
 * Endpoints:
 * - GET  /agenda/tablero?fecha (Admin) -> Tablero (una columna por barbero)
 * - GET  /agenda/citas?desde&hasta&barbero_id&estado (Admin; Barbero propio) -> Cita[]
 * - POST /agenda/citas (Admin) -> 201 DetalleCita. Sin código ni anticipación mínima; envía
 *   `cita_confirmada` por WhatsApp | 409 conflicto_horario (con `alternativas`) | 409 celular_en_uso
 * - GET  /agenda/citas/{id} (Admin; Barbero propio) -> DetalleCita
 * - POST /agenda/citas/{id}/reprogramar { inicio, barbero_id } (Admin) -> DetalleCita; avisa al
 *   cliente con un enlace nuevo | 409 conflicto_horario
 * - POST /agenda/citas/{id}/cancelar { motivo, avisar_cliente } (Admin) -> DetalleCita
 * - POST /agenda/citas/{id}/confirmar (Admin) -> DetalleCita (p. ej., confirmó por llamada)
 * - POST /agenda/citas/{id}/iniciar (Admin; Barbero propio) -> DetalleCita («En curso»)
 * - POST /agenda/citas/{id}/inasistencia (Admin; Barbero propio) -> DetalleCita (desde el día de la cita)
 * - POST /agenda/citas/{id}/recordatorio (Admin; Barbero propio) -> DetalleCita
 *   | 409 estado_invalido (el cliente los desactivó o ya se envió uno hace menos de 15 min)
 * - POST /agenda/citas/reasignacion { cita_ids, barbero_destino_id } (Admin) -> DetalleCita[]
 *   (misma hora, otro barbero; todo o nada) | 409 conflicto_horario
 * - POST /agenda/citas/aviso-reprogramacion { cita_ids } (Admin) -> { avisadas }: WhatsApp
 *   `aviso_reprogramacion` para que el cliente elija otra hora
 * - GET  /agenda/disponibilidad/horas?servicio_id&barbero_id&fecha (Admin) -> HorasDelDia
 *   (permite «ahora mismo» y fechas fuera de la ventana pública)
 * - POST /agenda/conflictos { barbero_id, ausencia | bloqueo | horario_propuesto }
 *   (Admin; Barbero propio) -> Cita[] que quedarían afectadas, ANTES de guardar
 * - GET  /agenda/pendientes-de-cierre?fecha (Admin) -> Cita[] pasadas sin venta ni inasistencia
 * - GET  /agenda/resumen-barbero?barbero_id (Barbero: el suyo; Admin con `barbero_id`)
 *   -> ResumenAgendaBarbero («Mis citas»: hoy, mañana y los próximos 7 días)
 * - GET  /agenda/configuracion (Admin) -> ConfiguracionAgenda
 * - PUT  /agenda/configuracion (Admin) -> ConfiguracionAgenda | 422 validacion
 */

import { conParametros, request, segmento } from './client';
import type {
  CancelacionDto,
  Cita,
  CitaPanelDto,
  ConfiguracionAgenda,
  ConflictosDto,
  ConsultaCitas,
  DetalleCita,
  Fecha,
  HorasDelDia,
  ReprogramacionDto,
  ResumenAgendaBarbero,
  Tablero,
} from './tipos';

const cita = (id: number) => `/agenda/citas/${segmento(id)}`;

export function getTablero(fecha?: Fecha, signal?: AbortSignal): Promise<Tablero> {
  return request<Tablero>(conParametros('/agenda/tablero', { fecha }), undefined, { signal });
}

export function listarCitas(consulta: ConsultaCitas = {}, signal?: AbortSignal): Promise<Cita[]> {
  return request<Cita[]>(conParametros('/agenda/citas', { ...consulta }), undefined, { signal });
}

export function crearCita(datos: CitaPanelDto): Promise<DetalleCita> {
  return request<DetalleCita>('/agenda/citas', datos);
}

export function getCita(id: number, signal?: AbortSignal): Promise<DetalleCita> {
  return request<DetalleCita>(cita(id), undefined, { signal });
}

export function reprogramarCita(id: number, cambio: ReprogramacionDto): Promise<DetalleCita> {
  return request<DetalleCita>(`${cita(id)}/reprogramar`, cambio);
}

export function cancelarCita(id: number, cancelacion: CancelacionDto): Promise<DetalleCita> {
  return request<DetalleCita>(`${cita(id)}/cancelar`, cancelacion);
}

export function confirmarCita(id: number): Promise<DetalleCita> {
  return request<DetalleCita>(`${cita(id)}/confirmar`, {});
}

export function iniciarCita(id: number): Promise<DetalleCita> {
  return request<DetalleCita>(`${cita(id)}/iniciar`, {});
}

export function marcarInasistencia(id: number): Promise<DetalleCita> {
  return request<DetalleCita>(`${cita(id)}/inasistencia`, {});
}

/** Recordatorio manual por WhatsApp (con los botones «Confirmo» y «Cancelar cita»). */
export function enviarRecordatorio(id: number): Promise<DetalleCita> {
  return request<DetalleCita>(`${cita(id)}/recordatorio`, {});
}

export function reasignarCitas(citaIds: number[], barberoDestinoId: number): Promise<DetalleCita[]> {
  return request<DetalleCita[]>('/agenda/citas/reasignacion', {
    cita_ids: citaIds,
    barbero_destino_id: barberoDestinoId,
  });
}

/** Pide a los clientes elegir otra hora por WhatsApp. Devuelve cuántos se avisaron. */
export function pedirReprogramacion(citaIds: number[]): Promise<{ avisadas: number }> {
  return request<{ avisadas: number }>('/agenda/citas/aviso-reprogramacion', { cita_ids: citaIds });
}

/** `barberoId` `null` = el primero libre. */
export function getHorasPanel(
  consulta: { servicioId: number; barberoId?: number | null; fecha: Fecha },
  signal?: AbortSignal,
): Promise<HorasDelDia> {
  const path = conParametros('/agenda/disponibilidad/horas', {
    servicio_id: consulta.servicioId,
    barbero_id: consulta.barberoId,
    fecha: consulta.fecha,
  });
  return request<HorasDelDia>(path, undefined, { signal });
}

/** Citas que quedarían afectadas por un horario, una ausencia o un bloqueo (antes de guardarlo). */
export function buscarConflictos(propuesta: ConflictosDto): Promise<Cita[]> {
  return request<Cita[]>('/agenda/conflictos', propuesta);
}

export function getPendientesDeCierre(fecha?: Fecha, signal?: AbortSignal): Promise<Cita[]> {
  return request<Cita[]>(conParametros('/agenda/pendientes-de-cierre', { fecha }), undefined, { signal });
}

/** «Mis citas». El barbero siempre recibe el suyo; el admin debe indicar `barberoId`. */
export function getResumenAgendaBarbero(barberoId?: number, signal?: AbortSignal): Promise<ResumenAgendaBarbero> {
  return request<ResumenAgendaBarbero>(conParametros('/agenda/resumen-barbero', { barbero_id: barberoId }), undefined, {
    signal,
  });
}

export function getConfiguracionAgenda(signal?: AbortSignal): Promise<ConfiguracionAgenda> {
  return request<ConfiguracionAgenda>('/agenda/configuracion', undefined, { signal });
}

export function guardarConfiguracionAgenda(config: ConfiguracionAgenda): Promise<ConfiguracionAgenda> {
  return request<ConfiguracionAgenda>('/agenda/configuracion', config, { method: 'PUT' });
}
