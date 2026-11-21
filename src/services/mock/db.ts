/* =========================================================
   Backend simulado (en memoria)
   ---------------------------------------------------------
   Sustituye esta capa por llamadas HTTP reales cuando exista
   la API. Los servicios de `src/services/*.service.ts` son la
   única puerta de entrada a estos datos.
   ========================================================= */
import type { Barbero, Bloqueo, BloqueoPersonal, Cita, Cliente, EstadoCita, Franja, Servicio, Venta } from '@/types';
import { NOTAS, PAQ } from '@/lib/constants';
import { HOY, addDays, toMin } from '@/lib/format';
import { mkVenta } from '@/lib/domain/sales';

/* ---------- Servicios ---------- */
const servicios: Servicio[] = [
  { id: 'corte', nombre: 'Corte de cabello', corto: 'Corte', cat: 'Cabello', dur: 45, precio: 35000, icon: 'scissors', activo: true, vendidos: 377, ingresos: 13195000, desc: 'Diagnóstico de estilo, corte a tijera y máquina, lavado y peinado final.' },
  { id: 'barba', nombre: 'Perfilado y diseño de barba', corto: 'Barba', cat: 'Barba', dur: 30, precio: 25000, icon: 'comb', activo: true, vendidos: 228, ingresos: 5700000, desc: 'Diseño según tu rostro, perfilado a navaja, toalla caliente y bálsamo.' },
  { id: 'combo', nombre: 'Combo cabello + barba', corto: 'Combo', cat: 'Combos', dur: 75, precio: 55000, icon: 'sparkle', activo: true, destacado: true, nota: 'Ahorras $5.000', vendidos: 160, ingresos: 8800000, desc: 'El servicio completo: corte, barba esculpida y ritual de toalla caliente.' },
  { id: 'afeitado', nombre: 'Afeitado clásico', corto: 'Afeitado', cat: 'Barba', dur: 40, precio: 30000, icon: 'razor', activo: true, vendidos: 73, ingresos: 2190000, desc: 'Afeitado tradicional a navaja con vapor, toalla caliente y loción.' },
  { id: 'cejas', nombre: 'Diseño de cejas', corto: 'Cejas', cat: 'Complementos', dur: 15, precio: 12000, icon: 'brow', activo: true, vendidos: 131, ingresos: 1572000, desc: 'Limpieza y diseño de cejas a navaja para enmarcar la mirada.' },
  { id: 'infantil', nombre: 'Corte infantil', corto: 'Infantil', cat: 'Cabello', dur: 30, precio: 25000, icon: 'scissors', activo: false, vendidos: 0, ingresos: 0, desc: 'Corte para menores de 12 años. Desactivado desde septiembre.' },
];

