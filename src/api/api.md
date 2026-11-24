# API del backend: guía para el frontend

Qué endpoints existen, qué función de esta carpeta llama a cada uno, qué devuelve y qué errores hay
que manejar. Los tipos exactos de cada respuesta están en [`tipos.ts`](./tipos.ts); la referencia
completa del backend (reglas de negocio, requisitos) es `docs/diseno/api.md` en el repositorio del
backend, y una prueba del backend verifica que sus rutas y códigos de error coincidan con el código.

---

## 1. Cómo se usa

Todo se importa desde `@/api`. Ninguna pantalla usa `fetch`: solo [`client.ts`](./client.ts).

```tsx
import { getTablero, cancelarCita, esErrorApi, type Tablero } from '@/api';

useEffect(() => {
  const control = new AbortController();
  getTablero('2026-11-23', control.signal).then(setTablero).catch(mostrarError);
  return () => control.abort(); // al desmontar o cambiar la fecha, se cancela la anterior
}, []);

try {
  const cita = await cancelarCita(41, { motivo: 'solicitud_cliente', avisar_cliente: true });
} catch (e) {
  if (esErrorApi(e, 'estado_invalido')) avisar(e.message); // «La cita ya fue atendida.»
  else throw e;
}
```

- Cada función devuelve una `Promise` con la respuesta ya tipada. Las que responden `204` o `202`
  sin cuerpo devuelven `void`.
- Las consultas aceptan un `AbortSignal` al final: úselo en búsquedas mientras se escribe, para que
  una respuesta vieja no pise la nueva. Una petición cancelada rechaza con un `AbortError` (no es
  un `ApiError`): ignórela.
- Si el servidor responde con error, la promesa rechaza con un `ApiError` (sección 5).

## 2. Conexión

- **Producción:** el sitio y la API comparten dominio. El proxy (Traefik) manda `/api/*` y
  `/media/*` al backend y el resto a Next. No hay que configurar nada: las rutas son relativas.
- **Sin CORS:** el backend no acepta peticiones desde otro dominio. `NEXT_PUBLIC_API_URL` existe
  para casos raros (depurar lecturas públicas); déjela vacía.
- **Desarrollo:** `next.config.ts` trae un proxy que se activa con la variable `DIAMANTE_API`:
  Next reenvía `/api/*` y `/media/*` a ese backend. El navegador solo habla con Next (un solo
  origen), así funcionan la cookie de sesión y la verificación de origen sin abrir CORS.

  ```bash
  # Contra el servidor desplegado (preproducción):
  DIAMANTE_API=https://back-diamante.mania-agent.online npm run dev
  # Contra un backend local (`docker compose up` en el repositorio del backend):
  DIAMANTE_API=http://localhost:8080 npm run dev
  ```

  También puede ponerla en `.env.local` (`DIAMANTE_API=…`), que no se sube a git. En producción
  no se define: allí el proxy del servidor manda esas rutas al backend.

- **El origen del front debe estar permitido:** toda petición que modifica datos (POST, PUT,
  PATCH, DELETE) exige que el encabezado `Origin`, que pone el navegador, sea el de la URL pública
  del backend o uno de su variable `DIAMANTE_ORIGENES`. Si no, responde `403 origen_invalido`.
  - **Servidor desplegado:** su `DIAMANTE_ORIGENES` (en Dokploy) debe incluir
    `http://localhost:3000`. Si alguien corre Next en otro puerto, agréguelo separado por coma.
  - **Backend local:** en su `docker-compose.override.yml` la URL pública todavía es
    `http://localhost:4321` (era el puerto de Astro). Corra Next en ese puerto
    (`npm run dev -- -p 4321`) o cambie `DIAMANTE_URL_PUBLICA` a `http://localhost:3000`.
- **Ojo con el servidor desplegado:** envía WhatsApp **de verdad** por Meta. Un cliente creado con
  un celular inventado le escribe a una persona real. Para probar con el servidor desplegado use
  su propio celular; para el día a día, el backend local, que solo simula los WhatsApp.
- **Tiempo máximo del proxy:** en desarrollo, Next corta las peticiones reenviadas a los 30 s. Un
  PDF grande puede pasar de ahí.
- **Cookie segura en `localhost`:** la sesión usa una cookie `Secure`. Chrome y Firefox la aceptan
  en `http://localhost`; Safari no. Pruebe el panel en desarrollo con Chrome o Firefox.

### Páginas que el backend enlaza

El backend arma estos enlaces con su URL pública: el front debe tener esas páginas.

| Página | Llega por | Qué hace |
|---|---|---|
| `/acceso/activar#token=…` | Correo de invitación (administradores y barberos con acceso al panel) | Pide la contraseña nueva y llama `activarCuenta(tokenDelEnlace(location.hash), contrasena)`. |
| `/acceso/restablecer#token=…` | Correo de «Olvidé mi contraseña» | `confirmarRecuperacion(tokenDelEnlace(location.hash), contrasena)`. |
| `/cita/{token}` | WhatsApp de confirmación, cambio de hora o aviso de reprogramación | Gestión de la cita por el cliente, sin sesión (sección 8.2). |

El token va en el **fragmento** (`#token=`) para que no llegue a los logs del servidor: léalo de
`window.location.hash` en el navegador, nunca de los parámetros de la ruta.

## 3. Sesión y perfiles

