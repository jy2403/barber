/* =========================================================
   Tipos del dominio · AURUM Barber Club
   ========================================================= */

export type IconName = string;

/** Franja horaria en minutos desde la medianoche: [inicio, fin] */
export type Franja = [number, number];

/** Horario semanal: clave = día de la semana (0 = domingo … 6 = sábado) */
export type HorarioSemanal = Partial<Record<number, Franja[]>>;

export interface Servicio {
  id: string;
  nombre: string;
  corto: string;
  cat: string;
  dur: number;
  precio: number;
  icon: IconName;
  activo: boolean;
  destacado?: boolean;
  nota?: string;
  vendidos: number;
  ingresos: number;
  desc: string;
}

export type EstadoBarbero = 'activo' | 'vacaciones' | 'incapacidad' | 'suspendido' | 'inactivo';

export interface RangoFechas {
  desde: Date;
  hasta: Date;
}

export interface Barbero {
  id: string;
  nombre: string;
  corto: string;
  esp: string;
  espC: string;
  exp: string;
  ig: string;
  tipoDoc: string;
  doc: string;
  cel: string;
  correo: string;
  nac?: string;
  ingreso: Date;
  estado: EstadoBarbero;
  vac?: RangoFechas;
  retiro?: Date;
  ofrece: string[];
  dias: HorarioSemanal;
  /** Días (offset desde hoy) con la agenda llena */
  lleno: number[];
  emergencia?: string;
}

export type Segmento = 'frecuente' | 'recurrente' | 'nuevo' | 'inactivo';

export interface Cliente {
  nombre: string;
  cel: string;
  correo: string;
  visitas: number;
  /** Días desde la última visita */
  dias: number;
  total: number;
  barbero: string;
  seg: Segmento;
  noShows: number;
  desde: Date;
  cumple: string;
  pref: string;
}

export type EstadoCita = 'atendida' | 'encurso' | 'confirmada' | 'pendiente' | 'noasistio' | 'cancelada';

export interface Cita {
  id: string;
  /** id del barbero */
  b: string;
  ini: number;
  dur: number;
  cliente: string;
  paquete: string;
  items: string[];
  largo: string;
  precio: number;
  est: EstadoCita;
  tel: string;
  hist: string;
  nota: string;
  origen: string;
}

export interface Bloqueo {
  b: string;
  ini: number;
  dur: number;
  label: string;
  vac?: boolean;
}

/** Bloqueo puntual que un barbero pone en su agenda (cita médica, diligencia…) */
export interface BloqueoPersonal {
  id: string;
  b: string;
  d: Date;
  a: number;
  z: number;
  m: string;
}

export type MetodoPago = 'efectivo' | 'nequi' | 'daviplata' | 'tarjeta' | 'transferencia';
export type DescuentoId = 'no' | 'p10' | 'p15' | 'f5';

export interface Venta {
  ticket: number;
  /** Hora en minutos */
  t: number;
  cliente: string;
  b: string;
  items: string[];
  desc: DescuentoId;
  propina: number;
  metodo: MetodoPago;
  sub: number;
  descVal: number;
  neto: number;
  total: number;
  nueva?: boolean;
}

export interface Caja {
  n: number;
  total: number;
  propinas: number;
  servicios: number;
  clientes: number;
  metodos: Record<MetodoPago, number>;
}

export interface Confirmacion {
  nombre: string;
  cel: string;
  sv: Servicio;
  b: Barbero;
  dia: Date;
  hora: number;
}

export type Rol = 'admin' | 'barbero';

/* ---------- Payloads hacia el backend ---------- */

export interface NuevaVentaPayload {
  t: number;
  cliente: string;
  b: string;
  items: string[];
  desc: DescuentoId;
  propina: number;
  metodo: MetodoPago;
  /** Cita de origen (se marca como atendida) */
  citaId?: string;
  /** Cliente nuevo a registrar junto con la venta */
  clienteNuevo?: { nombre: string; cel: string; correo: string };
}

export interface ReservaPayload {
  nombre: string;
  cel: string;
  correo: string;
  nac?: string;
  nota?: string;
  recordatorio: boolean;
  servicioId: string;
  barberoId: string;
  dia: Date;
  hora: number;
}

export interface BarberoPayload {
  nombre: string;
  corto?: string;
  esp: string;
  exp?: string;
  ig?: string;
  tipoDoc?: string;
  doc?: string;
  cel: string;
  correo: string;
  ofrece: string[];
  dias: HorarioSemanal;
}

export interface ServicioPayload {
  nombre: string;
  desc: string;
  precio: number;
  cat: string;
  dur: number;
  activo: boolean;
  /** ids de barberos que lo ofrecen */
  barberos: string[];
}

/* ---------- Reportes ---------- */

export interface Periodo {
  desde: Date;
  hasta: Date;
  dias: number;
  label: string;
  enCurso: boolean;
  f: number;
}

export interface PeriodoParams {
  modo: 'mes' | 'rango';
  mes: string;
  desde: string;
  hasta: string;
}

export interface ReporteBarbero {
  cells: Record<string, number>;
  serv: number;
  bruto: number;
  desc: number;
  netas: number;
  prop: number;
  cli: number;
  com: number;
  pagar: number;
  vacNota: string;
}

export interface ReporteCalc {
  barberos: Record<string, ReporteBarbero>;
  svc: Record<string, number>;
  bruto: number;
  desc: number;
  netas: number;
  propinas: number;
  servicios: number;
  clientes: number;
  metodos: [MetodoPago, number][];
  semanas: { label: string; v: number }[];
  nuevos: number;
  noShows: number;
  ticket: number;
}
