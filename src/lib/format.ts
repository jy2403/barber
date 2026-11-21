/* =========================================================
   Utilidades de fechas, números y texto (es-CO)
   ========================================================= */

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIAS_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const NOW = new Date();
export const HOY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
/** Hora fija de la demostración para la agenda del día (2:50 p. m.) */
export const AHORA_DEMO = 14 * 60 + 50;

/* ---------- Fechas ---------- */
export const pad = (n: number) => (n < 10 ? '0' : '') + n;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const diffDays = (a: Date, b: Date) =>
  Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() - new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 864e5);
export const iso = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const fromIso = (s?: string | null): Date | null => {
  const p = String(s || '').split('-').map(Number);
  return p.length === 3 && p[0] ? new Date(p[0], p[1] - 1, p[2]) : null;
};
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const fLarga = (d: Date) => DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
export const fLargaA = (d: Date) => fLarga(d) + ' de ' + d.getFullYear();
export const fMedia = (d: Date) => DIAS_C[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_C[d.getMonth()];
export const fDM = (d: Date) => d.getDate() + ' ' + MESES_C[d.getMonth()];
export const fDMA = (d: Date) => fDM(d) + ' ' + d.getFullYear();
export const fDeMes = (d: Date) => d.getDate() + ' de ' + MESES[d.getMonth()];
export const fMesA = (d: Date) => MESES[d.getMonth()] + ' de ' + d.getFullYear();
export const relDia = (d: Date) => {
  const k = diffDays(d, HOY);
  return k === 0 ? 'hoy' : k === 1 ? 'mañana' : k === -1 ? 'ayer' : fMedia(d);
};
export const hora = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  if (h === 12 && m === 0) return '12:00 m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + pad(m) + ' ' + (h < 12 ? 'a. m.' : 'p. m.');
};
export const horaH = (h: number) => (h === 12 ? '12 m.' : (h % 12 || 12) + ' ' + (h < 12 ? 'a. m.' : 'p. m.'));
export const toMin = (s: string) => {
  const p = String(s).split(':');
  return Number(p[0]) * 60 + Number(p[1]);
};
export const durTxt = (t: number) => {
  const h = Math.floor(t / 60);
  const m = t % 60;
  return m ? h + ' h ' + m + ' min' : h + ' h';
};
export const generado = () => pad(HOY.getDate()) + '/' + pad(HOY.getMonth() + 1) + '/' + HOY.getFullYear() + ' · ' + hora(NOW.getHours() * 60 + NOW.getMinutes());

/* ---------- Números y texto ---------- */
export const miles = (n: number) => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const cop = (n: number) => (n < 0 ? '−' : '') + '$' + miles(n);
export const copM = (n: number) => '$' + (Math.round(n / 1e5) / 10).toFixed(1).replace('.', ',') + ' M';
export const pct = (n: number, d = 0) => (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace('.', ',') + ' %';
export const ini = (n: string) => String(n).split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();
export const norm = (s: string) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.\s]/g, '');
export const digits = (s?: string | null) => String(s || '').replace(/\D/g, '');
export const fTel = (s: string) => {
  const d = digits(s);
  return d.length === 10 ? d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6) : s;
};
export const plural = (n: number, a: string, b: string) => n + ' ' + (n === 1 ? a : b);
export const ticketTxt = (n: number) => String(n).padStart(4, '0');