| Perfil | Cómo se identifica | Qué puede |
|---|---|---|
| Público | Nada | `/publico/*`, iniciar sesión, activar y recuperar la cuenta. |
| Cliente | Código de WhatsApp (reserva) o token de su enlace (gestión) | Reservar y gestionar **su** cita. No tiene cuenta ni contraseña. |
| Barbero | Sesión, `rol: 'barbero'` | Solo lo suyo: su perfil, horario, bloqueos, citas, ventas y reporte. Pedir algo de otro barbero responde `404`, como si no existiera. |
| Administrador | Sesión, `rol: 'administrador'` | Todo. |

- `iniciarSesion({ correo, contrasena, recordarme })` deja la cookie `__Host-sesion` (HttpOnly: JS
  no la ve) y devuelve `{ usuario: { id, rol, nombre, correo }, panel }`, donde `panel` es
  `'/admin'` o `'/barbero'`: redirija ahí.
- La sesión dura 12 horas sin actividad, o 30 días con «Recordarme».
- Al cargar el panel, `consultarSesion()` dice si hay sesión. Si alguna llamada rechaza con
  `401 no_autenticado` (la sesión venció o la cerraron desde otro lado), vaya a la pantalla de
  acceso.
- `cambiarContrasena(actual, nueva)` cierra las **demás** sesiones del usuario.

## 4. Formato de los datos

| Dato | En JSON | Ejemplo |
|---|---|---|
| Nombres de campos | `snake_case`, tal cual (no se convierten) | `venta_neta`, `barbero_id` |
| Dinero | Pesos enteros (`Pesos`) | `35000`; nunca decimales |
| Porcentaje | Número | `50`, `12.5` |
| Fecha | `AAAA-MM-DD`, hora de Bogotá (`Fecha`) | `"2026-11-23"` |
| Instante | ISO 8601 con zona (`Instante`) | `"2026-11-23T15:30:00-05:00"` |
| Hora del día | El servidor responde `HH:MM:SS` y acepta `HH:MM` (`Hora`) | `"15:30:00"` |
| Mes | `AAAA-MM` | `"2026-11"` |
| Día de la semana | `1` = lunes … `7` = domingo | |
| Ids | Números | `41` |
| Fotos y descargas | Rutas relativas del servidor: páselas por `urlDelServidor()` | `"/media/publico/9f3a….webp"` |
| Paginación | `Pagina<T>`: `{ datos, pagina, por_pagina, total }`; `por_pagina` máximo 100 | |

- `null` significa «el servidor lo manda vacío». Un campo opcional (`?` en `tipos.ts`) puede no
  venir; por ejemplo, `cliente` y `nota` de una cita no vienen en la vista pública.
- Las horas que se muestran ya vienen como texto en algunas respuestas (`hora: "3:30 p. m."` en
  las horas libres): úselas tal cual.
- Los valores posibles de cada estado están como listas en `tipos.ts` (`ESTADOS_CITA`,
  `SEGMENTOS_CLIENTE`, `MOTIVOS_CANCELACION`…): sirven para los `<select>`.

## 5. Errores

Toda llamada que falla rechaza con un `ApiError`:

| Campo | Qué trae |
|---|---|
| `message` | El texto del servidor, listo para mostrar («Otra persona acaba de reservar…»). |
| `status` | Estado HTTP. `0` si no hubo respuesta (sin conexión). |
| `codigo` | El caso: ramifique por este, nunca por el texto. |
| `errores` / `errorDe(campo)` / `erroresPorCampo()` | En `422 validacion`: el mensaje de cada campo (`cliente_nuevo.celular`, `pagos[1].monto`) para pintarlo debajo de su input. |
| `alternativas` | En `409 conflicto_horario`: instantes libres cercanos para ofrecer. |
| `reintentarEn` | En `429`: segundos que hay que esperar. |
| `idSolicitud` | El `x-request-id`: si sale un `500`, ese id ubica el error en los logs. |

El servidor responde en *Problem Details* (RFC 9457):

```json
{
  "type": "/errores/conflicto-horario",
  "title": "La hora ya no está disponible",
  "status": 409,
  "codigo": "conflicto_horario",
  "detail": "Otra persona acaba de reservar el jueves 19 de noviembre a las 3:30 p. m. con Santiago.",
  "errores": [],
  "alternativas": ["2026-11-19T16:45:00-05:00", "2026-11-19T17:30:00-05:00"]
}
```

Qué hacer con cada código:

