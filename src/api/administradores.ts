/**
 * Administradores (módulo `identidad`). Solo administradores.
 *
 * Endpoints:
 * - GET   /administradores -> Administrador[]
 * - POST  /administradores { correo, nombre } -> 201 { id } y envía la invitación por correo
 *   | 409 correo_en_uso | 422 validacion
 * - PATCH /administradores/{id} { activo } -> 204. Desactivar cierra sus sesiones
 *   | 409 ultimo_administrador (es el último activo) | 409 no_puede_desactivarse (es uno mismo)
 */

import { request, segmento } from './client';
import type { Administrador, InvitarAdministradorDto } from './tipos';

export function listarAdministradores(signal?: AbortSignal): Promise<Administrador[]> {
  return request<Administrador[]>('/administradores', undefined, { signal });
}

export function invitarAdministrador(datos: InvitarAdministradorDto): Promise<{ id: number }> {
  return request<{ id: number }>('/administradores', datos);
}

export function cambiarEstadoAdministrador(id: number, activo: boolean): Promise<void> {
  return request<void>(`/administradores/${segmento(id)}`, { activo }, { method: 'PATCH' });
}
