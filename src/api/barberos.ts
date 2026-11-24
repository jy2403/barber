/**
 * Equipo de barberos (módulo `barberos`).
 *
 * «Barbero (propio)»: el barbero solo puede usarlo sobre sus datos; pedir los de
 * otro responde `404` (no revela que existe).
 *
 * Endpoints:
 * - GET  /yo (Barbero) -> Barbero (su propio perfil, solo lectura)
 * - GET  /barberos?q&estado (Admin) -> { datos: Barbero[], meta: IndicadoresEquipo }
 * - POST /barberos (Admin) -> 201 Barbero. Datos, servicios, horario y visibilidad juntos;
 *   crea la cuenta y, con `acceso_panel`, envía la invitación al correo
 *   | 409 documento_en_uso | 409 correo_en_uso | 422 validacion
 * - PUT  /barberos/orden { barbero_ids } (Admin) -> 204 (orden en la landing)
 * - GET  /barberos/{id} (Admin) -> Barbero (con `horario`)
 * - PUT  /barberos/{id} (Admin) -> Barbero (solo los datos esenciales) | 409 barbero_retirado
 * - PUT  /barberos/{id}/visibilidad { mostrar_en_landing, recibe_citas_en_linea, acceso_panel } (Admin) -> Barbero
 * - POST /barberos/{id}/retiro { fecha, motivo } (Admin) -> Barbero. Cierra sus sesiones;
 *   sus citas desde esa fecha generan un aviso para reasignarlas
 * - GET  /barberos/{id}/horario (Admin; Barbero propio) -> Horario
 * - PUT  /barberos/{id}/horario { franjas } (Admin; Barbero propio) -> Horario. Reemplaza el
 *   horario completo; si deja citas por fuera, crea un aviso (vea `buscarConflictos` antes)
 * - GET  /barberos/{id}/servicios (Admin; Barbero propio) -> Nombrado[]
 * - PUT  /barberos/{id}/servicios { servicio_ids } (Admin; Barbero propio) -> Nombrado[]
 * - GET  /barberos/{id}/datos-privados (Admin) -> DatosPrivados (cifrados en la base)
 * - PUT  /barberos/{id}/datos-privados (Admin) -> DatosPrivados
 * - POST /barberos/{id}/foto multipart `foto` (Admin) -> { foto_url }. JPG, PNG o WebP de hasta 5 MB
 * - GET  /barberos/{id}/documentos (Admin) -> Expediente
 * - POST /barberos/{id}/documentos multipart `archivo`, `tipo`, `periodo` (AAAA-MM, solo
 *   `planilla_pila`) (Admin) -> 201 Documento | 409 planilla_repetida | 413 archivo_demasiado_grande
 * - DELETE /barberos/{id}/documentos/{documento} (Admin) -> 204
 * - GET  /barberos/{id}/documentos/{documento}/descarga (Admin) -> redirige a una URL firmada de 5 min
 * - GET  /barberos/{id}/ausencias (Admin) -> Ausencia[]
 * - POST /barberos/{id}/ausencias { tipo, desde, hasta, observacion } (Admin) -> 201 Ausencia
 *   | 409 ausencia_solapada | 422 validacion
 * - POST /barberos/{id}/ausencias/{ausencia}/anular (Admin) -> Ausencia
 * - POST /barberos/{id}/ausencias/{ausencia}/soporte multipart `soporte` (Admin) -> Ausencia
 * - GET  /barberos/{id}/bloqueos?desde (Admin; Barbero propio) -> Bloqueo[]
 * - POST /barberos/{id}/bloqueos { fecha, desde, hasta, motivo, nota } (Admin; Barbero propio)
 *   -> 201 Bloqueo | 409 bloqueo_solapado
 * - DELETE /barberos/{id}/bloqueos/{bloqueo} (Admin; Barbero propio) -> 204
 */

import { conParametros, enviarFormulario, request, segmento, urlDelServidor } from './client';
import type {
  Ausencia,
  AusenciaDto,
  Barbero,
  Bloqueo,
  BloqueoDto,
  DatosBarberoDto,
  DatosPrivados,
  DatosPrivadosDto,
  Documento,
  EstadoBarbero,
  Expediente,
  Fecha,
  Foto,
  FranjaDto,
  Horario,
  ListadoBarberos,
  Nombrado,
  RegistrarBarberoDto,
  RetiroDto,
  TipoAdjunto,
  VisibilidadBarbero,
} from './tipos';

const base = (id: number) => `/barberos/${segmento(id)}`;

export function getMiPerfil(signal?: AbortSignal): Promise<Barbero> {
  return request<Barbero>('/yo', undefined, { signal });
}

export function listarBarberos(
  filtro: { q?: string; estado?: EstadoBarbero } = {},
  signal?: AbortSignal,
): Promise<ListadoBarberos> {
  return request<ListadoBarberos>(conParametros('/barberos', { ...filtro }), undefined, { signal });
}

export function registrarBarbero(datos: RegistrarBarberoDto): Promise<Barbero> {
  return request<Barbero>('/barberos', datos);
}

export function ordenarBarberos(barberoIds: number[]): Promise<void> {
  return request<void>('/barberos/orden', { barbero_ids: barberoIds }, { method: 'PUT' });
}

