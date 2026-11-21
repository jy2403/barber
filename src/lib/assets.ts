export const EMBLEMA = '/img/emblema.svg';
export const HERO = '/img/hero-despues.svg';

const FOTOS = new Set(['santiago', 'mateo', 'julian', 'valentina', 'andres', 'david']);

/** Foto del barbero; si no tiene, se usa el emblema de la marca */
export const fotoUrl = (id: string) => (FOTOS.has(id) ? '/img/barberos/' + id + '.svg' : EMBLEMA);
