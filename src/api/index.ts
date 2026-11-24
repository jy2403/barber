/**
 * Puerta de entrada a la API: importe desde aquí en pantallas, hooks y contextos.
 *
 *   import { iniciarSesion, getTablero, registrarVenta, type Cita } from '@/api';
 *
 * Cada módulo del backend vive en su archivo (auth, administradores, negocio,
 * catalogo, barberos, clientes, publico, agenda, ventas, reportes,
 * notificaciones, auditoria, sistema) con la lista de sus endpoints arriba; las
 * entidades están en `./tipos`. Este índice solo los reexporta.
 */

export {
  ApiError,
  conParametros,
  descargar,
  enviarFormulario,
  esErrorApi,
  getBaseUrl,
  request,
  segmento,
  urlDelServidor,
} from './client';
export type { CodigoError, Descarga, ErrorDeCampo, HttpMethod, RequestOptions } from './client';

export * from './tipos';

export {
  activarCuenta,
  cambiarContrasena,
  cerrarSesion,
  confirmarRecuperacion,
  consultarSesion,
  iniciarSesion,
  pedirRecuperacion,
  tokenDelEnlace,
} from './auth';

export { cambiarEstadoAdministrador, invitarAdministrador, listarAdministradores } from './administradores';

export {
  actualizarNegocio,
  crearDiaEspecial,
  editarDiaEspecial,
  eliminarDiaEspecial,
  getHorarioAtencion,
  getNegocio,
  listarDiasEspeciales,
  listarPoliticas,
  precargarFestivos,
  publicarPolitica,
} from './negocio';

export {
  cambiarComponentes,
  cambiarEstadoServicio,
  crearServicio,
  editarServicio,
  getServicio,
  listarCategorias,
  listarServicios,
} from './catalogo';

export {
  anularAusencia,
  cambiarHorario,
  cambiarServiciosDeBarbero,
  cambiarVisibilidad,
  cargarDocumento,
  crearBloqueo,
  editarBarbero,
  eliminarBloqueo,
  getBarbero,
  getDatosPrivados,
  getExpediente,
  getHorario,
  getMiPerfil,
  getServiciosDeBarbero,
  guardarDatosPrivados,
  listarAusencias,
  listarBarberos,
  listarBloqueos,
  ordenarBarberos,
  quitarDocumento,
  registrarAusencia,
  registrarBarbero,
  retirarBarbero,
  subirFoto,
  subirSoporteAusencia,
  urlDescargaDocumento,
} from './barberos';

export {
  anonimizarCliente,
  buscarClientes,
  crearCliente,
  editarCliente,
  getCliente,
  getConfiguracionSegmentos,
  guardarConfiguracionSegmentos,
  listarClientes,
  listarSolicitudesTitular,
  registrarSolicitudTitular,
  responderSolicitudTitular,
} from './clientes';

export {
  cambiarRecordatorios,
  cancelarPorEnlace,
  confirmarCodigo,
  getBarberosParaServicio,
  getCalendario,
  getGestion,
  getHorasLibres,
  getLanding,
  getServiciosPublicos,
  pedirCodigo,
  reprogramarPorEnlace,
  reservar,
  tokenDeEnlaceGestion,
} from './publico';

export {
  buscarConflictos,
  cancelarCita,
  confirmarCita,
  crearCita,
  enviarRecordatorio,
  getCita,
  getConfiguracionAgenda,
  getHorasPanel,
  getPendientesDeCierre,
  getResumenAgendaBarbero,
  getTablero,
  guardarConfiguracionAgenda,
  iniciarCita,
  listarCitas,
  marcarInasistencia,
  pedirReprogramacion,
  reasignarCitas,
  reprogramarCita,
} from './agenda';

export {
  anularVenta,
  cambiarEstadoMetodoPago,
  cerrarCaja,
  getCaja,
  getCatalogosVenta,
  getCierre,
  getResumenVentasBarbero,
  getVenta,
  listarMetodosPago,
  listarVentas,
  registrarVenta,
} from './ventas';

export {
  descargarBarberoPdf,
  descargarBarberosPdf,
  descargarClientesPdf,
  descargarResumenPdf,
  getAlertas,
  getDashboard,
  getReporteBarbero,
  getReporteClientes,
  getResumenVentas,
  getTendencias,
} from './reportes';

export { listarAvisos, listarMensajes, marcarAvisoLeido } from './notificaciones';

export { listarAuditoria } from './auditoria';

export { getEstadoSistema } from './sistema';
