/**
 * Cliente HTTP: el ÚNICO archivo de la app que sabe usar `fetch`.
 *
 * Todo lo demás (pantallas, hooks, contextos) llama a funciones con nombre de
 * negocio en `src/api/*.ts`. Si cambia la forma de hablar con el servidor, se
 * cambia aquí y nada más.
 *
 * El backend (Rust/Axum) vive en `/api/v1`, responde JSON en snake_case y sus
 * errores en Problem Details (RFC 9457). La referencia completa de rutas,
 * perfiles y códigos está en `docs/diseno/api.md` del repositorio del backend.
 *
 * Mismo dominio, sin CORS
 * -----------------------
 * El sitio y la API comparten dominio: en producción el proxy (Traefik) manda
 * `/api/*` y `/media/*` al backend y el resto a Next. Por eso la URL base es
 * vacía por defecto (rutas relativas) y la sesión viaja sola en la cookie
 * `__Host-sesion` (HttpOnly, Secure, SameSite=Strict): el front nunca ve ni
 * guarda un token. El backend no tiene CORS, así que apuntar
 * `NEXT_PUBLIC_API_URL` a OTRO dominio solo sirve para depurar lecturas
 * públicas: el navegador no enviaría la cookie.
 *
 * En desarrollo, `next.config.ts` reenvía `/api/*` y `/media/*` al backend
 * de la variable `DIAMANTE_API` (el desplegado o uno local). Ese backend debe
 * tener el origen del front en `DIAMANTE_ORIGENES` (`http://localhost:3000`):
 * toda petición que modifica datos exige que el encabezado `Origin` (lo pone
 * el navegador) sea uno permitido; si no, responde `403 origen_invalido`.
 * Detalles en `./api.md`, sección 2.
 */

function sinBarraFinal(url: string): string {
  return url.replace(/\/+$/, '');
}

// Next reemplaza `process.env.NEXT_PUBLIC_…` por su valor al compilar: debe
// escribirse así, con notación de punto, para que funcione en el navegador.
const SERVIDOR = sinBarraFinal((process.env.NEXT_PUBLIC_API_URL ?? '').trim());
const API = `${SERVIDOR}/api/v1`;

/** Base efectiva de la API (útil para depurar a dónde apunta la app). */
export function getBaseUrl(): string {
  return API;
}

/**
 * URL utilizable de una ruta que devuelve el servidor: fotos
 * (`/media/publico/…`), descargas firmadas (`/api/v1/archivos/…`) o la de un
 * PDF. Las absolutas se devuelven tal cual.
 */
export function urlDelServidor(ruta: string): string {
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${SERVIDOR}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
}

/** Un error de campo (`422 validacion`): `{ campo: "cliente_nuevo.celular", mensaje }`. */
export interface ErrorDeCampo {
  campo: string;
  mensaje: string;
}

/**
 * Códigos de error del backend (`codigo` en Problem Details). Las pantallas
 * deberían ramificar por estos, no por el texto. La lista no es cerrada: un
 * código nuevo del servidor llega igual, como texto.
 */
export type CodigoError =
  // 400 / 401 / 403 / 404 (cualquier ruta)
  | 'solicitud_invalida'
  | 'no_autenticado'
  | 'credenciales_invalidas'
  | 'firma_invalida'
  | 'prohibido'
  | 'origen_invalido'
  | 'acceso_suspendido'
  | 'no_encontrado'
  // 409: conflictos de cada módulo
  | 'conflicto_horario' // agenda: la hora ya no está libre (trae `alternativas`)
  | 'reserva_bloqueada' // agenda: el cliente superó el umbral de inasistencias
  | 'estado_invalido' // agenda, clientes, ventas: la acción no aplica al estado actual
  | 'cita_ya_cobrada'
  | 'cierre_existente'
  | 'correo_en_uso'
  | 'celular_en_uso'
  | 'documento_en_uso' // barberos: número de documento repetido
  | 'nombre_en_uso' // catálogo: servicio con el mismo nombre
  | 'no_es_combo'
  | 'fecha_ocupada' // negocio: ya hay un día especial esa fecha
  | 'barbero_retirado'
  | 'ausencia_solapada'
  | 'bloqueo_solapado'
  | 'planilla_repetida'
  | 'ultimo_administrador'
  | 'no_puede_desactivarse'
  // 410 / 422: verificación y enlaces
  | 'enlace_vencido'
  | 'codigo_vencido'
  | 'codigo_incorrecto'
  | 'comprobante_vencido'
  | 'validacion'
  // 413 / 429 / 503 / 500
  | 'archivo_demasiado_grande'
  | 'cuerpo_demasiado_grande'
  | 'demasiados_intentos'
  | 'pdf_no_disponible'
  | 'error_interno'
  // Solo del front
  /** Sin respuesta del servidor (caído, sin red, URL equivocada). */
  | 'sin_conexion'
  /** `408`: el servidor cortó la petición (30 s; 120 s los reportes). */
  | 'tiempo_agotado'
  /** La respuesta no era JSON (p. ej., la página de error de un proxy). */
  | 'respuesta_invalida'
  // Cualquier otro texto, sin perder el autocompletado de los de arriba.
  | (string & Record<never, never>);

