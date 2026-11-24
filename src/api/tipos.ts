/**
 * Entidades de la API: la forma EXACTA del JSON que envía y recibe el backend.
 *
 * Convenciones (las mismas del backend, `docs/diseno/api.md` §1):
 * - Campos en snake_case, como viajan. No hay conversores: lo que llega es lo que se usa.
 * - Dinero en pesos enteros (`35000`), nunca decimales.
 * - Fechas `AAAA-MM-DD` (hora de Bogotá); instantes ISO 8601 con zona
 *   (`2026-11-19T15:30:00-05:00`); horas `HH:MM:SS` al leer y `HH:MM` al escribir.
 * - Identificadores numéricos. Los enlaces públicos usan tokens opacos.
 * - `null` = el servidor lo manda vacío; `?` = el campo puede no venir (o no enviarse).
 */

// ---------------------------------------------------------------------------
// Básicos
// ---------------------------------------------------------------------------

/** Fecha sin hora: `2026-11-19`. */
export type Fecha = string;
/** Instante con zona: `2026-11-19T15:30:00-05:00` (o en UTC con `Z`). */
export type Instante = string;
/** Hora del día: el servidor responde `15:30:00` y acepta `15:30`. */
export type Hora = string;
/** Mes: `2026-11`. */
export type Mes = string;
/** Pesos colombianos, enteros. */
export type Pesos = number;
/** Porcentaje como número: `50` o `12.5`. */
export type Porcentaje = number;

/** Una página de resultados. `por_pagina` va de 1 a 100. */
export interface Pagina<T> {
  datos: T[];
  pagina: number;
  por_pagina: number;
  total: number;
}

/** Parámetros de paginación (`?pagina=1&por_pagina=20`). */
export interface ConsultaPagina {
  pagina?: number;
  por_pagina?: number;
}

/** Un nombre con su id (barbero o cliente de una venta). */
export interface Nombrado {
  id: number;
  nombre: string;
}

// ---------------------------------------------------------------------------
// Identidad: sesión y administradores
// ---------------------------------------------------------------------------

export const ROLES = ['administrador', 'barbero'] as const;
export type Rol = (typeof ROLES)[number];

export interface UsuarioSesion {
  id: number;
  rol: Rol;
  nombre: string;
  correo: string;
}

/** Respuesta de `POST /auth/sesion` y `GET /auth/sesion`. `panel`: `/admin` o `/barbero`. */
export interface Sesion {
  usuario: UsuarioSesion;
  panel: string;
}

export interface CredencialesDto {
  correo: string;
  contrasena: string;
  /** Sesión de 30 días en vez de 12 horas de inactividad. */
  recordarme?: boolean;
}

export interface Administrador {
  id: number;
  correo: string;
  nombre: string;
  activo: boolean;
  /** Invitado que aún no ha creado su contraseña. */
  pendiente_activacion: boolean;
  ultimo_acceso_en: Instante | null;
}

export interface InvitarAdministradorDto {
  correo: string;
  nombre: string;
}

// ---------------------------------------------------------------------------
// Negocio
// ---------------------------------------------------------------------------

export interface DatosNegocio {
  nombre_comercial: string;
  nit: string | null;
  direccion: string | null;
  zona_referencia: string | null;
  whatsapp: string | null;
  instagram: string | null;
  porcentaje_comision_defecto: Porcentaje;
}

export type ActualizarNegocioDto = Omit<DatosNegocio, 'nit' | 'direccion' | 'zona_referencia' | 'whatsapp' | 'instagram'> &
  Partial<Pick<DatosNegocio, 'nit' | 'direccion' | 'zona_referencia' | 'whatsapp' | 'instagram'>>;

/** Lo que muestra la landing del negocio. */
export interface NegocioPublico {
  nombre_comercial: string;
  direccion: string | null;
  zona_referencia: string | null;
  whatsapp: string | null;
  instagram: string | null;
}

/** Un día de la semana del horario de atención. `dia_semana`: 1 = lunes … 7 = domingo. */
export interface HorarioDia {
  dia_semana: number;
  nombre: string;
  abierto: boolean;
  abre: Hora | null;
  cierra: Hora | null;
}

export const TIPOS_DIA_ESPECIAL = ['festivo', 'cerrado', 'cierre_temprano'] as const;
export type TipoDiaEspecial = (typeof TIPOS_DIA_ESPECIAL)[number];

export interface DiaEspecial {
  id: number;
  fecha: Fecha;
  nombre: string;
  tipo: TipoDiaEspecial;
  /** Solo en `cierre_temprano`. */
  hora_cierre: Hora | null;
  /** Precargado como festivo de Colombia. */
  automatico: boolean;
}

export interface DiaEspecialDto {
  fecha: Fecha;
  nombre: string;
  tipo: TipoDiaEspecial;
  hora_cierre?: Hora | null;
}

export interface FestivosPrecargados {
  anio: number;
  creados: number;
  omitidos: number;
}

export const TIPOS_POLITICA = ['tratamiento_datos', 'cancelacion', 'terminos'] as const;
export type TipoPolitica = (typeof TIPOS_POLITICA)[number];