/* ---------- Barberos ---------- */
const M1: Franja[] = [[540, 780], [840, 1140]];
const T2: Franja[] = [[600, 840], [900, 1200]];
const JJ: Franja[] = [[540, 780], [840, 1080]];
const VV: Franja[] = [[660, 900], [960, 1200]];
const barberos: Barbero[] = [
  { id: 'santiago', nombre: 'Santiago Ríos', corto: 'Santiago', esp: 'Fades y degradados', espC: 'Fades y degradados', exp: '7 años de oficio', ig: '@santi.cuts', tipoDoc: 'CC', doc: '1.053.774.210', cel: '310 555 0182', correo: 'santiago.rios@correo.com', nac: '9 de agosto de 1996', ingreso: new Date(2022, 2, 14), estado: 'activo', ofrece: ['corte', 'barba', 'combo', 'cejas'], dias: { 1: M1, 2: M1, 3: [[720, 1200]], 4: M1, 5: T2, 6: [[480, 840]] }, lleno: [3], emergencia: 'Paula Ríos (hermana) · 311 555 4410' },
  { id: 'mateo', nombre: 'Mateo Valencia', corto: 'Mateo', esp: 'Barba y afeitado clásico', espC: 'Barba y afeitado', exp: '10 años de oficio', ig: '@mateo.navaja', tipoDoc: 'CC', doc: '1.017.228.904', cel: '300 555 7731', correo: 'mateo.valencia@correo.com', nac: '22 de enero de 1990', ingreso: new Date(2019, 7, 2), estado: 'activo', ofrece: ['corte', 'barba', 'combo', 'afeitado'], dias: { 0: [[600, 900]], 2: T2, 3: T2, 4: T2, 5: T2, 6: [[540, 900]] }, lleno: [10], emergencia: 'Lucía Gómez (esposa) · 300 555 1290' },
  { id: 'julian', nombre: 'Julián Castaño', corto: 'Julián', esp: 'Clásicos a tijera', espC: 'Clásicos a tijera', exp: '5 años de oficio', ig: '@julian.tijera', tipoDoc: 'CC', doc: '1.088.312.445', cel: '315 555 2209', correo: 'julian.castano@correo.com', nac: '3 de mayo de 1998', ingreso: new Date(2024, 0, 10), estado: 'activo', ofrece: ['corte', 'barba', 'combo'], dias: { 1: JJ, 2: JJ, 3: JJ, 4: JJ, 5: JJ, 6: [[540, 780]] }, lleno: [], emergencia: 'Rosa Castaño (madre) · 315 555 8812' },
  { id: 'valentina', nombre: 'Valentina Arango', corto: 'Valentina', esp: 'Texturizados y diseño de cejas', espC: 'Texturizados y cejas', exp: '4 años de oficio', ig: '@vale.barber', tipoDoc: 'CC', doc: '1.002.659.318', cel: '318 555 9046', correo: 'valentina.arango@correo.com', nac: '17 de octubre de 1999', ingreso: new Date(2023, 5, 5), estado: 'activo', ofrece: ['corte', 'barba', 'cejas'], dias: { 0: [[660, 900]], 3: VV, 4: VV, 5: VV, 6: VV }, lleno: [4], emergencia: 'Camilo Arango (hermano) · 318 555 3071' },
  { id: 'andres', nombre: 'Andrés Gómez', corto: 'Andrés', esp: 'Diseño y freestyle', espC: 'Diseño y freestyle', exp: '6 años de oficio', ig: '@andres.freestyle', tipoDoc: 'CE', doc: '4.512.887', cel: '312 555 6420', correo: 'andres.gomez@correo.com', nac: '28 de febrero de 1994', ingreso: new Date(2021, 8, 21), estado: 'vacaciones', vac: { desde: addDays(HOY, -2), hasta: addDays(HOY, 12) }, ofrece: ['corte', 'combo', 'cejas'], dias: { 1: M1, 2: M1, 3: M1, 4: M1, 5: M1 }, lleno: [], emergencia: 'María Pérez (pareja) · 312 555 7718' },
  { id: 'david', nombre: 'David Herrera', corto: 'David', esp: 'Cortes texturizados', espC: 'Cortes texturizados', exp: '8 años de oficio', ig: '@david.cuts', tipoDoc: 'CC', doc: '1.110.447.093', cel: '301 555 3318', correo: 'david.herrera@correo.com', ingreso: new Date(2020, 1, 12), estado: 'inactivo', retiro: new Date(2026, 5, 30), ofrece: ['corte', 'barba'], dias: {}, lleno: [] },
];

