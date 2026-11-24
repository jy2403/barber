/**
 * Historial de cambios (módulo `auditoria`). Solo administradores.
 *
 * Endpoints:
 * - GET /auditoria?entidad&entidad_id&desde&hasta&pagina&por_pagina -> Pagina<RegistroAuditoria>
 *   Ej.: los cambios de un barbero: `{ entidad: 'barbero', entidad_id: 7 }`.
 */

import { conParametros, request } from './client';
import type { ConsultaAuditoria, Pagina, RegistroAuditoria } from './tipos';

export function listarAuditoria(
  consulta: ConsultaAuditoria = {},
  signal?: AbortSignal,
): Promise<Pagina<RegistroAuditoria>> {
  return request<Pagina<RegistroAuditoria>>(conParametros('/auditoria', { ...consulta }), undefined, { signal });
}