| Código | Estado | Qué hacer en la pantalla |
|---|---|---|
| `validacion` | 422 | Pintar `errorDe(campo)` debajo de cada campo. |
| `solicitud_invalida` | 400 | Es un error del front: un campo que falta o sobra, o un tipo equivocado. El `message` dice cuál. |
| `no_autenticado` | 401 | Ir a la pantalla de acceso. |
| `credenciales_invalidas` | 401 | «Correo o contraseña incorrectos». Es genérico a propósito: también sale con la cuenta bloqueada 15 min tras 5 fallos. |
| `acceso_suspendido` | 403 | La cuenta existe pero no puede entrar (desactivada, barbero suspendido o retirado). |
| `prohibido` | 403 | El perfil no puede hacer eso: no muestre el botón. |
| `origen_invalido` | 403 | Configuración: el origen del front no está permitido (sección 2). |
| `no_encontrado` | 404 | No existe, o es de otro barbero. |
| `conflicto_horario` | 409 | La hora se ocupó: recargar las horas y ofrecer `alternativas`. |
| `estado_invalido` | 409 | La acción no aplica al estado actual: mostrar `message` y recargar. |
| `cita_ya_cobrada`, `cierre_existente`, `correo_en_uso`, `celular_en_uso`, `documento_en_uso`, `nombre_en_uso`, `fecha_ocupada`, `ausencia_solapada`, `bloqueo_solapado`, `planilla_repetida`, `barbero_retirado`, `no_es_combo`, `ultimo_administrador`, `no_puede_desactivarse` | 409 | Mostrar `message`. Cada uno está en el módulo que lo produce (sección 6). |
| `enlace_vencido` | 410 | El enlace (activación, recuperación, gestión de cita o descarga) venció o ya se usó. |
| `codigo_incorrecto` | 422 | El código de WhatsApp no coincide; quedan intentos. |
| `codigo_vencido` | 410 | El código venció (10 min) o se agotaron los 5 intentos: pedir otro. |
| `comprobante_vencido` | 410 | El comprobante ya se usó o venció: volver a verificar el celular. |
| `reserva_bloqueada` | 403 | El cliente tiene demasiadas inasistencias: la reserva en línea no está permitida. Mostrar `message` (dice cómo comunicarse). |
| `archivo_demasiado_grande` | 413 | El archivo pasa del límite (foto 5 MB; documentos 10 MB). |
| `demasiados_intentos` | 429 | Mostrar la espera con `reintentarEn`. |
| `pdf_no_disponible` | 503 | El generador de PDF no responde: reintentar más tarde. |
| `tiempo_agotado` | 408 | El servidor cortó la petición (30 s; 120 s los reportes). |
| `error_interno` | 500 | «Algo falló»; reportar con `idSolicitud`. |
| `sin_conexion` | 0 | Sin red o servidor caído. |

## 6. Endpoints por módulo

Columna «Quién»: **P** público, **B** barbero (solo lo suyo), **A** administrador. Las rutas son
relativas a `/api/v1`.

### Sesión (`auth.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `iniciarSesion(credenciales)` | `POST /auth/sesion` | P | `Sesion` | `401 credenciales_invalidas`, `403 acceso_suspendido`, `429` |
| `consultarSesion()` | `GET /auth/sesion` | B, A | `Sesion` | `401 no_autenticado` |
| `cerrarSesion()` | `DELETE /auth/sesion` | B, A | `void` | |
| `activarCuenta(token, contrasena)` | `POST /auth/activacion` | P | `void` | `410 enlace_vencido`, `422` (contraseña débil) |
| `pedirRecuperacion(correo)` | `POST /auth/recuperacion` | P | `void`; siempre `202`, exista o no la cuenta | `429` |
| `confirmarRecuperacion(token, contrasena)` | `POST /auth/recuperacion/confirmar` | P | `void` | `410 enlace_vencido`, `422` |
| `cambiarContrasena(actual, nueva)` | `PUT /auth/contrasena` | B, A | `void` | `422` (la actual no coincide o la nueva es débil) |
| `tokenDelEnlace(location.hash)` | | | El token de `#token=…`, o `null` | |

### Administradores (`administradores.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `listarAdministradores()` | `GET /administradores` | A | `Administrador[]` | |
| `invitarAdministrador({ correo, nombre })` | `POST /administradores` | A | `{ id }` (`201`) y envía la invitación | `409 correo_en_uso` |
| `cambiarEstadoAdministrador(id, activo)` | `PATCH /administradores/{id}` | A | `void` | `409 ultimo_administrador`, `409 no_puede_desactivarse` |

### Negocio (`negocio.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `getNegocio()` / `actualizarNegocio(datos)` | `GET` / `PUT /negocio` | A | `DatosNegocio` | |
| `getHorarioAtencion()` | `GET /negocio/horario-atencion` | B, A | `HorarioDia[]` (7 días, calculado de los horarios del equipo) | |
| `listarDiasEspeciales({ desde, hasta })` | `GET /negocio/dias-especiales` | B, A | `DiaEspecial[]` | |
| `crearDiaEspecial(dia)` | `POST /negocio/dias-especiales` | A | `DiaEspecial` | `409 fecha_ocupada` |
| `editarDiaEspecial(id, dia)` / `eliminarDiaEspecial(id)` | `PUT` / `DELETE /negocio/dias-especiales/{id}` | A | `DiaEspecial` / `void` | `409 fecha_ocupada` |
| `precargarFestivos(anio)` | `POST /negocio/dias-especiales/festivos/{anio}` | A | `{ anio, creados, omitidos }` | |
| `listarPoliticas()` / `publicarPolitica(p)` | `GET` / `POST /negocio/politicas` | A | `Politica[]` / `Politica` | |

> Sin una política `tratamiento_datos` **vigente** nadie puede reservar en línea: la reserva
> exige su `id`. En una base nueva hay que publicarla primero.

### Catálogo (`catalogo.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `listarCategorias()` | `GET /categorias` | B, A | `Categoria[]` | |
| `listarServicios({ incluirInactivos })` | `GET /servicios` | B, A | `Servicio[]` | |
| `getServicio(id)` | `GET /servicios/{id}` | B, A | `Servicio` | |
| `crearServicio(s)` / `editarServicio(id, s)` | `POST /servicios` / `PUT /servicios/{id}` | A | `Servicio` | `409 nombre_en_uso` |
| `cambiarEstadoServicio(id, activo)` | `PATCH /servicios/{id}/estado` | A | `Servicio` | |
| `cambiarComponentes(id, servicioIds)` | `PUT /servicios/{id}/componentes` | A | `Servicio` | `409 no_es_combo` |