export interface Politica {
  id: number;
  tipo: TipoPolitica;
  version: string;
  url: string;
  vigente_desde: Instante;
  vigente: boolean;
}

export interface PublicarPoliticaDto {
  tipo: TipoPolitica;
  version: string;
  url: string;
  /** Por defecto, ahora. */
  vigente_desde?: Instante;
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export interface Categoria {
  id: number;
  nombre: string;
  orden: number;
}

export const TIPOS_SERVICIO = ['simple', 'combo'] as const;
export type TipoServicio = (typeof TIPOS_SERVICIO)[number];

export interface Servicio {
  id: number;
  tipo: TipoServicio;
  categoria: { id: number; nombre: string };
  nombre: string;
  descripcion: string;
  precio: Pesos;
  /** `null` mientras no tenga duración (p. ej., un combo sin componentes). */
  duracion_min: number | null;
  agendable_en_linea: boolean;
  visible_en_landing: boolean;
  activo: boolean;
  destacado: boolean;
  /** Solo en los destacados (máximo 30 caracteres). */
  etiqueta: string | null;
  orden: number;
  /** Servicios simples que forman el combo. */
  componentes: Nombrado[];
  barberos_que_lo_ofrecen: number;
  /** Advertencia para el panel (p. ej., «Ningún barbero lo ofrece»). */
  advertencia: string | null;
}

export interface ServicioDto {
  /** Por defecto `simple`. */
  tipo?: TipoServicio;
  categoria_id: number;
  nombre: string;
  descripcion: string;
  precio: Pesos;
  /** Obligatoria en los simples; en los combos sale de sus componentes. */
  duracion_min?: number | null;
  /** Por defecto `true`. */
  agendable_en_linea?: boolean;
  /** Por defecto `true`. */
  visible_en_landing?: boolean;
  destacado?: boolean;
  etiqueta?: string | null;
  orden?: number;
  /** Ids de los servicios simples del combo (mínimo dos). */
  componentes?: number[];
}

// ---------------------------------------------------------------------------
// Barberos
// ---------------------------------------------------------------------------

export const ESTADOS_BARBERO = ['activo', 'vacaciones', 'incapacidad_licencia', 'suspendido', 'inactivo'] as const;
export type EstadoBarbero = (typeof ESTADOS_BARBERO)[number];

export const TIPOS_DOCUMENTO_IDENTIDAD = ['CC', 'CE', 'PPT', 'PA'] as const;
export type TipoDocumentoIdentidad = (typeof TIPOS_DOCUMENTO_IDENTIDAD)[number];

export const TIPOS_VINCULACION = ['prestacion_servicios', 'laboral_indefinido', 'laboral_termino_fijo'] as const;
export type TipoVinculacion = (typeof TIPOS_VINCULACION)[number];

export const PERIODOS_LIQUIDACION = ['semanal', 'quincenal', 'mensual'] as const;
export type PeriodoLiquidacion = (typeof PERIODOS_LIQUIDACION)[number];

export const TIPOS_AUSENCIA = ['vacaciones', 'incapacidad', 'licencia', 'suspension'] as const;
export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number];

export const MOTIVOS_RETIRO = ['renuncia_voluntaria', 'terminacion_contrato', 'fin_prestacion_servicios', 'otro'] as const;
export type MotivoRetiro = (typeof MOTIVOS_RETIRO)[number];

export const MOTIVOS_BLOQUEO = ['cita_medica', 'diligencia_personal', 'capacitacion', 'otro'] as const;
export type MotivoBloqueo = (typeof MOTIVOS_BLOQUEO)[number];

export const TIPOS_ADJUNTO = ['identidad', 'contrato', 'hoja_de_vida', 'certificado', 'afiliacion', 'planilla_pila'] as const;
export type TipoAdjunto = (typeof TIPOS_ADJUNTO)[number];

export const PARENTESCOS = ['madre_padre', 'pareja', 'hermano', 'hijo', 'otro'] as const;
export type Parentesco = (typeof PARENTESCOS)[number];

export const MEDIOS_PAGO_BARBERO = ['transferencia', 'nequi', 'daviplata', 'efectivo'] as const;
export type MedioPagoBarbero = (typeof MEDIOS_PAGO_BARBERO)[number];

/**
 * Estado de hoy, calculado: el código, su texto («Activo», «Vacaciones», «Incapacidad o
 * licencia», «Suspendido», «Inactivo») y, si es una ausencia, sus fechas.
 */
export interface EstadoDeBarbero {
  codigo: EstadoBarbero;
  etiqueta: string;
  desde: Fecha | null;
  hasta: Fecha | null;
}

export interface VisibilidadBarbero {
  mostrar_en_landing: boolean;
  recibe_citas_en_linea: boolean;
  /** Puede entrar al panel del barbero. */
  acceso_panel: boolean;
}

export interface CuentaBarbero {
  correo: string;
  pendiente_activacion: boolean;
  ultimo_acceso_en: Instante | null;
}

/** Franja de trabajo. `dia_semana`: 1 = lunes … 7 = domingo. */
export interface Franja {
  dia_semana: number;
  inicio: Hora;
  fin: Hora;
}

export interface Horario {
  franjas: Franja[];
  total_horas_semana: number;
}