/* ---------- Clientes ---------- */
const clientes: Cliente[] = [
  { nombre: 'Andrés Felipe Mora', cel: '310 555 9917', correo: 'andresf.mora@correo.com', visitas: 12, dias: 0, total: 712000, barbero: 'santiago', seg: 'frecuente', noShows: 0, desde: new Date(2025, 1, 3), cumple: '14 de noviembre', pref: 'Fade bajo, barba corta perfilada.' },
  { nombre: 'Ricardo Salazar', cel: '311 555 0958', correo: 'rsalazar@correo.com', visitas: 15, dias: 0, total: 450000, barbero: 'mateo', seg: 'frecuente', noShows: 1, desde: new Date(2024, 7, 9), cumple: '2 de marzo', pref: 'Afeitado clásico, piel sensible.' },
  { nombre: 'Sara Ospina', cel: '316 555 4512', correo: 'sara.ospina@correo.com', visitas: 9, dias: 0, total: 315000, barbero: 'valentina', seg: 'frecuente', noShows: 0, desde: new Date(2025, 5, 14), cumple: '30 de octubre', pref: 'Corte texturizado, sin máquina arriba.' },
  { nombre: 'Daniel Ocampo', cel: '314 555 1166', correo: 'docampo@correo.com', visitas: 7, dias: 0, total: 385000, barbero: 'santiago', seg: 'frecuente', noShows: 0, desde: new Date(2026, 0, 20), cumple: '19 de julio', pref: 'Combo cada tres semanas.' },
  { nombre: 'Carlos Rendón', cel: '301 555 2034', correo: 'carlos.rendon@correo.com', visitas: 3, dias: 0, total: 105000, barbero: 'santiago', seg: 'recurrente', noShows: 0, desde: new Date(2026, 7, 8), cumple: 'Sin registrar', pref: 'Sin notas.' },
  { nombre: 'Juan Pablo Ortiz', cel: '300 555 7720', correo: 'jportiz@correo.com', visitas: 1, dias: 0, total: 55000, barbero: 'julian', seg: 'nuevo', noShows: 0, desde: HOY, cumple: '8 de enero', pref: 'Primera visita: combo.' },
  { nombre: 'Laura Giraldo', cel: '305 555 3402', correo: 'lauragiraldo@correo.com', visitas: 2, dias: 14, total: 24000, barbero: 'valentina', seg: 'nuevo', noShows: 0, desde: addDays(HOY, -35), cumple: '22 de abril', pref: 'Diseño de cejas.' },
  { nombre: 'Jorge Patiño', cel: '313 555 2290', correo: 'jpatino@correo.com', visitas: 4, dias: 77, total: 140000, barbero: 'mateo', seg: 'inactivo', noShows: 2, desde: new Date(2026, 2, 2), cumple: '5 de diciembre', pref: 'Barba con navaja.' },
  { nombre: 'Felipe Soto', cel: '320 555 6634', correo: 'felipesoto@correo.com', visitas: 6, dias: 90, total: 268000, barbero: 'andres', seg: 'inactivo', noShows: 0, desde: new Date(2025, 10, 4), cumple: '11 de septiembre', pref: 'Diseños en la nuca.' },
];