`Servicio.advertencia` trae avisos para el panel (p. ej., que ningún barbero lo ofrece); muéstrelo
junto al servicio.

### Barberos (`barberos.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `getMiPerfil()` | `GET /yo` | B | `Barbero` (su ficha, solo lectura). Su día y su próxima cita: `getResumenAgendaBarbero()` | |
| `listarBarberos({ q, estado })` | `GET /barberos` | A | `{ datos: Barbero[], meta: IndicadoresEquipo }` | |
| `registrarBarbero(datos)` | `POST /barberos` | A | `Barbero`; si tiene `acceso_panel`, le envía la invitación | `409 documento_en_uso`, `409 correo_en_uso` |
| `getBarbero(id)` / `editarBarbero(id, datos)` | `GET` / `PUT /barberos/{id}` | A | `Barbero` (con `horario`) | `409 barbero_retirado` |
| `ordenarBarberos(ids)` | `PUT /barberos/orden` | A | `void` | |
| `cambiarVisibilidad(id, v)` | `PUT /barberos/{id}/visibilidad` | A | `Barbero` | `409 barbero_retirado` |
| `retirarBarbero(id, { fecha, motivo })` | `POST /barberos/{id}/retiro` | A | `Barbero`. Cierra sus sesiones; sus citas pendientes generan un aviso | `409 barbero_retirado` |
| `getHorario(id)` / `cambiarHorario(id, franjas)` | `GET` / `PUT /barberos/{id}/horario` | B, A | `Horario` (reemplaza el horario completo) | `409 barbero_retirado` |
| `getServiciosDeBarbero(id)` / `cambiarServiciosDeBarbero(id, ids)` | `GET` / `PUT /barberos/{id}/servicios` | B, A | `Nombrado[]` | |
| `getDatosPrivados(id)` / `guardarDatosPrivados(id, d)` | `GET` / `PUT /barberos/{id}/datos-privados` | A | `DatosPrivados` | |
| `subirFoto(id, archivo)` | `POST /barberos/{id}/foto` (formulario) | A | `{ foto_url }` | `422` (no es JPG/PNG/WebP, no es vertical o pasa de 5 MB), `413` |
| `getExpediente(id)` | `GET /barberos/{id}/documentos` | A | `Expediente` (`documentos`, `faltantes`, `completo`) | |
| `cargarDocumento(id, { tipo, archivo, periodo })` | `POST /barberos/{id}/documentos` (formulario) | A | `Documento` | `409 planilla_repetida`, `422`, `413` |
| `quitarDocumento(id, docId)` | `DELETE /barberos/{id}/documentos/{doc}` | A | `void` | |
| `urlDescargaDocumento(id, docId)` | `GET …/documentos/{doc}/descarga` | A | URL para un `<a>`: el servidor redirige a una descarga firmada de 5 min | |
| `listarAusencias(id)` / `registrarAusencia(id, a)` | `GET` / `POST /barberos/{id}/ausencias` | A | `Ausencia[]` / `Ausencia` | `409 ausencia_solapada` |
| `anularAusencia(id, ausenciaId)` | `POST …/ausencias/{aid}/anular` | A | `Ausencia` | |
| `subirSoporteAusencia(id, ausenciaId, archivo)` | `POST …/ausencias/{aid}/soporte` (formulario) | A | `Ausencia` | `413` |
| `listarBloqueos(id, desde)` / `crearBloqueo(id, b)` | `GET` / `POST /barberos/{id}/bloqueos` | B, A | `Bloqueo[]` / `Bloqueo` | `409 bloqueo_solapado` |
| `eliminarBloqueo(id, bloqueoId)` | `DELETE /barberos/{id}/bloqueos/{bid}` | B, A | `void` | |

Antes de guardar un horario, una ausencia o un bloqueo, muestre qué citas quedarían por fuera con
`buscarConflictos(...)` (agenda). Si las hay y se guarda igual, el backend crea un aviso para la
administradora.

### Clientes (`clientes.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `listarClientes({ q, segmento, pagina, por_pagina })` | `GET /clientes` | A | `ListadoClientes`: página + `meta` con los indicadores de **toda** la base | |
| `buscarClientes(q, signal)` | `GET /clientes/buscar` | B, A | `ClienteRapido[]` (máximo 8; para agenda y venta) | |
| `crearCliente(c)` | `POST /clientes` | B, A | `ClienteFicha` | `409 celular_en_uso` |
| `getCliente(id)` / `editarCliente(id, c)` | `GET` / `PUT /clientes/{id}` | A | `ClienteFicha`. Sus visitas: `listarVentas({ cliente_id })` | `409 celular_en_uso` |
| `anonimizarCliente(id, motivo)` | `POST /clientes/{id}/anonimizacion` | A | `void`. Irreversible: borra los datos personales | `409 estado_invalido` (tiene citas por atender) |
| `getConfiguracionSegmentos()` / `guardarConfiguracionSegmentos(c)` | `GET` / `PUT /clientes/configuracion-segmentos` | A | `ConfiguracionSegmentos` (se aplica al instante) | `422` |
| `listarSolicitudesTitular({ abiertas })` | `GET /clientes/solicitudes-titular` | A | `Pagina<SolicitudTitular>` | |
| `registrarSolicitudTitular(s)` | `POST /clientes/solicitudes-titular` | A | `SolicitudTitular` (con `responder_antes_de`, el plazo legal) | |
| `responderSolicitudTitular(id, respuesta)` | `PATCH /clientes/solicitudes-titular/{id}` | A | `SolicitudTitular` | `409 estado_invalido` (ya respondida) |

