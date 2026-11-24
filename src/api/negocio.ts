/**
 * Datos de la barbería, horario de atención, días especiales y políticas (módulo `negocio`).
 *
 * Endpoints (Admin, salvo indicación):
 * - GET  /negocio -> DatosNegocio
 * - PUT  /negocio { nombre_comercial, nit, direccion, zona_referencia, whatsapp, instagram,
 *   porcentaje_comision_defecto } -> DatosNegocio | 422 validacion.
 *   `nombre_comercial` es el `{{2}}` de los WhatsApp de citas desde el siguiente envío.
 * - GET  /negocio/horario-atencion (Personal) -> HorarioDia[] (calculado de los horarios del equipo)
 * - GET  /negocio/dias-especiales?desde&hasta (Personal) -> DiaEspecial[]
 * - POST /negocio/dias-especiales { fecha, nombre, tipo, hora_cierre } -> 201 DiaEspecial
 *   | 409 fecha_ocupada (ya hay uno ese día) | 422 validacion (`hora_cierre` solo en `cierre_temprano`)
 * - PUT  /negocio/dias-especiales/{id} { … } -> DiaEspecial | 404 | 409 fecha_ocupada
 * - DELETE /negocio/dias-especiales/{id} -> 204 | 404
 * - POST /negocio/dias-especiales/festivos/{anio} -> { anio, creados, omitidos } (idempotente)
 * - GET  /negocio/politicas -> Politica[] (todas las versiones)
 * - POST /negocio/politicas { tipo, version, url, vigente_desde } -> 201 Politica | 422 validacion
 */

import { conParametros, request, segmento } from './client';
import type {
  ActualizarNegocioDto,
  DatosNegocio,
  DiaEspecial,
  DiaEspecialDto,
  Fecha,
  FestivosPrecargados,
  HorarioDia,
  Politica,
  PublicarPoliticaDto,
} from './tipos';

export function getNegocio(signal?: AbortSignal): Promise<DatosNegocio> {
  return request<DatosNegocio>('/negocio', undefined, { signal });
}

export function actualizarNegocio(datos: ActualizarNegocioDto): Promise<DatosNegocio> {
  return request<DatosNegocio>('/negocio', datos, { method: 'PUT' });
}

export function getHorarioAtencion(signal?: AbortSignal): Promise<HorarioDia[]> {
  return request<HorarioDia[]>('/negocio/horario-atencion', undefined, { signal });
}

export function listarDiasEspeciales(
  rango: { desde?: Fecha; hasta?: Fecha } = {},
  signal?: AbortSignal,
): Promise<DiaEspecial[]> {
  return request<DiaEspecial[]>(conParametros('/negocio/dias-especiales', { ...rango }), undefined, { signal });
}

export function crearDiaEspecial(dia: DiaEspecialDto): Promise<DiaEspecial> {
  return request<DiaEspecial>('/negocio/dias-especiales', dia);
}

export function editarDiaEspecial(id: number, dia: DiaEspecialDto): Promise<DiaEspecial> {
  return request<DiaEspecial>(`/negocio/dias-especiales/${segmento(id)}`, dia, { method: 'PUT' });
}

export function eliminarDiaEspecial(id: number): Promise<void> {
  return request<void>(`/negocio/dias-especiales/${segmento(id)}`, undefined, { method: 'DELETE' });
}

/** Carga los festivos de Colombia del año; los que ya existen se omiten. */
export function precargarFestivos(anio: number): Promise<FestivosPrecargados> {
  return request<FestivosPrecargados>(`/negocio/dias-especiales/festivos/${segmento(anio)}`, {});
}

export function listarPoliticas(signal?: AbortSignal): Promise<Politica[]> {
  return request<Politica[]>('/negocio/politicas', undefined, { signal });
}

export function publicarPolitica(politica: PublicarPoliticaDto): Promise<Politica> {
  return request<Politica>('/negocio/politicas', politica);
}
