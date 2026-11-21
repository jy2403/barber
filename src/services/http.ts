/* =========================================================
   Cliente del backend
   ---------------------------------------------------------
   Hoy resuelve contra el backend simulado en memoria
   (`./mock/db.ts`). Para conectar una API real, reemplaza el
   cuerpo de cada función de servicio por `apiFetch(...)`.
   ========================================================= */

/** Latencia simulada en ms (configurable con NEXT_PUBLIC_API_DELAY) */
const DELAY = Number(process.env.NEXT_PUBLIC_API_DELAY || 0);

export class ApiError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * Ejecuta un "endpoint" del backend simulado de forma asíncrona y devuelve
 * una copia de la respuesta (igual que llegaría serializada por la red).
 */
export function respond<T>(handler: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      try {
        resolve(structuredClone(handler()));
      } catch (e) {
        reject(e);
      }
    };
    if (DELAY > 0) setTimeout(run, DELAY);
    else queueMicrotask(run);
  });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/** Llamada HTTP real, para cuando exista el backend */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return res.json() as Promise<T>;
}
