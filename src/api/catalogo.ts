/**
 * Categorías, servicios y combos (módulo `catalogo`).
 *
 * Endpoints:
 * - GET   /categorias (Personal) -> Categoria[]
 * - GET   /servicios?incluir_inactivos=true (Personal) -> Servicio[]
 * - GET   /servicios/{id} (Personal) -> Servicio | 404
 * - POST  /servicios (Admin) -> 201 Servicio | 409 nombre_en_uso | 422 validacion
 *   Un combo lleva `tipo: 'combo'` y `componentes` (mínimo dos servicios simples).
 * - PUT   /servicios/{id} (Admin) -> Servicio. Un cambio de precio solo afecta citas y ventas nuevas.
 * - PATCH /servicios/{id}/estado { activo } (Admin) -> Servicio
 * - PUT   /servicios/{id}/componentes { servicio_ids } (Admin) -> Servicio | 409 no_es_combo
 *
 * Lo que ve el sitio público está en `./publico` (`getServiciosPublicos`).
 */

import { conParametros, request, segmento } from './client';
import type { Categoria, Servicio, ServicioDto } from './tipos';

export function listarCategorias(signal?: AbortSignal): Promise<Categoria[]> {
  return request<Categoria[]>('/categorias', undefined, { signal });
}

export function listarServicios(
  opciones: { incluirInactivos?: boolean } = {},
  signal?: AbortSignal,
): Promise<Servicio[]> {
  const path = conParametros('/servicios', { incluir_inactivos: opciones.incluirInactivos ? true : undefined });
  return request<Servicio[]>(path, undefined, { signal });
}

export function getServicio(id: number, signal?: AbortSignal): Promise<Servicio> {
  return request<Servicio>(`/servicios/${segmento(id)}`, undefined, { signal });
}

export function crearServicio(servicio: ServicioDto): Promise<Servicio> {
  return request<Servicio>('/servicios', servicio);
}

export function editarServicio(id: number, servicio: ServicioDto): Promise<Servicio> {
  return request<Servicio>(`/servicios/${segmento(id)}`, servicio, { method: 'PUT' });
}

export function cambiarEstadoServicio(id: number, activo: boolean): Promise<Servicio> {
  return request<Servicio>(`/servicios/${segmento(id)}/estado`, { activo }, { method: 'PATCH' });
}

export function cambiarComponentes(id: number, servicioIds: number[]): Promise<Servicio> {
  return request<Servicio>(`/servicios/${segmento(id)}/componentes`, { servicio_ids: servicioIds }, { method: 'PUT' });
}