### Sitio público y reserva en línea (`publico.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `getLanding()` | `GET /publico/landing` | P | `Landing`: negocio, horario, servicios visibles, barberos visibles y políticas vigentes, en una llamada (caché de 60 s) | |
| `getServiciosPublicos()` | `GET /publico/servicios` | P | `Servicio[]` agendables en línea que algún barbero ofrece | |
| `getBarberosParaServicio(servicioId)` | `GET /publico/barberos` | P | `OpcionBarbero[]` (con `disponible`, `motivo` y `proxima_hora`) | |
| `getCalendario({ servicioId, barberoId, mes })` | `GET /publico/disponibilidad/calendario` | P | `Calendario`: por día, `disponible`, `ultimos_cupos`, `sin_cupos` o `fuera_de_ventana` | `422` |
| `getHorasLibres({ servicioId, barberoId, fecha })` | `GET /publico/disponibilidad/horas` | P | `HorasDelDia` (mañana, tarde y noche) | `422` |
| `pedirCodigo(celular)` | `POST /publico/verificaciones` | P | `CodigoEnviado` (`id`, `expira_en`, `reenviar_desde`) | `429` (3 por celular cada 15 min, 10 por IP por hora), `422` |
| `confirmarCodigo(id, codigo)` | `POST /publico/verificaciones/{id}/confirmar` | P | `Verificacion` (`comprobante` y, si ya era cliente, sus datos) | `422 codigo_incorrecto`, `410 codigo_vencido` |
| `reservar(r)` | `POST /publico/citas` | P | `CitaCreada` (`cita`, `enlace_gestion`, `calendario_google`) | `409 conflicto_horario`, `410 comprobante_vencido`, `403 reserva_bloqueada`, `422` |
| `getGestion(token)` | `GET /publico/citas/gestion/{token}` | P | `GestionCita` | `410 enlace_vencido` (también si el token no existe) |
| `cancelarPorEnlace(token)` | `POST …/{token}/cancelar` | P | `GestionCita` | `409 estado_invalido` |
| `reprogramarPorEnlace(token, { inicio, barbero_id })` | `POST …/{token}/reprogramar` | P | `GestionCita` | `409 conflicto_horario`, `409 estado_invalido` |
| `cambiarRecordatorios(token, activos)` | `PUT …/{token}/recordatorios` | P | `GestionCita` | |

`barberoId: null` es «Cualquier barbero»: cada hora libre trae el barbero que se asignaría.

### Agenda (`agenda.ts`)

Las acciones sobre una cita devuelven la cita actualizada con su historial y sus mensajes
(`DetalleCita`): reemplace la que tenga en pantalla con la respuesta.

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `getTablero(fecha)` | `GET /agenda/tablero` | A | `Tablero`: una columna por barbero con franjas, bloqueos y citas | |
| `listarCitas({ desde, hasta, barbero_id, estado })` | `GET /agenda/citas` | B, A | `Cita[]` (rango máximo de dos meses) | `422` |
| `crearCita(c)` | `POST /agenda/citas` | A | `DetalleCita`; envía la confirmación por WhatsApp | `409 conflicto_horario`, `409 celular_en_uso` (con `cliente_nuevo`) |
| `getCita(id)` | `GET /agenda/citas/{id}` | B, A | `DetalleCita` | |
| `reprogramarCita(id, { inicio, barbero_id })` | `POST …/{id}/reprogramar` | A | `DetalleCita`; avisa al cliente con un enlace nuevo | `409 conflicto_horario`, `409 estado_invalido` |
| `cancelarCita(id, { motivo, avisar_cliente })` | `POST …/{id}/cancelar` | A | `DetalleCita` | `409 estado_invalido` |
| `confirmarCita(id)` | `POST …/{id}/confirmar` | A | `DetalleCita` | `409 estado_invalido` |
| `iniciarCita(id)` | `POST …/{id}/iniciar` | B, A | `DetalleCita` («En curso») | `409 estado_invalido` |
| `marcarInasistencia(id)` | `POST …/{id}/inasistencia` | B, A | `DetalleCita` (desde el día de la cita) | `409 estado_invalido` |
| `enviarRecordatorio(id)` | `POST …/{id}/recordatorio` | B, A | `DetalleCita`; WhatsApp con «Confirmo» y «Cancelar cita» | `409 estado_invalido` (desactivados o enviado hace menos de 15 min) |
| `reasignarCitas(ids, barberoDestinoId)` | `POST /agenda/citas/reasignacion` | A | `DetalleCita[]` (misma hora, otro barbero; todo o nada) | `409 conflicto_horario` |
| `pedirReprogramacion(ids)` | `POST /agenda/citas/aviso-reprogramacion` | A | `{ avisadas }`: WhatsApp para que el cliente elija otra hora | |
| `getHorasPanel({ servicioId, barberoId, fecha })` | `GET /agenda/disponibilidad/horas` | A | `HorasDelDia` (permite «ahora mismo» y fechas fuera de la ventana pública) | |
| `buscarConflictos(propuesta)` | `POST /agenda/conflictos` | B, A | `Cita[]` que quedarían afectadas | |
| `getPendientesDeCierre(fecha)` | `GET /agenda/pendientes-de-cierre` | A | `Cita[]` pasadas sin venta ni inasistencia | |
| `getResumenAgendaBarbero(barberoId?)` | `GET /agenda/resumen-barbero` | B (el suyo), A (con id) | `ResumenAgendaBarbero` (hoy, mañana y 7 días) | |
| `getConfiguracionAgenda()` / `guardarConfiguracionAgenda(c)` | `GET` / `PUT /agenda/configuracion` | A | `ConfiguracionAgenda` (solo los valores de los comentarios de `tipos.ts`) | `422` |