/**
 * Error con el mensaje legible del servidor.
 *
 * - `message`: el `detail` del servidor (o su `title`), listo para mostrar.
 * - `status`: estado HTTP (0 si no hubo respuesta).
 * - `codigo`: el caso (ver `CodigoError`).
 * - `errores`: los de cada campo en un `422`; `errorDe('celular')` da el texto
 *   para pintar debajo del campo.
 * - `alternativas`: en `409 conflicto_horario`, horas libres cercanas (ISO).
 * - `reintentarEn`: en `429`, segundos que pide esperar el servidor (`Retry-After`).
 * - `idSolicitud`: el `x-request-id`, para buscar un `500` en los logs.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly codigo: CodigoError;
  readonly titulo?: string;
  readonly errores: ErrorDeCampo[];
  readonly alternativas: string[];
  readonly reintentarEn?: number;
  readonly idSolicitud?: string;

  constructor(
    message: string,
    status: number,
    codigo: CodigoError,
    extra: {
      titulo?: string;
      errores?: ErrorDeCampo[];
      alternativas?: string[];
      reintentarEn?: number;
      idSolicitud?: string;
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.titulo = extra.titulo;
    this.errores = extra.errores ?? [];
    this.alternativas = extra.alternativas ?? [];
    this.reintentarEn = extra.reintentarEn;
    this.idSolicitud = extra.idSolicitud;
  }

  /** El mensaje del servidor para ese campo, si lo hay (`422 validacion`). */
  errorDe(campo: string): string | undefined {
    return this.errores.find((e) => e.campo === campo)?.mensaje;
  }

  /** Los errores de campo como objeto `{ campo: mensaje }` (el primero de cada uno). */
  erroresPorCampo(): Record<string, string> {
    const porCampo: Record<string, string> = {};
    for (const { campo, mensaje } of this.errores) {
      if (!(campo in porCampo)) porCampo[campo] = mensaje;
    }
    return porCampo;
  }
}

/** ¿Es un `ApiError` con ese código? Atajo para los `catch` de las pantallas. */
export function esErrorApi(error: unknown, codigo?: CodigoError): error is ApiError {
  return error instanceof ApiError && (codigo === undefined || error.codigo === codigo);
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  /** Por defecto: GET sin `body`, POST con `body`. PUT/PATCH/DELETE hay que pedirlos. */
  method?: HttpMethod;
  /**
   * Para cancelar la petición. Las búsquedas cancelan la anterior cuando el
   * usuario cambia el texto, así una respuesta vieja nunca pisa a la nueva.
   */
  signal?: AbortSignal;
}

type ValorParametro = string | number | boolean | null | undefined;

/**
 * El path con su query string, omitiendo los valores vacíos:
 * `conParametros('/clientes', { q: 'ana', pagina: 2 })` -> `/clientes?q=ana&pagina=2`.
 * `false` sí se envía (`incluir_anuladas=false`); `null`, `undefined` y `''` no.
 */
export function conParametros(path: string, parametros: Record<string, ValorParametro>): string {
  const query = Object.entries(parametros)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`)
    .join('&');

  return query ? `${path}?${query}` : path;
}

/** Un segmento de ruta seguro (tokens de enlaces, nombres de archivo). */
export function segmento(valor: string | number): string {
  return encodeURIComponent(String(valor));
}

/**
 * Hace una petición JSON a la API y devuelve la respuesta ya tipada.
 *
 * - La cookie de sesión viaja sola (`credentials: 'include'`).
 * - `204` y `202` sin cuerpo devuelven `undefined` (tipar como `void`).
 * - Si el servidor responde con error, lanza `ApiError` con SU mensaje.
 *
 * @param path Ruta relativa a `/api/v1`, empezando por "/". Ej: "/agenda/citas/3".
 * @param body Cuerpo JSON. Solo se envía si se pasa (aunque sea `{}`).
 */
export async function request<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const method: HttpMethod = options?.method ?? (body === undefined ? 'GET' : 'POST');
  return enviar<T>(path, {
    method,
    headers: {
      Accept: 'application/json, application/problem+json',
      // Solo se declara JSON cuando se envía cuerpo: un GET no lo necesita.
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options?.signal,
  });
}

/**
 * Envía un formulario `multipart/form-data` (fotos, documentos, soportes).
 * El navegador pone el `Content-Type` con su `boundary`: no hay que fijarlo.
 */
export async function enviarFormulario<T>(
  path: string,
  formulario: FormData,
  options?: Pick<RequestOptions, 'signal'>,
): Promise<T> {
  return enviar<T>(path, {
    method: 'POST',
    headers: { Accept: 'application/json, application/problem+json' },
    body: formulario,
    signal: options?.signal,
  });
}

/** Un archivo descargado (PDF): el contenido y el nombre que propone el servidor. */
export interface Descarga {
  blob: Blob;
  nombre: string;
}

/**
 * Descarga un archivo (los PDF de reportes). Para guardarlo:
 * `const url = URL.createObjectURL(blob)` en un `<a download={nombre}>`.
 */
export async function descargar(path: string, options?: Pick<RequestOptions, 'signal'>): Promise<Descarga> {
  const url = `${API}${path}`;
  const response = await conectar(url, {
    method: 'GET',
    headers: { Accept: 'application/pdf, application/problem+json' },
    signal: options?.signal,
  }, options?.signal);
  if (!response.ok) await lanzarError(response, path);
  const blob = await response.blob();
  return { blob, nombre: nombreDeArchivo(response.headers.get('Content-Disposition'), path) };
}

async function enviar<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${API}${path}`;
  const response = await conectar(url, init, init.signal ?? undefined);
  if (!response.ok) await lanzarError(response, path);

  // Se lee como texto primero: un 204/202 no trae cuerpo y un proxy caído
  // puede responder HTML; `response.json()` reventaría sin dejar decidir aquí.
  const text = await response.text().catch(() => '');
  if (text.trim() === '') return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(`Respuesta inválida del servidor en ${path}`, response.status, 'respuesta_invalida');
  }
}

