/**
 * Avisos internos y registro de mensajes (módulo `notificaciones`). Solo administradores.
 *
 * Los avisos los crea el sistema: un WhatsApp de una cita que no se entregó, o
 * citas afectadas por un cambio de horario, un bloqueo, una ausencia o un
 * retiro (con `datos.cita_ids` para abrirlas). El webhook de Meta
 * (`/webhooks/whatsapp`) no es para el front.
 *
 * Endpoints:
 * - GET  /avisos?no_leidos=true&pagina&por_pagina -> Pagina<Aviso>
 * - POST /avisos/{id}/leido -> Aviso (idempotente)
 * - GET  /mensajes?destinatario&estado&canal&plantilla&pagina&por_pagina -> Pagina<Mensaje>
 *   (sin las variables; los de una cita vienen en `getCita(id).mensajes`)
 */

import { conParametros, request, segmento } from './client';
import type { Aviso, ConsultaMensajes, ConsultaPagina, Mensaje, Pagina } from './tipos';

export function listarAvisos(
  consulta: ConsultaPagina & { no_leidos?: boolean } = {},
  signal?: AbortSignal,
): Promise<Pagina<Aviso>> {
  const path = conParametros('/avisos', { ...consulta, no_leidos: consulta.no_leidos ? true : undefined });
  return request<Pagina<Aviso>>(path, undefined, { signal });
}

export function marcarAvisoLeido(id: number): Promise<Aviso> {
  return request<Aviso>(`/avisos/${segmento(id)}/leido`, {});
}

export function listarMensajes(consulta: ConsultaMensajes = {}, signal?: AbortSignal): Promise<Pagina<Mensaje>> {
  return request<Pagina<Mensaje>>(conParametros('/mensajes', { ...consulta }), undefined, { signal });
}
