/**
 * Salud y estado del sistema.
 *
 * Endpoints:
 * - GET /api/salud -> { estado: 'viva' } (proceso vivo; fuera de `/api/v1`)
 * - GET /api/salud/lista -> { estado: 'lista' } | 503 { estado: 'sin_base_de_datos' }
 * - GET /api/salud/operacion -> { estado: 'ok' } | 503 { estado: 'alerta', alertas: [códigos] }
 *   | 503 { estado: 'sin_base' } (para el monitor externo; sin cifras ni datos personales)
 * - GET /api/v1/sistema/estado (Admin) -> EstadoSistema: alertas con su mensaje, informativos
 *   (p. ej., WhatsApp sin proveedor), métricas de la API, cola de mensajes y trabajos
 */

import { request } from './client';
import type { EstadoSistema } from './tipos';

export function getEstadoSistema(signal?: AbortSignal): Promise<EstadoSistema> {
  return request<EstadoSistema>('/sistema/estado', undefined, { signal });
}