export function getBarbero(id: number, signal?: AbortSignal): Promise<Barbero> {
  return request<Barbero>(base(id), undefined, { signal });
}

export function editarBarbero(id: number, datos: DatosBarberoDto): Promise<Barbero> {
  return request<Barbero>(base(id), datos, { method: 'PUT' });
}

export function cambiarVisibilidad(id: number, visibilidad: VisibilidadBarbero): Promise<Barbero> {
  return request<Barbero>(`${base(id)}/visibilidad`, visibilidad, { method: 'PUT' });
}

export function retirarBarbero(id: number, retiro: RetiroDto): Promise<Barbero> {
  return request<Barbero>(`${base(id)}/retiro`, retiro);
}

// --- Horario y servicios -----------------------------------------------------

export function getHorario(id: number, signal?: AbortSignal): Promise<Horario> {
  return request<Horario>(`${base(id)}/horario`, undefined, { signal });
}

export function cambiarHorario(id: number, franjas: FranjaDto[]): Promise<Horario> {
  return request<Horario>(`${base(id)}/horario`, { franjas }, { method: 'PUT' });
}

export function getServiciosDeBarbero(id: number, signal?: AbortSignal): Promise<Nombrado[]> {
  return request<Nombrado[]>(`${base(id)}/servicios`, undefined, { signal });
}

export function cambiarServiciosDeBarbero(id: number, servicioIds: number[]): Promise<Nombrado[]> {
  return request<Nombrado[]>(`${base(id)}/servicios`, { servicio_ids: servicioIds }, { method: 'PUT' });
}

// --- Datos privados, foto y expediente ----------------------------------------

export function getDatosPrivados(id: number, signal?: AbortSignal): Promise<DatosPrivados> {
  return request<DatosPrivados>(`${base(id)}/datos-privados`, undefined, { signal });
}

export function guardarDatosPrivados(id: number, datos: DatosPrivadosDto): Promise<DatosPrivados> {
  return request<DatosPrivados>(`${base(id)}/datos-privados`, datos, { method: 'PUT' });
}

export function subirFoto(id: number, foto: Blob): Promise<Foto> {
  const formulario = new FormData();
  formulario.append('foto', foto);
  return enviarFormulario<Foto>(`${base(id)}/foto`, formulario);
}

export function getExpediente(id: number, signal?: AbortSignal): Promise<Expediente> {
  return request<Expediente>(`${base(id)}/documentos`, undefined, { signal });
}

/** `periodo` (AAAA-MM) solo para la planilla PILA. */
export function cargarDocumento(
  id: number,
  documento: { tipo: TipoAdjunto; archivo: Blob; periodo?: string },
): Promise<Documento> {
  const formulario = new FormData();
  formulario.append('tipo', documento.tipo);
  if (documento.periodo) formulario.append('periodo', documento.periodo);
  formulario.append('archivo', documento.archivo);
  return enviarFormulario<Documento>(`${base(id)}/documentos`, formulario);
}

export function quitarDocumento(id: number, documentoId: number): Promise<void> {
  return request<void>(`${base(id)}/documentos/${segmento(documentoId)}`, undefined, { method: 'DELETE' });
}

/**
 * URL para descargar un documento (ábrala en una pestaña o en un `<a>`): con la
 * sesión, el servidor redirige a una URL firmada de 5 minutos.
 */
export function urlDescargaDocumento(id: number, documentoId: number): string {
  return urlDelServidor(`/api/v1${base(id)}/documentos/${segmento(documentoId)}/descarga`);
}

// --- Ausencias ------------------------------------------------------------------

export function listarAusencias(id: number, signal?: AbortSignal): Promise<Ausencia[]> {
  return request<Ausencia[]>(`${base(id)}/ausencias`, undefined, { signal });
}

export function registrarAusencia(id: number, ausencia: AusenciaDto): Promise<Ausencia> {
  return request<Ausencia>(`${base(id)}/ausencias`, ausencia);
}

export function anularAusencia(id: number, ausenciaId: number): Promise<Ausencia> {
  return request<Ausencia>(`${base(id)}/ausencias/${segmento(ausenciaId)}/anular`, {});
}

export function subirSoporteAusencia(id: number, ausenciaId: number, soporte: Blob): Promise<Ausencia> {
  const formulario = new FormData();
  formulario.append('soporte', soporte);
  return enviarFormulario<Ausencia>(`${base(id)}/ausencias/${segmento(ausenciaId)}/soporte`, formulario);
}

// --- Bloqueos ---------------------------------------------------------------------

export function listarBloqueos(id: number, desde?: Fecha, signal?: AbortSignal): Promise<Bloqueo[]> {
  return request<Bloqueo[]>(conParametros(`${base(id)}/bloqueos`, { desde }), undefined, { signal });
}

export function crearBloqueo(id: number, bloqueo: BloqueoDto): Promise<Bloqueo> {
  return request<Bloqueo>(`${base(id)}/bloqueos`, bloqueo);
}

export function eliminarBloqueo(id: number, bloqueoId: number): Promise<void> {
  return request<void>(`${base(id)}/bloqueos/${segmento(bloqueoId)}`, undefined, { method: 'DELETE' });
}
