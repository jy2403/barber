/**
 * Sesión del personal (módulo `identidad`).
 *
 * La sesión vive en la cookie `__Host-sesion` (HttpOnly): el front nunca ve el
 * token. Para saber si hay sesión al cargar la app, llame `consultarSesion()`:
 * un `401 no_autenticado` significa «a la pantalla de acceso».
 *
 * Endpoints:
 * - POST   /auth/sesion { correo, contrasena, recordarme } (Público) -> Sesion + cookie
 *   | 401 credenciales_invalidas (genérico, también con la cuenta bloqueada 15 min tras 5 fallos)
 *   | 403 acceso_suspendido (cuenta desactivada, barbero suspendido o retirado)
 *   | 429 demasiados_intentos (10 por IP cada 15 min)
 * - GET    /auth/sesion (Personal) -> Sesion | 401 no_autenticado
 * - DELETE /auth/sesion (Personal) -> 204 (borra la cookie)
 * - POST   /auth/activacion { token, contrasena } (Público) -> 204
 *   | 410 enlace_vencido | 422 validacion (contraseña débil)
 *   El enlace del correo es `/acceso/activar#token=…`: el token va en el
 *   fragmento (lea `window.location.hash`), así nunca llega a los logs.
 * - POST   /auth/recuperacion { correo } (Público) -> 202 siempre, exista o no la cuenta
 * - POST   /auth/recuperacion/confirmar { token, contrasena } (Público) -> 204 | 410 enlace_vencido
 * - PUT    /auth/contrasena { actual, nueva } (Personal) -> 204; cierra las demás sesiones
 *   | 422 validacion (la actual no coincide o la nueva es débil)
 */

import { request } from './client';
import type { CredencialesDto, Sesion } from './tipos';

export function iniciarSesion(credenciales: CredencialesDto): Promise<Sesion> {
  return request<Sesion>('/auth/sesion', credenciales);
}

export function consultarSesion(signal?: AbortSignal): Promise<Sesion> {
  return request<Sesion>('/auth/sesion', undefined, { signal });
}

export function cerrarSesion(): Promise<void> {
  return request<void>('/auth/sesion', undefined, { method: 'DELETE' });
}

/** Crea la contraseña desde la invitación (`/acceso/activar#token=…`). */
export function activarCuenta(token: string, contrasena: string): Promise<void> {
  return request<void>('/auth/activacion', { token, contrasena });
}

/** «Olvidé mi contraseña»: siempre responde bien, para no revelar qué correos existen. */
export function pedirRecuperacion(correo: string): Promise<void> {
  return request<void>('/auth/recuperacion', { correo });
}

export function confirmarRecuperacion(token: string, contrasena: string): Promise<void> {
  return request<void>('/auth/recuperacion/confirmar', { token, contrasena });
}

export function cambiarContrasena(actual: string, nueva: string): Promise<void> {
  return request<void>('/auth/contrasena', { actual, nueva }, { method: 'PUT' });
}

/** El token del enlace de activación o recuperación (`#token=…`), si lo hay. */
export function tokenDelEnlace(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return token && token.trim() !== '' ? token : null;
}