export interface Barbero {
  id: number;
  usuario_id: number;
  /** Nombre para mostrar (nombres y apellidos). */
  nombre: string;
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumentoIdentidad;
  numero_documento: string;
  fecha_nacimiento: Fecha;
  celular: string;
  especialidad: string;
  anios_experiencia: number | null;
  instagram: string | null;
  biografia: string | null;
  /** Ruta pública (`/media/publico/…`): pásela por `urlDelServidor`. */
  foto_url: string | null;
  fecha_ingreso: Fecha;
  tipo_vinculacion: TipoVinculacion;
  fin_contrato: Fecha | null;
  porcentaje_comision: Porcentaje;
  periodo_liquidacion: PeriodoLiquidacion;
  estado: EstadoDeBarbero;
  fecha_retiro: Fecha | null;
  motivo_retiro: MotivoRetiro | null;
  visibilidad: VisibilidadBarbero;
  cuenta: CuentaBarbero | null;
  orden: number;
  servicios: Nombrado[];
  /** Solo en la ficha. */
  horario?: Horario;
}

export interface IndicadoresEquipo {
  registrados: number;
  activos: number;
  ausencias_temporales: number;
  inactivos: number;
}

export interface ListadoBarberos {
  datos: Barbero[];
  meta: IndicadoresEquipo;
}

/** Datos esenciales: `PUT /barberos/{id}` y base del registro. */
export interface DatosBarberoDto {
  tipo_documento: TipoDocumentoIdentidad;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: Fecha | null;
  celular: string;
  correo: string;
  especialidad: string;
  anios_experiencia?: number | null;
  instagram?: string | null;
  biografia?: string | null;
  /** Por defecto, hoy. */
  fecha_ingreso?: Fecha | null;
  tipo_vinculacion: TipoVinculacion;
  /** Obligatorio con `laboral_termino_fijo`. */
  fin_contrato?: Fecha | null;
  /** Por defecto, el del negocio. */
  porcentaje_comision?: Porcentaje | null;
  periodo_liquidacion?: PeriodoLiquidacion | null;
}

export interface FranjaDto {
  dia_semana: number;
  inicio: Hora;
  fin: Hora;
}

/** `POST /barberos`: datos, servicios, horario y visibilidad en una sola llamada. */
export interface RegistrarBarberoDto extends DatosBarberoDto {
  servicios?: number[];
  horario?: FranjaDto[];
  visibilidad?: VisibilidadBarbero;
}

export interface RetiroDto {
  fecha: Fecha;
  motivo: MotivoRetiro;
}

export interface ContactoEmergencia {
  nombre: string | null;
  parentesco: Parentesco | null;
  celular: string | null;
}

/** Datos privados (cifrados en la base). */
export interface DatosPrivados {
  direccion: string | null;
  ciudad: string | null;
  grupo_sanguineo: string | null;
  emergencia: ContactoEmergencia;
  eps: string | null;
  fondo_pensiones: string | null;
  arl: string | null;
  caja_compensacion: string | null;
  medio_pago: MedioPagoBarbero | null;
  banco: string | null;
  tipo_cuenta: string | null;
  numero_cuenta: string | null;
}

export type DatosPrivadosDto = Partial<Omit<DatosPrivados, 'emergencia'>> & {
  emergencia?: Partial<ContactoEmergencia> | null;
};

export interface Foto {
  foto_url: string;
}

export interface Documento {
  id: number;
  tipo: TipoAdjunto;
  /** Mes de la planilla PILA (primer día del mes). */
  periodo: Fecha | null;
  nombre_original: string;
  tamano_bytes: number;
  cargado_en: Instante;
  /** URL firmada que vence en 5 minutos: pásela por `urlDelServidor`. */
  url_descarga: string;
}

export interface Expediente {
  documentos: Documento[];
  /** Tipos obligatorios que aún no se han cargado. */
  faltantes: TipoAdjunto[];
  completo: boolean;
}

export interface Ausencia {
  id: number;
  tipo: TipoAusencia;
  desde: Fecha;
  hasta: Fecha;
  observacion: string | null;
  /** URL firmada del soporte (privado). */
  soporte_url: string | null;
  registrada_en: Instante;
  anulada: boolean;
}

export interface AusenciaDto {
  tipo: TipoAusencia;
  desde: Fecha;
  hasta: Fecha;
  observacion: string;
}

export interface Bloqueo {
  id: number;
  fecha: Fecha;
  desde: Hora;
  hasta: Hora;
  inicio: Instante;
  fin: Instante;
  motivo: MotivoBloqueo;
  nota: string | null;
}

