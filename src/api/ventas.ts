/**
 * Ventas, caja y cierre del día (módulo `ventas`).
 *
 * El servidor recalcula todos los valores (subtotal, descuento, comisión) con
 * los precios vigentes: los que muestre la pantalla son solo una vista previa.
 *
 * Endpoints:
 * - GET   /ventas/catalogos (Admin; Barbero) -> CatalogosVenta (el barbero solo ve los
 *   descuentos permitidos a barberos)
 * - POST  /ventas (Admin; Barbero propio) -> 201 Venta. Con `cita_id`, la cita queda «Atendida»
 *   | 409 cita_ya_cobrada | 409 estado_invalido (cita cancelada o futura) | 409 celular_en_uso
 *   | 422 validacion (los pagos no suman el total, el barbero no hace ese servicio…)
 * - GET   /ventas?fecha&desde&hasta&barbero_id&cliente_id&incluir_anuladas&pagina&por_pagina
 *   (Admin; Barbero propio) -> Pagina<Venta> (sin fechas: las de hoy)
 * - GET   /ventas/{id} (Admin; Barbero propio) -> Venta
 * - POST  /ventas/{id}/anulacion { motivo } (Admin) -> Venta. Si era de una cita, la cita vuelve a
 *   «Confirmada» y se puede volver a cobrar | 409 estado_invalido (ya anulada)
 * - GET   /ventas/caja?fecha&barbero_id (Admin) -> Caja (del día; filtrable por barbero)
 * - GET   /ventas/resumen-barbero?fecha&barbero_id (Barbero: el suyo; Admin con `barbero_id`)
 *   -> ResumenVentasBarbero («Lo que llevas hoy»)
 * - GET   /ventas/cierres?fecha (Admin) -> CierreCaja | 404 (aún no se cierra)
 * - POST  /ventas/cierres { fecha, contado, observacion } (Admin) -> 201 CierreCaja
 *   | 409 cierre_existente (uno por día)
 * - GET   /ventas/metodos-pago (Admin) -> MetodoPago[] (activos o no)
 * - PATCH /ventas/metodos-pago/{id} { activo } (Admin) -> MetodoPago
 *   | 409 estado_invalido (debe quedar al menos uno activo)
 */

import { conParametros, esErrorApi, request, segmento } from './client';
import type {
  Caja,
  CatalogosVenta,
  CierreCaja,
  CierreDto,
  ConsultaVentas,
  Fecha,
  MetodoPago,
  Pagina,
  ResumenVentasBarbero,
  Venta,
  VentaDto,
} from './tipos';

export function getCatalogosVenta(signal?: AbortSignal): Promise<CatalogosVenta> {
  return request<CatalogosVenta>('/ventas/catalogos', undefined, { signal });
}

export function registrarVenta(venta: VentaDto): Promise<Venta> {
  return request<Venta>('/ventas', venta);
}

export function listarVentas(consulta: ConsultaVentas = {}, signal?: AbortSignal): Promise<Pagina<Venta>> {
  const path = conParametros('/ventas', {
    ...consulta,
    incluir_anuladas: consulta.incluir_anuladas ? true : undefined,
  });
  return request<Pagina<Venta>>(path, undefined, { signal });
}

export function getVenta(id: number, signal?: AbortSignal): Promise<Venta> {
  return request<Venta>(`/ventas/${segmento(id)}`, undefined, { signal });
}

export function anularVenta(id: number, motivo: string): Promise<Venta> {
  return request<Venta>(`/ventas/${segmento(id)}/anulacion`, { motivo });
}

export function getCaja(consulta: { fecha?: Fecha; barbero_id?: number } = {}, signal?: AbortSignal): Promise<Caja> {
  return request<Caja>(conParametros('/ventas/caja', { ...consulta }), undefined, { signal });
}

/** «Lo que llevas hoy». El barbero siempre recibe el suyo; el admin debe indicar `barbero_id`. */
export function getResumenVentasBarbero(
  consulta: { fecha?: Fecha; barbero_id?: number } = {},
  signal?: AbortSignal,
): Promise<ResumenVentasBarbero> {
  return request<ResumenVentasBarbero>(conParametros('/ventas/resumen-barbero', { ...consulta }), undefined, {
    signal,
  });
}

/** El cierre del día, o `null` si aún no se ha cerrado. */
export async function getCierre(fecha: Fecha, signal?: AbortSignal): Promise<CierreCaja | null> {
  try {
    return await request<CierreCaja>(conParametros('/ventas/cierres', { fecha }), undefined, { signal });
  } catch (error) {
    if (esErrorApi(error, 'no_encontrado')) return null;
    throw error;
  }
}

export function cerrarCaja(cierre: CierreDto): Promise<CierreCaja> {
  return request<CierreCaja>('/ventas/cierres', cierre);
}

export function listarMetodosPago(signal?: AbortSignal): Promise<MetodoPago[]> {
  return request<MetodoPago[]>('/ventas/metodos-pago', undefined, { signal });
}

export function cambiarEstadoMetodoPago(id: number, activo: boolean): Promise<MetodoPago> {
  return request<MetodoPago>(`/ventas/metodos-pago/${segmento(id)}`, { activo }, { method: 'PATCH' });
}