/* ---------- Agenda de hoy ---------- */
type FilaAgenda = [string, string, number, string, string, EstadoCita?, string?, string?, string?];
const filasHoy: FilaAgenda[] = [
  ['santiago', '9:00', 75, 'Daniel Ocampo', 'Combo', 'atendida', '314 555 1166', '7 visitas', ''],
  ['santiago', '10:15', 45, 'Sebastián Gil', 'Corte', 'atendida', '300 555 4821', '5 visitas', ''],
  ['santiago', '11:00', 30, 'Jorge Patiño', 'Barba', 'noasistio', '313 555 2290', '2 inasistencias', ''],
  ['santiago', '11:30', 90, 'Andrés Felipe Mora', 'Combo + cejas', 'atendida', '310 555 9917', '12 visitas', 'Quiero el fade un poco más bajo que la vez pasada.'],
  ['santiago', '13:00', 45, 'Carlos Rendón', 'Corte', 'atendida', '301 555 2034', '3 visitas', ''],
  ['santiago', '14:15', 45, 'Pablo Vélez', 'Corte', 'encurso', '317 555 3390', 'Primera visita', 'Vengo por recomendación de un amigo.'],
  ['santiago', '15:30', 75, 'Esteban Marín', 'Combo', 'confirmada', '312 555 7012', '4 visitas', 'Mantener el largo arriba, solo limpiar los lados.'],
  ['santiago', '16:45', 45, 'Felipe Aristizábal', 'Corte', 'confirmada', '319 555 8820', '6 visitas', ''],
  ['santiago', '17:30', 30, 'Juan Esteban Ríos', 'Barba', 'pendiente', '304 555 1478', '2 visitas', ''],
  ['santiago', '18:00', 75, 'Mauricio León', 'Combo', 'confirmada', '315 555 6044', '9 visitas', 'Tengo la piel sensible.'],
  ['mateo', '10:00', 45, 'Ricardo Salazar', 'Afeitado', 'atendida', '311 555 0958', '15 visitas', 'Piel sensible: bálsamo sin alcohol, por favor.'],
  ['mateo', '10:45', 30, 'Felipe Cardona', 'Barba'],
  ['mateo', '11:15', 75, 'Óscar Henao', 'Combo'],
  ['mateo', '12:30', 45, 'Mario Giraldo', 'Corte'],
  ['mateo', '13:15', 30, 'Kevin Arias', 'Barba', 'noasistio'],
  ['mateo', '15:00', 30, 'Simón Tabares', 'Barba', 'confirmada'],
  ['mateo', '16:00', 45, 'Nicolás Duque', 'Afeitado', 'confirmada'],
  ['mateo', '17:00', 75, 'Iván Quintero', 'Combo', 'pendiente'],
  ['mateo', '18:30', 45, 'Diego Bedoya', 'Corte', 'confirmada'],
  ['julian', '9:00', 45, 'Andrés Cifuentes', 'Corte'],
  ['julian', '9:45', 75, 'Juan Pablo Ortiz', 'Combo', 'atendida', '300 555 7720', 'Primera visita', ''],
  ['julian', '11:00', 45, 'Santiago Mejía', 'Corte'],
  ['julian', '12:00', 30, 'Martín Zuluaga', 'Barba', 'cancelada'],
  ['julian', '14:00', 45, 'Alejandro Ruiz', 'Corte'],
  ['julian', '15:00', 45, 'Camilo Restrepo', 'Corte', 'confirmada'],
  ['julian', '16:00', 75, 'David Londoño', 'Combo', 'confirmada'],
  ['julian', '17:15', 45, 'Jhon Fredy Gómez', 'Corte', 'pendiente'],
  ['valentina', '11:00', 45, 'Sara Ospina', 'Corte', 'atendida', '316 555 4512', '9 visitas', 'Corte texturizado, sin máquina arriba.'],
  ['valentina', '11:45', 15, 'Laura Pineda', 'Cejas'],
  ['valentina', '12:00', 45, 'Mateo Arango', 'Corte'],
  ['valentina', '13:00', 30, 'Juan José Toro', 'Barba'],
  ['valentina', '13:30', 45, 'Emilio Franco', 'Corte'],
  ['valentina', '16:15', 15, 'Laura Giraldo', 'Cejas', 'confirmada', '305 555 3402', '2 visitas', ''],
  ['valentina', '16:30', 45, 'Valeria Castro', 'Corte', 'confirmada'],
  ['valentina', '17:30', 30, 'Samuel Rojas', 'Barba', 'pendiente'],
  ['valentina', '18:00', 45, 'Manuela Ríos', 'Corte', 'cancelada'],
  ['valentina', '19:00', 45, 'Pedro Arcila', 'Corte', 'confirmada'],
];
const agendaHoy: Cita[] = filasHoy.map((r, i) => {
  const p = PAQ[r[4]];
  const tel = r[6] || '3' + (10 + ((i * 7) % 10)) + ' 555 ' + String(1000 + ((i * 2333) % 9000)).slice(0, 4);
  return {
    id: String(i), b: r[0], ini: toMin(r[1]), dur: r[2], cliente: r[3], paquete: r[4], items: p.items, largo: p.largo, precio: p.precio,
    est: r[5] || 'atendida', tel,
    hist: r[7] || (i % 3 === 0 ? 'Cliente nuevo' : 3 + (i % 9) + ' visitas'),
    nota: r[8] !== undefined ? r[8] : NOTAS[i % 4],
    origen: i % 4 === 1 ? 'Agendada por el administrador' : 'Agendada en línea',
  };
});