async function conectar(url: string, init: RequestInit, signal: AbortSignal | undefined): Promise<Response> {
  try {
    return await fetch(url, { ...init, credentials: 'include', cache: 'no-store' });
  } catch (cause) {
    // Cancelada a propósito (llegó una búsqueda más nueva): quien la canceló la ignora.
    if (signal?.aborted) throw cause;
    // `fetch` solo falla así cuando no hubo respuesta: servidor caído, sin red o URL equivocada.
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', 0, 'sin_conexion');
  }
}

/** Convierte una respuesta de error (Problem Details o lo que llegue) en `ApiError`. */
async function lanzarError(response: Response, path: string): Promise<never> {
  const text = await response.text().catch(() => '');
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = text.trim() === '' ? {} : JSON.parse(text);
    if (parsed !== null && typeof parsed === 'object') data = parsed as Record<string, unknown>;
  } catch {
    // No es JSON (p. ej. la página HTML de un proxy caído): se reporta con el estado.
  }

  const texto = (clave: string): string | undefined => {
    const valor = data[clave];
    return typeof valor === 'string' && valor.trim() !== '' ? valor : undefined;
  };
  const codigo = texto('codigo') ?? codigoPorEstado(response.status);
  const titulo = texto('title');
  const mensaje = texto('detail') ?? titulo ?? mensajePorEstado(response.status, path);
  const retryAfter = Number(response.headers.get('Retry-After'));

  throw new ApiError(mensaje, response.status, codigo, {
    titulo,
    errores: Array.isArray(data['errores'])
      ? (data['errores'] as unknown[]).filter(
          (e): e is ErrorDeCampo =>
            e !== null && typeof e === 'object' && typeof (e as ErrorDeCampo).campo === 'string',
        )
      : [],
    alternativas: Array.isArray(data['alternativas'])
      ? (data['alternativas'] as unknown[]).filter((a): a is string => typeof a === 'string')
      : [],
    reintentarEn: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    idSolicitud: response.headers.get('x-request-id') ?? undefined,
  });
}

/** Si el error no trae `codigo` (p. ej. lo respondió el proxy), se deduce del estado. */
function codigoPorEstado(status: number): CodigoError {
  if (status === 400) return 'solicitud_invalida';
  if (status === 401) return 'no_autenticado';
  if (status === 403) return 'prohibido';
  if (status === 404) return 'no_encontrado';
  if (status === 408) return 'tiempo_agotado';
  if (status === 413) return 'archivo_demasiado_grande';
  if (status === 422) return 'validacion';
  if (status === 429) return 'demasiados_intentos';
  if (status >= 500) return 'error_interno';
  return 'respuesta_invalida';
}

function mensajePorEstado(status: number, path: string): string {
  if (status === 408) return 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
  if (status === 413) return 'El archivo supera el tamaño máximo permitido.';
  if (status === 429) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (status === 502 || status === 503 || status === 504) return 'El servidor no está disponible en este momento.';
  return `Error ${status} al llamar ${path}`;
}

/** `attachment; filename="resumen-2026-11.pdf"` -> `resumen-2026-11.pdf`. */
function nombreDeArchivo(disposicion: string | null, path: string): string {
  const utf8 = disposicion?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      // Mal codificado: se usa el nombre simple.
    }
  }
  const simple = disposicion?.match(/filename="?([^";]+)"?/i)?.[1];
  return simple ?? (path.split('?')[0] ?? '').split('/').pop() ?? 'descarga';
}