Estados de una cita: `sin_confirmar` → `confirmada` → `en_curso` → `atendida` (al cobrarla), o
`no_asistio` / `cancelada`. Una venta anulada devuelve la cita de `atendida` a `confirmada`.

### Ventas y caja (`ventas.ts`)

| Función | Endpoint | Quién | Devuelve | Errores propios |
|---|---|---|---|---|
| `getCatalogosVenta()` | `GET /ventas/catalogos` | B, A | `CatalogosVenta` (métodos de pago activos, descuentos, motivos y propinas rápidas) | |
| `registrarVenta(v)` | `POST /ventas` | B, A | `Venta` completa (para el tiquete) | `409 cita_ya_cobrada`, `409 estado_invalido`, `409 celular_en_uso`, `422` (los pagos no suman el total…) |
| `listarVentas({ fecha, desde, hasta, barbero_id, cliente_id, incluir_anuladas, pagina })` | `GET /ventas` | B, A | `Pagina<Venta>` (sin fechas: las de hoy) | |
| `getVenta(id)` | `GET /ventas/{id}` | B, A | `Venta` | |
| `anularVenta(id, motivo)` | `POST /ventas/{id}/anulacion` | A | `Venta` (con `anulacion`) | `409 estado_invalido` (ya anulada) |
| `getCaja({ fecha, barbero_id })` | `GET /ventas/caja` | A | `Caja` | |
| `getResumenVentasBarbero({ fecha, barbero_id })` | `GET /ventas/resumen-barbero` | B (el suyo), A (con id) | `ResumenVentasBarbero` («Lo que llevas hoy») | |
| `getCierre(fecha)` | `GET /ventas/cierres` | A | `CierreCaja`, o `null` si aún no se cierra | |
| `cerrarCaja(c)` | `POST /ventas/cierres` | A | `CierreCaja` | `409 cierre_existente` |
| `listarMetodosPago()` / `cambiarEstadoMetodoPago(id, activo)` | `GET /ventas/metodos-pago` / `PATCH …/{id}` | A | `MetodoPago[]` / `MetodoPago` | `409 estado_invalido` (debe quedar uno activo) |

El servidor **recalcula** subtotal, descuento, comisión y totales con los precios vigentes. Lo que
calcule la pantalla es solo una vista previa: muestre lo que devuelve `registrarVenta`.

### Reportes (`reportes.ts`)

Periodo: `{ mes: 'AAAA-MM' }` o `{ desde, hasta }`; vacío = el mes en curso hasta hoy. Un mes
futuro, un rango que termina después de hoy, al revés o de más de un año responden `422`.

| Función | Endpoint | Quién | Devuelve |
|---|---|---|---|
| `getDashboard(fecha?)` | `GET /reportes/dashboard` | A | `Dashboard` (hoy frente al mismo día de la semana anterior, a la misma hora) |
| `getTendencias(periodo)` | `GET /reportes/tendencias` | A | `Tendencias` |
| `getAlertas()` | `GET /reportes/alertas` | A | `Alertas` (para la campana del panel) |
| `getResumenVentas(periodo)` | `GET /reportes/resumen` | A | `ResumenVentas` |
| `getReporteClientes(periodo)` | `GET /reportes/clientes` | A | `ReporteClientes` |
| `getReporteBarbero(id, periodo)` | `GET /reportes/barberos/{id}` | B (el suyo), A | `ReporteBarbero` (liquidación con cada venta) |
| `descargarResumenPdf`, `descargarClientesPdf`, `descargarBarberosPdf`, `descargarBarberoPdf(id)` | `GET /reportes/….pdf` | A (B el suyo) | `{ blob, nombre }` |

Los PDF pueden tardar: muestre un indicador. Si el generador no responde, `503 pdf_no_disponible`.

### Avisos, mensajes, auditoría y sistema

| Función | Endpoint | Quién | Devuelve |
|---|---|---|---|
| `listarAvisos({ no_leidos, pagina })` | `GET /avisos` | A | `Pagina<Aviso>`; las citas afectadas van en `datos.cita_ids` |
| `marcarAvisoLeido(id)` | `POST /avisos/{id}/leido` | A | `Aviso` |
| `listarMensajes({ destinatario, estado, canal, plantilla })` | `GET /mensajes` | A | `Pagina<Mensaje>` (WhatsApp y correos, sin su contenido) |
| `listarAuditoria({ entidad, entidad_id, desde, hasta })` | `GET /auditoria` | A | `Pagina<RegistroAuditoria>` (p. ej., `{ entidad: 'barbero', entidad_id: 7 }`) |
| `getEstadoSistema()` | `GET /sistema/estado` | A | `EstadoSistema` (alertas, métricas, cola de mensajes) |