export interface BloqueoDto {
  fecha: Fecha;
  desde: Hora;
  hasta: Hora;
  motivo: MotivoBloqueo;
  nota?: string | null;
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export const SEGMENTOS_CLIENTE = ['sin_visitas', 'nuevo', 'recurrente', 'frecuente', 'inactivo'] as const;
export type SegmentoCliente = (typeof SEGMENTOS_CLIENTE)[number];

export const TIPOS_SOLICITUD_TITULAR = ['consulta', 'actualizacion', 'supresion'] as const;
export type TipoSolicitudTitular = (typeof TIPOS_SOLICITUD_TITULAR)[number];

/** Resultado de la búsqueda rápida (agenda y venta), máximo 8. */
export interface ClienteRapido {
  id: number;
  nombre: string;
  celular: string;
  segmento: SegmentoCliente;
}

export interface ClienteResumen {
  id: number;
  nombre: string;
  celular: string;
  correo: string | null;
  visitas: number;
  total_gastado: Pesos;
  ultima_visita: Fecha | null;
  inasistencias: number;
  barbero_habitual_id: number | null;
  segmento: SegmentoCliente;
}

export interface ConteoSegmentos {
  sin_visitas: number;
  nuevo: number;
  recurrente: number;
  frecuente: number;
  inactivo: number;
}

/** Indicadores de TODA la base, sin importar los filtros del listado. */
export interface IndicadoresClientes {
  registrados: number;
  por_segmento: ConteoSegmentos;
  dias_inactividad: number;
}

export interface ListadoClientes extends Pagina<ClienteResumen> {
  meta: IndicadoresClientes;
}

export interface ConsultaClientes extends ConsultaPagina {
  q?: string;
  segmento?: SegmentoCliente;
}

export interface Autorizacion {
  politica_version_id: number;
  canal: 'en_linea' | 'panel';
  otorgada_en: Instante;
  revocada: boolean;
}

export interface ClienteFicha extends ClienteResumen {
  fecha_nacimiento: Fecha | null;
  preferencias: string | null;
  recordatorios_activos: boolean;
  cliente_desde: Instante;
  ticket_promedio: Pesos | null;
  autorizaciones: Autorizacion[];
}

export interface ClienteDto {
  nombre: string;
  /** 10 dígitos, empieza por 3. */
  celular: string;
  correo?: string | null;
  fecha_nacimiento?: Fecha | null;
  preferencias?: string | null;
  recordatorios_activos?: boolean;
}

/** Umbrales de los segmentos. */
export interface ConfiguracionSegmentos {
  /** 1 a 99. */
  max_visitas_nuevo: number;
  /** Mayor que el anterior, hasta 100. */
  max_visitas_recurrente: number;
  /** 15 a 365. */
  dias_inactividad: number;
}

/** Solicitud de habeas data. */
export interface SolicitudTitular {
  id: number;
  cliente_id: number | null;
  tipo: TipoSolicitudTitular;
  descripcion: string;
  recibida_en: Instante;
  /** Plazo legal (10 o 15 días hábiles). */
  responder_antes_de: Fecha;
  respondida_en: Instante | null;
  respondida_por: number | null;
  respuesta: string | null;
}

export interface SolicitudTitularDto {
  cliente_id?: number | null;
  tipo: TipoSolicitudTitular;
  descripcion: string;
}

// ---------------------------------------------------------------------------
// Verificación por WhatsApp (reserva en línea)
// ---------------------------------------------------------------------------

export interface CodigoEnviado {
  /** Id de la verificación, para confirmar el código. */
  id: number;
  expira_en: Instante;
  /** Antes de esta hora no se puede pedir otro código. */
  reenviar_desde: Instante;
}

/** Datos del cliente si el celular ya existía (para autocompletar). */
export interface ClienteVerificado {
  nombre: string;
  correo: string | null;
  fecha_nacimiento: Fecha | null;
}

export interface Verificacion {
  /** De un solo uso: sirve para crear UNA cita. */
  comprobante: string;
  cliente: ClienteVerificado | null;
}

// ---------------------------------------------------------------------------
// Agenda: citas, disponibilidad y sitio público
// ---------------------------------------------------------------------------

export const ESTADOS_CITA = ['sin_confirmar', 'confirmada', 'en_curso', 'atendida', 'no_asistio', 'cancelada'] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

export const ORIGENES_CITA = ['en_linea', 'panel'] as const;
export type OrigenCita = (typeof ORIGENES_CITA)[number];

export const MOTIVOS_CANCELACION = ['solicitud_cliente', 'barbero_no_disponible', 'otro'] as const;
export type MotivoCancelacion = (typeof MOTIVOS_CANCELACION)[number];

export const TIPOS_DIA = ['normal', 'festivo', 'cerrado', 'cierre_temprano'] as const;
export type TipoDia = (typeof TIPOS_DIA)[number];

export type ActorEvento = 'cliente' | 'barbero' | 'administrador' | 'sistema';

export type EventoDeCita =
  | 'creada'
  | 'confirmada'
  | 'iniciada'
  | 'atendida'
  | 'no_asistio'
  | 'cancelada'
  | 'reprogramada'
  | 'reasignada'
  | 'venta_anulada';

export type PropositoMensaje =
  | 'confirmacion'
  | 'recordatorio_24h'
  | 'recordatorio_2h'
  | 'recordatorio_manual'
  | 'cancelacion'
  | 'reprogramacion'
  | 'aviso_reprogramacion';

export interface Cita {
  id: number;
  estado: EstadoCita;
  origen: OrigenCita;
  inicio: Instante;
  fin: Instante;
  precio: Pesos;
  servicio: { id: number; nombre: string; duracion_min: number };
  barbero: { id: number; nombre: string; asignacion_automatica: boolean };
  /** No viene en la gestión pública por enlace. */
  cliente?: { id: number; nombre: string; celular: string; visitas: number; inasistencias: number };
  nota?: string;
  cancelacion_tardia: boolean | null;
  motivo_cancelacion: MotivoCancelacion | null;
}

export interface EventoCita {
  evento: EventoDeCita;
  actor: ActorEvento;
  ocurrido_en: Instante;
  inicio_previo: Instante | null;
  barbero_previo: number | null;
  tardio: boolean;
  detalle: string | null;
}

export interface MensajeDeCita {
  proposito: PropositoMensaje;
  plantilla: PlantillaMensaje;
  estado: EstadoMensaje;
  intentos: number;
  ultimo_error: string | null;
  creado_en: Instante;
  enviado_en: Instante | null;
}

/** `GET /agenda/citas/{id}` y la respuesta de cada acción sobre una cita. */
export interface DetalleCita extends Cita {
  historial: EventoCita[];
  mensajes: MensajeDeCita[];
}

/** Respuesta de la reserva en línea (`201`). */
export interface CitaCreada {
  cita: Cita;
  /** Enlace para ver, reprogramar o cancelar (también llega por WhatsApp). */
  enlace_gestion: string;
  calendario_google: string;
}

/** Lo que ve el cliente desde su enlace. */
export interface GestionCita {
  cita: Cita;
  direccion: string | null;
  puede_cancelar: boolean;
  puede_reprogramar: boolean;
  /** Cancelar ahora quedaría como tardía (dentro del aviso mínimo). */
  cancelacion_seria_tardia: boolean;
  recordatorios_activos: boolean;
  calendario_google: string;
}

export interface HoraLibre {
  inicio: Instante;
  /** Texto para mostrar: `3:30 p. m.`. */
  hora: string;
  /** Con «Cualquier barbero», el que se asignaría. */
  barbero_id: number;
  barbero: string;
}

export interface HorasDelDia {
  fecha: Fecha;
  manana: HoraLibre[];
  tarde: HoraLibre[];
  noche: HoraLibre[];
}

export type EstadoDiaCalendario = 'disponible' | 'ultimos_cupos' | 'sin_cupos' | 'fuera_de_ventana';

export interface Calendario {
  mes: Mes;
  dias: { fecha: Fecha; estado: EstadoDiaCalendario; horas_libres: number }[];
}

/** Barbero elegible para un servicio en la reserva en línea. */
export interface OpcionBarbero {
  id: number;
  nombre: string;
  especialidad: string;
  foto_url: string | null;
  disponible: boolean;
  /** Por qué no se puede elegir (vacaciones, sin turnos…). */
  motivo: string | null;
  proxima_hora: Instante | null;
}

export interface BarberoPublico {
  id: number;
  nombre: string;
  nombre_corto: string;
  especialidad: string;
  anios_experiencia: number | null;
  instagram: string | null;
  biografia: string | null;
  foto_url: string | null;
  de_vacaciones_hasta: Fecha | null;
  agendable: boolean;
}

/** Todo lo de la landing en una sola llamada (caché de 60 s). */
export interface Landing {
  negocio: NegocioPublico;
  horario_atencion: HorarioDia[];
  servicios: Servicio[];
  barberos: BarberoPublico[];
  politicas: Politica[];
}

export interface ReservaDto {
  /** El de `confirmarCodigo`. */
  comprobante: string;
  servicio_id: number;
  /** `null` = «Cualquier barbero». */
  barbero_id?: number | null;
  inicio: Instante;
  cliente: { nombre: string; correo?: string | null; fecha_nacimiento?: Fecha | null };
  /** Debe ser `true`. */
  autoriza_tratamiento_datos: boolean;
  /** Id de la política `tratamiento_datos` vigente (viene en la landing). */
  politica_version_id: number;
}

export interface ReprogramacionDto {
  inicio: Instante;
  /** `null` = «Cualquier barbero». */
  barbero_id?: number | null;
}

export interface CitaPanelDto {
  /** Uno de los dos: un cliente existente o uno nuevo. */
  cliente_id?: number | null;
  cliente_nuevo?: { nombre: string; celular: string; correo?: string | null; fecha_nacimiento?: Fecha | null } | null;
  servicio_id: number;
  /** `null` = el primero libre. */
  barbero_id?: number | null;
  inicio: Instante;
  nota?: string | null;
}

export interface CancelacionDto {
  motivo: MotivoCancelacion;
  /** Envía `cita_cancelada` por WhatsApp. */
  avisar_cliente?: boolean;
}

export interface ConsultaCitas {
  desde?: Fecha;
  hasta?: Fecha;
  barbero_id?: number;
  estado?: EstadoCita;
}

/** Para ver qué citas quedarían afectadas ANTES de guardar un cambio. Envíe uno de los tres. */
export interface ConflictosDto {
  barbero_id: number;
  ausencia?: { desde: Fecha; hasta: Fecha } | null;
  bloqueo?: { fecha: Fecha; desde: Hora; hasta: Hora } | null;
  horario_propuesto?: FranjaDto[] | null;
}

export interface ColumnaTablero {
  barbero_id: number;
  nombre: string;
  /** Estado del barbero ese día (`activo`, `vacaciones`…). */
  estado: string;
  /** Turnos del día. */
  franjas: { inicio: Hora; fin: Hora }[];
  bloqueos: { inicio: Instante; fin: Instante }[];
  citas: Cita[];
}

export interface Tablero {
  fecha: Fecha;
  tipo_dia: TipoDia;
  total_citas: number;
  por_atender: number;
  barberos: ColumnaTablero[];
}

export interface ConteoCitas {
  total: number;
  sin_confirmar: number;
  confirmadas: number;
  en_curso: number;
  atendidas: number;
  no_asistio: number;
  canceladas: number;
  por_atender: number;
}

export interface DiaBarbero {
  fecha: Fecha;
  tipo_dia: TipoDia;
  /** `trabaja`, `no_trabaja`, `retirado` o el tipo de ausencia. */
  estado: string;
  citas: ConteoCitas;
  minutos_disponibles: number;
  minutos_ocupados: number;
  /** `null` si no trabaja. */
  minutos_libres: number | null;
  /** Ya no cabe su servicio más corto. */
  agenda_llena: boolean;
}

/** «Mis citas» del barbero. */
export interface ResumenAgendaBarbero {
  barbero_id: number;
  nombre: string;
  hoy: DiaBarbero;
  manana: DiaBarbero;
  proximos_7_dias: {
    desde: Fecha;
    hasta: Fecha;
    citas: ConteoCitas;
    dias_con_agenda_llena: number;
    dias: DiaBarbero[];
  };
}

export type PoliticaInasistencias = 'confirmar_por_llamada' | 'bloquear_reserva_en_linea' | 'sin_restriccion';

/** Reglas de agendamiento. Solo admiten los valores indicados. */
export interface ConfiguracionAgenda {
  /** 30, 60 o 120. */
  anticipacion_minima_min: number;
  /** 15, 30 o 60. */
  ventana_reserva_dias: number;
  /** 15 o 30. */
  intervalo_min: number;
  /** 60, 180 o 1440. */
  aviso_cancelacion_min: number;
  recordatorio_24h: boolean;
  recordatorio_2h: boolean;
  politica_inasistencias: PoliticaInasistencias;
  /** 1 a 10. */
  umbral_inasistencias: number;
}

// ---------------------------------------------------------------------------
// Ventas y caja
// ---------------------------------------------------------------------------

export interface MetodoPago {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface Descuento {
  id: number;
  nombre: string;
  tipo: 'porcentaje' | 'valor_fijo';
  /** Porcentaje entero o pesos, según `tipo`. */
  valor: number;
  permitido_a_barberos: boolean;
}

export interface CatalogosVenta {
  metodos_pago: MetodoPago[];
  descuentos: Descuento[];
  motivos_descuento: Nombrado[];
  propinas_rapidas: [Pesos, Pesos, Pesos];
}

export interface LineaVenta {
  posicion: number;
  servicio_id: number;
  nombre: string;
  precio: Pesos;
}

export interface Pago {
  metodo_pago_id: number;
  nombre: string;
  monto: Pesos;
}

export interface Venta {
  id: number;
  numero_ticket: number;
  registrada_en: Instante;
  fecha_operacion: Fecha;
  registrada_por: number;
  estado: 'registrada' | 'anulada';
  barbero: Nombrado;
  /** `null` = cliente ocasional. */
  cliente: Nombrado | null;
  cita_id: number | null;
  lineas: LineaVenta[];
  subtotal: Pesos;
  descuento: {
    descuento_id: number;
    nombre: string;
    motivo_descuento_id: number;
    motivo: string;
    valor: Pesos;
  } | null;
  venta_neta: Pesos;
  propina: Pesos;
  total_cobrado: Pesos;
  porcentaje_comision: Porcentaje;
  comision_barbero: Pesos;
  pagos: Pago[];
  anulacion: { anulada_en: Instante; anulada_por: number; motivo: string } | null;
}

export type ClienteVentaDto =
  | { tipo: 'registrado'; id: number }
  | { tipo: 'nuevo'; nombre: string; celular: string; correo?: string | null; fecha_nacimiento?: Fecha | null }
  | { tipo: 'ocasional' };

/**
 * `POST /ventas`. El servidor recalcula todos los valores con los precios
 * vigentes. Con `cita_id`, el cliente es el de la cita y el barbero también si
 * no se indica otro. La suma de `pagos` debe ser venta neta + propina (si no, `422`).
 */
export interface VentaDto {
  cita_id?: number | null;
  /** Ignorado con `cita_id`. */
  cliente?: ClienteVentaDto | null;
  /** Para el barbero se fija al suyo. Sin cita, obligatorio. */
  barbero_id?: number | null;
  /** Siempre: lo que realmente se hizo (puede diferir de lo agendado). */
  servicio_ids: number[];
  descuento?: { descuento_id: number; motivo_descuento_id: number } | null;
  propina?: Pesos;
  pagos: { metodo_pago_id: number; monto: Pesos }[];
}

export interface ConsultaVentas extends ConsultaPagina {
  /** Sin filtros de fecha: las de hoy. */
  fecha?: Fecha;
  desde?: Fecha;
  hasta?: Fecha;
  barbero_id?: number;
  /** Historial del cliente. */
  cliente_id?: number;
  incluir_anuladas?: boolean;
}

export interface Caja {
  fecha: Fecha;
  numero_ventas: number;
  subtotal: Pesos;
  descuentos: Pesos;
  venta_neta: Pesos;
  propinas: Pesos;
  total_cobrado: Pesos;
  /** Propinas incluidas. */
  por_metodo: { metodo_pago_id: number; codigo: string; nombre: string; total: Pesos }[];
  anuladas: number;
  ventas: Venta[];
}

/** «Lo que llevas hoy». */
export interface ResumenVentasBarbero {
  fecha: Fecha;
  barbero: Nombrado;
  numero_ventas: number;
  venta_neta: Pesos;
  comision: Pesos;
  propinas: Pesos;
  total_a_recibir: Pesos;
  ventas: Venta[];
}

export interface CierreCaja {
  id: number;
  fecha: Fecha;
  cerrado_por: number;
  cerrado_en: Instante;
  observacion: string | null;
  metodos: {
    metodo_pago_id: number;
    nombre: string;
    esperado: Pesos;
    contado: Pesos | null;
    diferencia: number | null;
  }[];
  total_esperado: Pesos;
  total_contado: Pesos;
  diferencia: number;
}

export interface CierreDto {
  fecha: Fecha;
  contado?: { metodo_pago_id: number; monto: Pesos }[];
  observacion?: string | null;
}

// ---------------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------------

/** `{ mes: '2026-11' }` o `{ desde, hasta }`; vacío = el mes en curso hasta hoy. Máximo un año. */
export interface PeriodoReporte {
  mes?: Mes;
  desde?: Fecha;
  hasta?: Fecha;
}

export interface Periodo {
  desde: Fecha;
  hasta: Fecha;
  /** «noviembre de 2026», «1 al 15 de noviembre de 2026». */
  texto: string;
  dias: number;
}

export interface Totales {
  clientes_atendidos: number;
  servicios: number;
  subtotal: Pesos;
  descuentos: Pesos;
  ventas_netas: Pesos;
  propinas: Pesos;
  total_cobrado: Pesos;
  comisiones: Pesos;
  ticket_promedio: Pesos | null;
}

export interface ServicioVendido {
  servicio_id: number;
  nombre: string;
  categoria: string;
  unidades: number;
  ingresos: Pesos;
}

export interface Liquidacion {
  barbero_id: number;
  nombre: string;
  clientes_atendidos: number;
  servicios: number;
  ventas_netas: Pesos;
  comision: Pesos;
  propinas: Pesos;
  total_a_pagar: Pesos;
}

export interface ResumenVentas {
  periodo: Periodo;
  totales: Totales;
  por_semana: { desde: Fecha; hasta: Fecha; ventas_netas: Pesos }[];
  por_servicio: ServicioVendido[];
  por_metodo: { metodo: string; nombre: string; total: Pesos }[];
  por_barbero: Liquidacion[];
}

export interface ReporteBarbero {
  periodo: Periodo;
  barbero: {
    id: number;
    nombre: string;
    tipo_documento: TipoDocumentoIdentidad;
    numero_documento: string;
    tipo_vinculacion: TipoVinculacion;
    fecha_ingreso: Fecha;
    porcentaje_comision: Porcentaje;
    fecha_retiro: Fecha | null;
  };
  totales: Totales;
  clientes_distintos: number;
  servicios: ServicioVendido[];
  liquidacion: Liquidacion;
  ventas: {
    venta_id: number;
    numero_ticket: number;
    registrada_en: Instante;
    cliente: string;
    servicios: string;
    ventas_netas: Pesos;
    propina: Pesos;
    comision: Pesos;
  }[];
}

export interface ClientesDelPeriodo {
  atendidos: number;
  ocasionales: number;
  nuevos: number;
  recurrentes: number;
  con_retorno: number;
  porcentaje_retorno: number | null;
}

export interface ClienteReactivar {
  cliente_id: number;
  nombre: string;
  celular: string;
  ultima_visita: Fecha;
  dias_sin_volver: number;
  ultimo_servicio: string | null;
}

export interface ReporteClientes {
  periodo: Periodo;
  clientes: ClientesDelPeriodo;
  inasistencias: number;
  mas_visitas: { cliente_id: number; nombre: string; celular: string | null; visitas: number; ventas_netas: Pesos }[];
  por_reactivar: { dias_inactividad: number; total: number; clientes: ClienteReactivar[] };
}

export interface CitaResumen {
  cita_id: number;
  inicio: Instante;
  hora: string;
  cliente: string;
  servicio: string;
  barbero_id: number;
  barbero: string;
  estado: EstadoCita;
}

export interface Ausente {
  barbero_id: number;
  nombre: string;
  tipo: TipoAusencia;
  hasta: Fecha;
}

export interface RendimientoBarbero {
  barbero_id: number;
  nombre: string;
  estado: string;
  clientes_atendidos: number;
  servicios: number;
  ventas_netas: Pesos;
  propinas: Pesos;
  minutos_ocupados: number;
  minutos_disponibles: number;
  /** De 0 a 1; `null` si no tenía turnos. */
  ocupacion: number | null;
}

export interface Dashboard {
  fecha: Fecha;
  generado_en: Instante;
  /** Hoy hasta la hora actual. */
  hoy: Totales;
  /** El mismo día de la semana anterior, a la misma hora. */
  comparacion: {
    fecha: Fecha;
    totales: Totales;
    variacion_ventas_netas: number | null;
    variacion_clientes: number | null;
  };
  /** Últimos 12 días. */
  tendencia: { fecha: Fecha; ventas_netas: Pesos }[];
  citas: {
    atendidas: number;
    en_curso: number;
    proximas: number;
    sin_cerrar: number;
    no_asistio: number;
    canceladas: number;
  };
  proximas: CitaResumen[];
  barberos: RendimientoBarbero[];
  totales_barberos: Totales;
  ausentes: Ausente[];
}

export interface Tendencias {
  periodo: Periodo;
  por_servicio: ServicioVendido[];
  clientes: ClientesDelPeriodo;
  clientes_por_mes: { mes: number; anio_actual: number; anio_anterior: number }[];
  /** Últimas 4 semanas: promedio de clientes por día y hora. */
  horas_pico: { dia_semana: number; hora: number; promedio: number }[];
}

export interface Alertas {
  sin_confirmar_manana: CitaResumen[];
  cumpleanos: { cliente_id: number; nombre: string; celular: string; fecha: Fecha }[];
  ausentes: Ausente[];
  por_reactivar: number;
  solicitudes_titular: number;
  avisos_no_leidos: number;
}

// ---------------------------------------------------------------------------
// Avisos, mensajes y auditoría
// ---------------------------------------------------------------------------

export type TipoAviso =
  | 'cambio_horario_con_citas'
  | 'bloqueo_con_citas'
  | 'ausencia_con_citas'
  | 'solicitud_correccion'
  | 'mensaje_fallido';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  titulo: string;
  detalle: string | null;
  /** Depende del tipo; las citas afectadas vienen en `cita_ids`. */
  datos: { cita_ids?: number[] } & Record<string, unknown>;
  creado_en: Instante;
  leido_en: Instante | null;
}

export type CanalMensaje = 'whatsapp' | 'correo';
export type EstadoMensaje = 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'fallido' | 'cancelado';
export type PlantillaMensaje =
  | 'codigo_verificacion'
  | 'cita_confirmada'
  | 'recordatorio_cita'
  | 'cita_reprogramada'
  | 'cita_cancelada'
  | 'aviso_reprogramacion'
  | 'invitacion_personal'
  | 'recuperacion_contrasena';

/** Un mensaje del registro (sin sus variables). */
export interface Mensaje {
  id: number;
  canal: CanalMensaje;
  plantilla: PlantillaMensaje;
  destinatario: string;
  estado: EstadoMensaje;
  intentos: number;
  ultimo_error: string | null;
  programado_para: Instante;
  creado_en: Instante;
  enviado_en: Instante | null;
}

export interface ConsultaMensajes extends ConsultaPagina {
  destinatario?: string;
  estado?: EstadoMensaje;
  canal?: CanalMensaje;
  plantilla?: PlantillaMensaje;
}

export interface RegistroAuditoria {
  id: number;
  ocurrido_en: Instante;
  actor: ActorEvento;
  usuario_id: number | null;
  modulo: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  antes: unknown;
  despues: unknown;
}

export interface ConsultaAuditoria extends ConsultaPagina {
  entidad?: string;
  entidad_id?: string | number;
  desde?: Fecha;
  hasta?: Fecha;
}

// ---------------------------------------------------------------------------
// Sistema
// ---------------------------------------------------------------------------

export interface AlertaSistema {
  codigo: string;
  mensaje: string;
}

export interface ResumenHttp {
  peticiones: number;
  exitosas: number;
  redirecciones: number;
  errores_del_cliente: number;
  errores_del_servidor: number;
  latencia: { medidas: number; p50_ms: number; p95_ms: number; p99_ms: number } | null;
}

export interface EstadoCanal {
  configurado: boolean;
  pendientes: number;
  atraso_min: number | null;
  enviados_24h: number;
  fallidos_24h: number;
  fallidos_ultima_hora: number;
}

export interface EstadoSistema {
  generado_en: Instante;
  estado: 'ok' | 'alerta';
  alertas: AlertaSistema[];
  informativos: AlertaSistema[];
  /** Métricas de este proceso de la API. */
  api: {
    segundos_en_marcha: number;
    ultimos_5_min: ResumenHttp;
    ultimos_15_min: ResumenHttp;
    desde_el_arranque: ResumenHttp;
    rutas_destacadas: (ResumenHttp & { ruta: string })[];
  };
  cola: {
    correo: EstadoCanal;
    whatsapp: EstadoCanal;
    /** `meta`, `simulado` o `null` (en producción sin credenciales: los mensajes esperan). */
    proveedor_whatsapp: 'meta' | 'simulado' | null;
    webhooks_pendientes: number;
    webhooks_atraso_min: number | null;
    webhooks_con_error_24h: number;
  };
  trabajos: {
    vencidos: number;
    atraso_min: number | null;
    atascados: number;
    fallidos_24h: number;
    minutos_desde_el_ultimo: number | null;
  };
}