const bloqueos: Bloqueo[] = (
  [
    ['santiago', '13:45', 30, 'Almuerzo'],
    ['mateo', '9:00', 60, 'Fuera de turno'],
    ['mateo', '14:00', 60, 'Descanso'],
    ['julian', '13:00', 60, 'Almuerzo'],
    ['julian', '18:00', 120, 'Fuera de turno'],
    ['valentina', '9:00', 120, 'Fuera de turno'],
    ['valentina', '15:00', 60, 'Descanso'],
  ] as [string, string, number, string][]
).map((r) => ({ b: r[0], ini: toMin(r[1]), dur: r[2], label: r[3] }));

/* ---------- Ventas de hoy ---------- */
type FilaVenta = [string, string, string, string[], Venta['desc'], number, Venta['metodo']];
const filasVentas: FilaVenta[] = [
  ['10:16', 'Daniel Ocampo', 'santiago', ['combo'], 'no', 5000, 'tarjeta'],
  ['10:47', 'Ricardo Salazar', 'mateo', ['afeitado'], 'no', 3000, 'efectivo'],
  ['9:47', 'Andrés Cifuentes', 'julian', ['corte'], 'no', 2000, 'tarjeta'],
  ['11:02', 'Sebastián Gil', 'santiago', ['corte'], 'no', 2000, 'efectivo'],
  ['11:02', 'Juan Pablo Ortiz', 'julian', ['combo'], 'no', 5000, 'nequi'],
  ['11:17', 'Felipe Cardona', 'mateo', ['barba'], 'no', 0, 'nequi'],
  ['11:46', 'Sara Ospina', 'valentina', ['corte'], 'no', 3000, 'nequi'],
  ['11:47', 'Santiago Mejía', 'julian', ['corte'], 'no', 0, 'efectivo'],
  ['12:01', 'Laura Pineda', 'valentina', ['cejas'], 'no', 0, 'efectivo'],
  ['12:31', 'Óscar Henao', 'mateo', ['combo'], 'no', 5000, 'transferencia'],
  ['12:47', 'Mateo Arango', 'valentina', ['corte'], 'no', 2000, 'daviplata'],
  ['12:58', 'Andrés Felipe Mora', 'santiago', ['combo', 'cejas'], 'p10', 5000, 'nequi'],
  ['13:16', 'Mario Giraldo', 'mateo', ['corte'], 'no', 5000, 'efectivo'],
  ['13:30', 'Juan José Toro', 'valentina', ['barba'], 'no', 0, 'daviplata'],
  ['13:48', 'Carlos Rendón', 'santiago', ['corte'], 'no', 2000, 'tarjeta'],
  ['14:12', 'Emilio Franco', 'valentina', ['corte'], 'no', 0, 'nequi'],
  ['14:41', 'Alejandro Ruiz', 'julian', ['corte'], 'no', 2000, 'efectivo'],
];
const ventas: Venta[] = filasVentas
  .map((r) => mkVenta(servicios, { t: toMin(r[0]), cliente: r[1], b: r[2], items: r[3], desc: r[4], propina: r[5], metodo: r[6] }, 0))
  .sort((a, z) => a.t - z.t)
  .map((v, i) => ({ ...v, ticket: 131 + i }));

/* ---------- Estado mutable del "servidor" ---------- */
export const db = {
  servicios,
  barberos,
  clientes,
  agendaHoy,
  bloqueos,
  ventas,
  ticket: 148,
  bloqueosPersonales: [
    { id: 'bp1', b: 'santiago', d: addDays(HOY, 6), a: 840, z: 960, m: 'Cita médica' },
    { id: 'bp2', b: 'santiago', d: addDays(HOY, 8), a: 480, z: 600, m: 'Diligencia personal' },
  ] as BloqueoPersonal[],
  /** Agendas generadas para días distintos a hoy (clave yyyy-mm-dd) */
  agendaCache: {} as Record<string, Cita[]>,
};