## 7. Respuestas de ejemplo

Los campos completos y sus tipos están en `tipos.ts`. Estos ejemplos muestran la forma.

**`Sesion`** (`iniciarSesion`, `consultarSesion`)

```json
{ "usuario": { "id": 1, "rol": "administrador", "nombre": "Laura Gómez", "correo": "laura@diamante.co" }, "panel": "/admin" }
```

**`Cita`** (listas y tablero; `DetalleCita` agrega `historial` y `mensajes`)

```json
{
  "id": 41,
  "estado": "confirmada",
  "origen": "en_linea",
  "inicio": "2026-11-19T15:30:00-05:00",
  "fin": "2026-11-19T16:45:00-05:00",
  "precio": 55000,
  "servicio": { "id": 3, "nombre": "Combo cabello + barba", "duracion_min": 75 },
  "barbero": { "id": 1, "nombre": "Santiago Ríos", "asignacion_automatica": true },
  "cliente": { "id": 57, "nombre": "Andrea Gómez", "celular": "3105559917", "visitas": 6, "inasistencias": 0 },
  "nota": "Prefiere máquina 2",
  "cancelacion_tardia": null,
  "motivo_cancelacion": null
}
```

**`DetalleCita`**: la cita más

```json
{
  "historial": [
    { "evento": "creada", "actor": "cliente", "ocurrido_en": "2026-11-17T10:02:00-05:00", "inicio_previo": null, "barbero_previo": null, "tardio": false, "detalle": null },
    { "evento": "reprogramada", "actor": "administrador", "ocurrido_en": "2026-11-18T09:15:00-05:00", "inicio_previo": "2026-11-19T14:00:00-05:00", "barbero_previo": null, "tardio": false, "detalle": null }
  ],
  "mensajes": [
    { "proposito": "confirmacion", "plantilla": "cita_confirmada", "estado": "leido", "intentos": 1, "ultimo_error": null, "creado_en": "2026-11-17T10:02:00-05:00", "enviado_en": "2026-11-17T10:02:03-05:00" }
  ]
}
```

**`HorasDelDia`** (`getHorasLibres`, `getHorasPanel`)

```json
{
  "fecha": "2026-11-19",
  "manana": [{ "inicio": "2026-11-19T09:00:00-05:00", "hora": "9:00 a. m.", "barbero_id": 1, "barbero": "Santiago Ríos" }],
  "tarde": [{ "inicio": "2026-11-19T15:30:00-05:00", "hora": "3:30 p. m.", "barbero_id": 2, "barbero": "Mateo Díaz" }],
  "noche": []
}
```

**`Calendario`**

```json
{ "mes": "2026-11", "dias": [{ "fecha": "2026-11-19", "estado": "ultimos_cupos", "horas_libres": 2 }, { "fecha": "2026-11-20", "estado": "disponible", "horas_libres": 14 }] }
```

**`CitaCreada`** (`reservar`): la cita pública no trae `cliente` ni `nota`

```json
{
  "cita": { "id": 41, "estado": "confirmada", "origen": "en_linea", "inicio": "…", "fin": "…", "precio": 55000, "servicio": { "…": "…" }, "barbero": { "…": "…" }, "cancelacion_tardia": null, "motivo_cancelacion": null },
  "enlace_gestion": "https://diamante.co/cita/Zk3vQ8…",
  "calendario_google": "https://calendar.google.com/calendar/render?action=TEMPLATE&…"
}
```

**`GestionCita`** (`getGestion` y las acciones por enlace)

```json
{
  "cita": { "id": 41, "estado": "confirmada", "…": "…" },
  "direccion": "Cra. 15 # 93-20, Bogotá",
  "puede_cancelar": true,
  "puede_reprogramar": true,
  "cancelacion_seria_tardia": false,
  "recordatorios_activos": true,
  "calendario_google": "https://calendar.google.com/…"
}
```

**`Venta`** (`registrarVenta`, `getVenta`, `anularVenta`, listas y caja)

```json
{
  "id": 9031, "numero_ticket": 148,
  "registrada_en": "2026-11-19T16:52:10-05:00", "fecha_operacion": "2026-11-19", "registrada_por": 2,
  "estado": "registrada",
  "barbero": { "id": 1, "nombre": "Santiago Ríos" },
  "cliente": { "id": 57, "nombre": "Andrea Gómez" },
  "cita_id": 1842,
  "lineas": [
    { "posicion": 1, "servicio_id": 3, "nombre": "Corte clásico", "precio": 35000 },
    { "posicion": 2, "servicio_id": 5, "nombre": "Barba", "precio": 32000 }
  ],
  "subtotal": 67000,
  "descuento": { "descuento_id": 1, "nombre": "Cliente frecuente 10 %", "motivo_descuento_id": 1, "motivo": "Fidelización", "valor": 6700 },
  "venta_neta": 60300, "propina": 5000, "total_cobrado": 65300,
  "porcentaje_comision": 50, "comision_barbero": 30150,
  "pagos": [{ "metodo_pago_id": 2, "nombre": "Nequi", "monto": 65300 }],
  "anulacion": null
}
```

