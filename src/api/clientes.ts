/**
 * Clientes y solicitudes de habeas data (módulo `clientes`).
 *
 * Endpoints:
 * - GET   /clientes?q&segmento&pagina&por_pagina (Admin) -> Pagina<ClienteResumen> + `meta`
 *   (indicadores de toda la base, sin importar los filtros)
 * - GET   /clientes/buscar?q (Admin; Barbero) -> ClienteRapido[] (máximo 8; para agenda y venta)
 * - POST  /clientes { nombre, celular, correo, … } (Admin; Barbero) -> 201 ClienteFicha
 *   | 409 celular_en_uso | 422 validacion
 * - GET   /clientes/{id} (Admin) -> ClienteFicha. Sus visitas: `listarVentas({ cliente_id })`
 * - PUT   /clientes/{id} (Admin) -> ClienteFicha | 409 celular_en_uso
 * - POST  /clientes/{id}/anonimizacion { motivo } (Admin) -> 204. Borra los datos personales y
 *   conserva las cifras | 409 estado_invalido (tiene citas por atender)
 * - GET   /clientes/configuracion-segmentos (Admin) -> ConfiguracionSegmentos
 * - PUT   /clientes/configuracion-segmentos (Admin) -> ConfiguracionSegmentos (aplica al instante)
 * - GET   /clientes/solicitudes-titular?abiertas&pagina&por_pagina (Admin) -> Pagina<SolicitudTitular>
 * - POST  /clientes/solicitudes-titular { cliente_id, tipo, descripcion } (Admin) -> 201 SolicitudTitular
 * - PATCH /clientes/solicitudes-titular/{id} { respuesta } (Admin) -> SolicitudTitular
 *   | 409 estado_invalido (ya respondida: solo una vez)
 */

import { conParametros, request, segmento } from './client';
import type {
  ClienteDto,
  ClienteFicha,
  ClienteRapido,
  ConfiguracionSegmentos,
  ConsultaClientes,
  ConsultaPagina,
  ListadoClientes,
  Pagina,
  SolicitudTitular,
  SolicitudTitularDto,
} from './tipos';

export function listarClientes(consulta: ConsultaClientes = {}, signal?: AbortSignal): Promise<ListadoClientes> {
  return request<ListadoClientes>(conParametros('/clientes', { ...consulta }), undefined, { signal });
}

/** Búsqueda rápida por nombre o celular. Pase `signal` para cancelar la anterior al teclear. */
export function buscarClientes(q: string, signal?: AbortSignal): Promise<ClienteRapido[]> {
  return request<ClienteRapido[]>(conParametros('/clientes/buscar', { q }), undefined, { signal });
}

export function crearCliente(cliente: ClienteDto): Promise<ClienteFicha> {
  return request<ClienteFicha>('/clientes', cliente);
}

export function getCliente(id: number, signal?: AbortSignal): Promise<ClienteFicha> {
  return request<ClienteFicha>(`/clientes/${segmento(id)}`, undefined, { signal });
}

export function editarCliente(id: number, cliente: ClienteDto): Promise<ClienteFicha> {
  return request<ClienteFicha>(`/clientes/${segmento(id)}`, cliente, { method: 'PUT' });
}

/** Supresión por solicitud del titular. No se puede deshacer. */
export function anonimizarCliente(id: number, motivo: string): Promise<void> {
  return request<void>(`/clientes/${segmento(id)}/anonimizacion`, { motivo });
}

export function getConfiguracionSegmentos(signal?: AbortSignal): Promise<ConfiguracionSegmentos> {
  return request<ConfiguracionSegmentos>('/clientes/configuracion-segmentos', undefined, { signal });
}

export function guardarConfiguracionSegmentos(config: ConfiguracionSegmentos): Promise<ConfiguracionSegmentos> {
  return request<ConfiguracionSegmentos>('/clientes/configuracion-segmentos', config, { method: 'PUT' });
}

export function listarSolicitudesTitular(
  consulta: ConsultaPagina & { abiertas?: boolean } = {},
  signal?: AbortSignal,
): Promise<Pagina<SolicitudTitular>> {
  const path = conParametros('/clientes/solicitudes-titular', {
    ...consulta,
    abiertas: consulta.abiertas ? true : undefined,
  });
  return request<Pagina<SolicitudTitular>>(path, undefined, { signal });
}

export function registrarSolicitudTitular(solicitud: SolicitudTitularDto): Promise<SolicitudTitular> {
  return request<SolicitudTitular>('/clientes/solicitudes-titular', solicitud);
}

export function responderSolicitudTitular(id: number, respuesta: string): Promise<SolicitudTitular> {
  return request<SolicitudTitular>(`/clientes/solicitudes-titular/${segmento(id)}`, { respuesta }, { method: 'PATCH' });
}
