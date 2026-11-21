import type { DescuentoId, EstadoBarbero, EstadoCita, MetodoPago, Segmento } from '@/types';
import { hora } from './format';

/* ---------- Datos del negocio (reemplazar los corchetes) ---------- */
export const NEGOCIO = {
  nombre: 'AURUM',
  sub: 'BARBER CLUB',
  wa: '[300 000 0000]',
  waLink: 'https://wa.me/',
  dir: '[Dirección completa de la barbería]',
  dirCorta: '[Dirección de la barbería]',
  zona: '[Barrio · Ciudad] · [Referencia para llegar o parqueadero]',
  ig: '[@tubarberia]',
  nit: '[000.000.000-0]',
  horario: [
    ['Lunes a viernes', '[9:00 a. m. – 8:00 p. m.]'],
    ['Sábados', '[9:00 a. m. – 7:00 p. m.]'],
    ['Domingos y festivos', '[10:00 a. m. – 3:00 p. m.]'],
  ] as [string, string][],
  comision: 0.5,
};

/* ---------- Agendamiento ---------- */
/** Días hacia adelante en los que se puede reservar */
export const VENTANA = 30;
export const FESTIVOS: Record<string, string> = {
  '2026-11-02': 'Todos los Santos',
  '2026-11-16': 'Independencia de Cartagena',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
  '2027-01-01': 'Año Nuevo',
  '2027-01-11': 'Reyes Magos',
};
export const CERRADO: Record<string, boolean> = { '2026-12-25': true, '2027-01-01': true };

/* ---------- Estados ---------- */
export const EST_B: Record<EstadoBarbero, { txt: string; cls: string; color: string; desc: string }> = {
  activo: { txt: 'Activo', cls: 'b-ok', color: 'var(--ok)', desc: 'Recibe citas y aparece en la landing y en el agendamiento.' },
  vacaciones: { txt: 'Vacaciones', cls: 'b-warn', color: 'var(--warn)', desc: 'No recibe citas entre las fechas indicadas. Vuelve solo a "Activo".' },
  incapacidad: { txt: 'Incapacidad o licencia', cls: 'b-info', color: 'var(--info)', desc: 'Ausencia médica o licencia con soporte. Bloquea la agenda en esas fechas.' },
  suspendido: { txt: 'Suspendido', cls: 'b-bad', color: 'var(--bad)', desc: 'Suspensión temporal decidida por la administración. No recibe citas.' },
  inactivo: { txt: 'Inactivo', cls: '', color: 'var(--mute)', desc: 'Retirado de la barbería. Su historial de ventas y citas se conserva.' },
};

export const EST_OPC: [EstadoBarbero, string, string, string[]][] = [
  ['activo', 'Activo', 'Trabaja con normalidad.', ['Landing', 'Recibe citas', 'Panel']],
  ['vacaciones', 'Vacaciones', 'Ausencia programada. Su agenda se bloquea entre las fechas.', ['Landing con aviso', 'Sin citas en el rango', 'Panel']],
  ['incapacidad', 'Incapacidad o licencia', 'Ausencia por salud, calamidad o licencia. Pide soporte.', ['Oculto en landing', 'Sin citas en el rango', 'Panel']],
  ['suspendido', 'Suspendido', 'Medida temporal. No recibe citas ni entra al panel.', ['Oculto', 'Sin citas', 'Sin panel']],
  ['inactivo', 'Inactivo (retirado)', 'Ya no trabaja aquí. Su historial y reportes se conservan.', ['Oculto', 'Sin citas', 'Sin panel']],
];

export const SEG: Record<Segmento, { txt: string; cls: string }> = {
  frecuente: { txt: 'Frecuente', cls: 'b-gold' },
  recurrente: { txt: 'Recurrente', cls: 'b-line' },
  nuevo: { txt: 'Nuevo', cls: 'b-info' },
  inactivo: { txt: '+60 días', cls: 'b-bad' },
};

export const EST_CITA: Record<EstadoCita, { txt: string; cls: string }> = {
  atendida: { txt: 'Atendida', cls: 'b-ok' },
  encurso: { txt: 'En curso', cls: 'b-gold' },
  confirmada: { txt: 'Confirmada', cls: 'b-line' },
  pendiente: { txt: 'Sin confirmar', cls: 'b-info' },
  noasistio: { txt: 'No asistió', cls: 'b-bad' },
  cancelada: { txt: 'Cancelada', cls: '' },
};

/* ---------- Paquetes de la agenda ---------- */
export const PAQ: Record<string, { items: string[]; largo: string; precio: number }> = {
  Corte: { items: ['corte'], largo: 'Corte de cabello', precio: 35000 },
  Barba: { items: ['barba'], largo: 'Perfilado y diseño de barba', precio: 25000 },
  Combo: { items: ['combo'], largo: 'Combo cabello + barba', precio: 55000 },
  'Combo + cejas': { items: ['combo', 'cejas'], largo: 'Combo + diseño de cejas', precio: 67000 },
  Afeitado: { items: ['afeitado'], largo: 'Afeitado clásico', precio: 30000 },
  Cejas: { items: ['cejas'], largo: 'Diseño de cejas', precio: 12000 },
};
export const NOTAS = ['Quiero mantener el largo arriba, solo limpiar los lados.', 'Primera vez con este barbero.', '', 'Tengo la piel sensible, por favor bálsamo sin alcohol.'];

/* ---------- Caja ---------- */
export const METODOS: [MetodoPago, string][] = [
  ['efectivo', 'Efectivo'],
  ['nequi', 'Nequi'],
  ['daviplata', 'Daviplata'],
  ['tarjeta', 'Tarjeta'],
  ['transferencia', 'Transferencia'],
];
export const metodoTxt = (id: string) => (METODOS.find((m) => m[0] === id) || METODOS[0])[1];

export const DESCUENTOS: { id: DescuentoId; label: string; txt: string; calc: (s: number) => number }[] = [
  { id: 'no', label: 'Sin descuento', txt: '', calc: () => 0 },
  { id: 'p10', label: '10 %', txt: '−10 %', calc: (s) => s * 0.1 },
  { id: 'p15', label: '15 %', txt: '−15 %', calc: (s) => s * 0.15 },
  { id: 'f5', label: '$5.000', txt: '−$5.000', calc: (s) => Math.min(5000, s) },
];

/* ---------- Editor de horario ---------- */
export const DIAS_ED = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DIAS_ED_C = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
/** Índice del editor (0 = lunes) → día de la semana JS (0 = domingo) */
export const edToDow = (i: number) => (i + 1) % 7;
export const HORAS_OPC: [number, string][] = (() => {
  const o: [number, string][] = [];
  for (let t = 360; t <= 1380; t += 30) o.push([t, hora(t)]);
  return o;
})();

/* ---------- Navegación ---------- */
export const NAV_PUB: [string, string][] = [
  ['servicios', 'Servicios'],
  ['ritual', 'La experiencia'],
  ['barberos', 'Barberos'],
  ['galeria', 'Trabajos'],
  ['ubicacion', 'Ubicación'],
];

/** Sesión de demostración del panel de barbero */
export const YO = 'santiago';

export const RP_TIPOS: ['resumen' | 'detallado' | 'clientes', string, string, string][] = [
  ['resumen', 'Resumen de ventas y servicios', 'Totales del periodo por servicio, barbero, semana y método de pago.', 'chart'],
  ['detallado', 'Detallado por barbero', 'Cada venta del barbero con su comisión, propinas y total a pagar.', 'receipt'],
  ['clientes', 'Reporte de clientes', 'Nuevos, recurrentes, los que más vienen y los que hay que reactivar.', 'clients'],
];
