/**
 * Reportes y dashboard (módulo `reportes`, solo lectura).
 *
 * Periodo: `{ mes: 'AAAA-MM' }` o `{ desde, hasta }`; sin nada, el mes en curso
 * hasta hoy. Un mes futuro, un rango que termina después de hoy, al revés o de
 * más de un año responden `422 validacion` con el campo. Tiempo máximo: 120 s.
 *
 * Endpoints (Admin, salvo indicación):
 * - GET /reportes/dashboard?fecha -> Dashboard (hoy hasta la hora actual, frente al mismo día
 *   de la semana anterior a la misma hora)
 * - GET /reportes/tendencias?mes|desde&hasta -> Tendencias
 * - GET /reportes/alertas -> Alertas
 * - GET /reportes/resumen?periodo -> ResumenVentas
 * - GET /reportes/resumen.pdf?periodo -> PDF
 * - GET /reportes/clientes?periodo -> ReporteClientes
 * - GET /reportes/clientes.pdf?periodo -> PDF
 * - GET /reportes/barberos.pdf?periodo -> PDF (todos, uno por página)
 * - GET /reportes/barberos/{id}?periodo (Admin; Barbero propio, el de otro `404`) -> ReporteBarbero
 * - GET /reportes/barberos/{id}.pdf?periodo (Admin; Barbero propio) -> PDF
 *
 * Los PDF llegan como adjunto (`resumen-2026-11.pdf`), quedan en la auditoría y,
 * si el generador (Gotenberg) no responde, `503 pdf_no_disponible`.
 */

import { conParametros, descargar, request, segmento } from './client';
import type { Descarga } from './client';
import type {
  Alertas,
  Dashboard,
  Fecha,
  PeriodoReporte,
  ReporteBarbero,
  ReporteClientes,
  ResumenVentas,
  Tendencias,
} from './tipos';

const conPeriodo = (path: string, periodo: PeriodoReporte) =>
  conParametros(path, { mes: periodo.mes, desde: periodo.desde, hasta: periodo.hasta });

export function getDashboard(fecha?: Fecha, signal?: AbortSignal): Promise<Dashboard> {
  return request<Dashboard>(conParametros('/reportes/dashboard', { fecha }), undefined, { signal });
}

export function getTendencias(periodo: PeriodoReporte = {}, signal?: AbortSignal): Promise<Tendencias> {
  return request<Tendencias>(conPeriodo('/reportes/tendencias', periodo), undefined, { signal });
}

export function getAlertas(signal?: AbortSignal): Promise<Alertas> {
  return request<Alertas>('/reportes/alertas', undefined, { signal });
}

export function getResumenVentas(periodo: PeriodoReporte = {}, signal?: AbortSignal): Promise<ResumenVentas> {
  return request<ResumenVentas>(conPeriodo('/reportes/resumen', periodo), undefined, { signal });
}

export function getReporteClientes(periodo: PeriodoReporte = {}, signal?: AbortSignal): Promise<ReporteClientes> {
  return request<ReporteClientes>(conPeriodo('/reportes/clientes', periodo), undefined, { signal });
}

export function getReporteBarbero(
  barberoId: number,
  periodo: PeriodoReporte = {},
  signal?: AbortSignal,
): Promise<ReporteBarbero> {
  return request<ReporteBarbero>(conPeriodo(`/reportes/barberos/${segmento(barberoId)}`, periodo), undefined, {
    signal,
  });
}

// --- PDF -------------------------------------------------------------------------

export function descargarResumenPdf(periodo: PeriodoReporte = {}): Promise<Descarga> {
  return descargar(conPeriodo('/reportes/resumen.pdf', periodo));
}

export function descargarClientesPdf(periodo: PeriodoReporte = {}): Promise<Descarga> {
  return descargar(conPeriodo('/reportes/clientes.pdf', periodo));
}

export function descargarBarberosPdf(periodo: PeriodoReporte = {}): Promise<Descarga> {
  return descargar(conPeriodo('/reportes/barberos.pdf', periodo));
}

export function descargarBarberoPdf(barberoId: number, periodo: PeriodoReporte = {}): Promise<Descarga> {
  return descargar(conPeriodo(`/reportes/barberos/${segmento(barberoId)}.pdf`, periodo));
}