**`ListadoClientes`** (`listarClientes`)

```json
{
  "datos": [{ "id": 57, "nombre": "Andrea Gómez", "celular": "3105559917", "correo": null, "visitas": 6, "total_gastado": 310000, "ultima_visita": "2026-11-02", "inasistencias": 0, "barbero_habitual_id": 1, "segmento": "frecuente" }],
  "pagina": 1, "por_pagina": 20, "total": 1284,
  "meta": { "registrados": 1284, "por_segmento": { "sin_visitas": 40, "nuevo": 310, "recurrente": 520, "frecuente": 180, "inactivo": 234 }, "dias_inactividad": 60 }
}
```

**`Barbero`** (resumido)

```json
{
  "id": 1, "usuario_id": 3, "nombre": "Santiago Ríos", "nombres": "Santiago", "apellidos": "Ríos",
  "especialidad": "Fades y diseños", "foto_url": "/media/publico/9f3a….webp",
  "porcentaje_comision": 50,
  "estado": { "codigo": "vacaciones", "etiqueta": "Vacaciones", "desde": "2026-12-20", "hasta": "2027-01-05" },
  "visibilidad": { "mostrar_en_landing": true, "recibe_citas_en_linea": true, "acceso_panel": true },
  "cuenta": { "correo": "santiago@diamante.co", "pendiente_activacion": false, "ultimo_acceso_en": "2026-11-22T18:01:00Z" },
  "servicios": [{ "id": 3, "nombre": "Corte clásico" }],
  "…": "documento, contrato, fechas: ver tipos.ts"
}
```

## 8. Flujos completos

### 8.1 Reserva en línea

1. `getServiciosPublicos()` → el cliente elige el servicio.
2. `getBarberosParaServicio(servicio.id)` → elige barbero, o «Cualquier barbero» (`null`). Los que
   tienen `disponible: false` se muestran deshabilitados, con su `motivo`.
3. `getCalendario({ servicioId, barberoId, mes })` → días; `getHorasLibres({ …, fecha })` → horas.
4. `pedirCodigo(celular)` → llega un código de 4 dígitos por WhatsApp. Guarde el `id`. El botón
   «Reenviar» se habilita en `reenviar_desde`.
5. `confirmarCodigo(id, codigo)` → `comprobante`. Si `cliente` viene, autocomplete nombre, correo y
   fecha de nacimiento.
6. `reservar({ comprobante, servicio_id, barbero_id, inicio, cliente, autoriza_tratamiento_datos: true, politica_version_id })`.
   El `politica_version_id` es el `id` de la política `tratamiento_datos` de `getLanding().politicas`.
   - `409 conflicto_horario`: otra persona tomó la hora. Ofrezca `error.alternativas`; el
     comprobante sigue sirviendo para reintentar.
   - `410 comprobante_vencido`: vuelva al paso 4.
7. Muestre la confirmación con `calendario_google`. El cliente recibe el enlace de gestión por
   WhatsApp.

### 8.2 Gestión por enlace (`/cita/{token}`)

`getGestion(token)` y, según `puede_cancelar` y `puede_reprogramar`, los botones. Si
`cancelacion_seria_tardia` es `true`, advierta que la cancelación queda como tardía. Para
reprogramar, use el mismo selector de horas del paso 3 y `reprogramarPorEnlace`. Un enlace viejo
(después de un cambio de hora, el WhatsApp trae uno nuevo) responde `410 enlace_vencido`.

### 8.3 Cobrar una cita

1. `getCatalogosVenta()` para métodos de pago, descuentos y propinas rápidas.
2. `registrarVenta({ cita_id, servicio_ids, descuento, propina, pagos })`. Los servicios son los que
   de verdad se hicieron; la suma de `pagos` debe ser venta neta + propina.
3. Imprima el tiquete con la `Venta` que devuelve. La cita queda «Atendida».

### 8.4 Archivos y PDF

- Subir: `subirFoto`, `cargarDocumento` y `subirSoporteAusencia` reciben un `File` o `Blob` del
  `<input type="file">`; la función arma el formulario.
- Mostrar una foto: `<img src={urlDelServidor(barbero.foto_url)}>`.
- Descargar un PDF:

  ```ts
  const { blob, nombre } = await descargarResumenPdf({ mes: '2026-11' });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: nombre }).click();
  URL.revokeObjectURL(url);
  ```

## 9. Límites de uso

| Qué | Límite |
|---|---|
| `iniciarSesion` | 10 por IP cada 15 min; la cuenta se bloquea 15 min tras 5 fallos |
| `pedirCodigo` | 3 por celular cada 15 min y 10 por IP por hora |
| `confirmarCodigo` | 5 intentos por código |
| `pedirRecuperacion` | 3 por correo y 10 por IP por hora |
| Resto de lo público | 120 por minuto |
| Panel | 600 por minuto por sesión |

Al superarlos: `429 demasiados_intentos` con `reintentarEn`. Evite consultas en bucle: recargue
el tablero cada 30–60 s como mínimo, y en las búsquedas espere a que el usuario deje de escribir.

## 10. Cuando cambie el backend

Esta carpeta se escribió a mano desde el código del backend. Si cambia un endpoint, actualice la
función del módulo, su tipo en `tipos.ts` y esta guía. La lista de endpoints de cada archivo
(comentario del inicio) y `docs/diseno/api.md` del backend deben decir lo mismo.
