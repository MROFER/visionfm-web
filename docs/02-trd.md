# TRD · Nuevo sitio de Visión 96.5 FM

La arquitectura completa (diagrama, estructura del repo, rutas, reproductor, caché, despliegue, seguridad, SEO, migración e inventario del diseño) está en la página **Arquitectura Vision FM**: https://claude.ai/artifact/DvXeaBXMuTGAo5H9G9mhXn. Este documento resume las decisiones y agrega lo que esa página no cubre: entorno, API, errores y convenciones.

## 1. Stack

| Capa | Elección |
|---|---|
| App | Next.js (App Router, React Server Components) con Payload CMS 3 integrado; TypeScript estricto |
| Base de datos | PostgreSQL 16 (`@payloadcms/db-postgres`) |
| Archivos | Cloudflare R2 (`@payloadcms/storage-s3`) |
| Estilos | Tailwind CSS v4 con los tokens del diseño en `src/styles/tokens.css` |
| Editor | Lexical (`@payloadcms/richtext-lexical`) |
| Email | SMTP transaccional (Resend o similar) vía `@payloadcms/email-nodemailer` |
| Antispam | Cloudflare Turnstile |
| Infra | VPS 2 vCPU / 4 GB con Coolify; Cloudflare delante (DNS, WAF, caché, Access) |
| CI | GitHub Actions: lint, tipos, tests, build de la imagen Docker (publicada en GitHub Container Registry), Lighthouse CI. El VPS no compila: Coolify descarga la imagen |
| Runtime | Node 22 LTS, pnpm |

Las versiones exactas se fijan al crear el repo: Next será la última que Payload 3 soporte oficialmente.

## 2. Entornos

El sitio se construye primero en cuentas de la agencia, con un dominio provisorio (`visionfm.<dominio-agencia>`). Si la radio firma, se traspasa a cuentas de la radio y producción pasa a `visionfm.com.uy`. Por eso nada de la radio va fijo en el código: dominio, cuentas, buckets y remitente salen de variables de entorno.

| Entorno | URL | Rama | Base de datos |
|---|---|---|---|
| Local | `localhost:3000` | cualquiera | Postgres en Docker + `pnpm seed` |
| Staging | `staging.visionfm.<dominio-agencia>`, después `staging.visionfm.com.uy` | `staging` | propia, solo con datos de ejemplo (`pnpm seed`); nunca copia de producción |
| Demo (antes del contrato) | `visionfm.<dominio-agencia>` | `main` | propia; `noindex` y detrás de Access |
| Producción | `visionfm.com.uy` | `main` | producción, en cuentas de la radio |

Staging va detrás de Cloudflare Access completo (no es público) y con `noindex`.

## 3. Variables de entorno

Definidas en `.env.example` (sin valores) y cargadas en Coolify. Nunca en el repo.

| Variable | Uso |
|---|---|
| `DATABASE_URL` | conexión a Postgres |
| `PAYLOAD_SECRET` | firma de sesiones y tokens |
| `NEXT_PUBLIC_SITE_URL` | URL canónica del entorno |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | medios públicos (fotos, audios) |
| `R2_BUCKET_PRIVADO` | adjuntos de formularios y CV; solo con URL firmada |
| `R2_BUCKET_AUDITORIA` | copia nocturna del registro de actividad, con bloqueo de objetos |
| `CF_ACCESS_TOKEN`, `CF_ACCESS_APP_ID`, `CF_ACCESS_AUD` | sincronizar usuarios con la lista de Access y validar el JWT de Access en el servidor |
| `RESPALDO_*` | destino de respaldos fuera de la cuenta de Cloudflare (Backblaze B2 u otro S3) |
| `CF_ZONE_ID`, `CF_API_TOKEN` | purga de caché de Cloudflare (token con permiso solo de purga) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | antispam de formularios |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | emails del panel y de formularios |
| `PREVIEW_SECRET` | vista previa de borradores |
| `CRON_SECRET` | tareas programadas (publicación programada, limpieza, refresco de medianoche) |
| `INDEXNOW_KEY` | aviso a Bing al publicar |

La URL del stream no es variable de entorno: vive en la ficha `ajustes` para que la radio pueda cambiarla.

## 4. API

Payload expone su API REST en `/cms-api/{coleccion}` (se cambia `routes.api` en la configuración), detrás de Cloudflare Access igual que `/admin`, para que nadie pueda intentar el login por API salteando el 2FA. GraphQL queda desactivado. El sitio consume el contenido del lado del servidor con la Local API (sin HTTP). Las rutas públicas propias viven en `/api` y son pocas:

| Ruta | Método | Uso | Caché |
|---|---|---|---|
| `/api/grilla` | GET | grilla semanal compacta para "Al aire" y "A continuación" | Cloudflare, purga al guardar programas |
| `/api/anuncios?ubicacion=&seccion=` | GET | anuncios vigentes de una ubicación (y sección, si aplica) para rotar | Cloudflare 5 min |
| `/api/buscar?en=noticias\|entrevistas&q=&pagina=` | GET | búsqueda de texto completo en Postgres; límite por IP en el WAF | Cloudflare 1 min |
| `/api/formularios/{tipo}` | POST | crea un mensaje (multipart con adjunto); valida Turnstile y límite por IP | sin caché |
| `/api/preview` | GET | activa la vista previa de un borrador con `PREVIEW_SECRET` | sin caché |
| `/api/revalidar` | POST | uso interno de los hooks | sin caché |
| `/a/{id}` | GET | link de salida de un anuncio: suma un clic y redirige | sin caché |
| `/api/anuncios/impresiones` | POST | suma impresiones en lote desde el navegador | sin caché |

Respuestas de error en JSON: `{ "error": { "codigo": "VALIDACION", "mensaje": "…", "campos": { … } } }` con códigos `VALIDACION` (400), `NO_AUTORIZADO` (401/403), `NO_ENCONTRADO` (404), `DEMASIADOS_ENVIOS` (429), `INTERNO` (500).

## 5. Caché y revalidación

- Páginas públicas: generación estática con revalidación por etiquetas (`revalidateTag`). Etiquetas: `noticias`, `seccion:{slug}`, `nota:{id}`, `entrevistas`, `programas`, `cartelera`, `pelicula:{id}`, `anuncios`, `ajustes`, `portada`, `grilla` (programas y excepciones), `cinevision`, `institucional`, `pagina:{slug}`.
- Cada hook `afterChange` / `afterDelete` revalida sus etiquetas y purga en Cloudflare las URL afectadas.
- Cloudflare cachea HTML (`Cache-Control: s-maxage=31536000, stale-while-revalidate`) y archivos estáticos. `/admin`, `/cms-api`, `/api/preview`, cualquier respuesta en modo vista previa y POST no se cachean (`Cache-Control: private, no-store`); una regla de Cloudflare saltea la caché si existe la cookie de vista previa.
- Tareas programadas (cola de Payload + cron de Coolify): publicar notas programadas y aprobadas cada minuto, refrescar la cartelera a medianoche, borrar funciones de más de 90 días y mensajes vencidos cada semana.
- "Al aire" se recalcula cada minuto en el navegador con `/api/grilla`, que incluye las excepciones de los próximos 7 días.
- Al publicar una nota: revalidación, purga de Cloudflare e IndexNow.

## 6. Manejo de errores y observabilidad

- `error.tsx` por sección y `not-found.tsx` global con el diseño del sitio; página 500 estática servida por Cloudflare si la app no responde.
- Logs estructurados en JSON a stdout; Coolify los guarda 14 días.
- Errores del servidor y del navegador a Sentry (plan gratis) o GlitchTip autoalojado.
- Monitoreo externo de disponibilidad del sitio y del stream cada 5 min (avisa a la radio y a la agencia) (Uptime Kuma en el VPS o UptimeRobot), con alerta por email.
- Analítica: Cloudflare Web Analytics; eventos de reproducción del vivo y entrevistas.

## 7. Convenciones de código

- Código y nombres de colecciones y campos en español (lo lee el equipo y el panel), sin tildes ni ñ en identificadores.
- `src/base/` no importa nada de `src/sitio/`; así se puede extraer como plantilla.
- Componentes de servidor por defecto; `"use client"` solo en reproductor, menú, carrusel, pestañas, buscador, formularios y rotador de anuncios.
- Commits convencionales en español (`feat:`, `fix:`, `docs:`…); ramas `feat/…`, `fix/…`; PR obligatorio hacia `staging` y `main`.
- Migraciones de Postgres siempre versionadas (`pnpm payload migrate:create`), nunca `push` en producción.
- Tests: Vitest para lógica (grilla, "Al aire", funciones, slugs); Playwright para humo (navegar sin cortar el audio, publicar una nota, enviar un formulario).

## 8. Seguridad

Resumen; el detalle está en la página de arquitectura.
- `/admin` y `/cms-api` detrás de Cloudflare Access (código por email; Google con 2FA para Owner y administradores) y login de Payload con bloqueo por intentos. El servidor además valida el JWT de Access en esas rutas, por si alguien llega al VPS sin pasar por Cloudflare.
- Panel de Coolify detrás de Access y en su propio subdominio; nunca expuesto en una IP pública.
- Firewall del VPS: solo IP de Cloudflare en 80/443; SSH con clave y puerto no estándar.
- Tres buckets de R2 separados: medios públicos, adjuntos privados y auditoría con bloqueo de objetos. R2 no versiona, así que los respaldos de base de datos y de medios se copian además fuera de la cuenta de Cloudflare.
- Adjuntos de formularios privados en R2, descargables solo con URL firmada desde el panel; tipos y tamaños validados en servidor.
- Cabeceras: CSP estricta, HSTS, `X-Frame-Options: DENY` fuera del panel.
- Renovate para dependencias; CI bloquea el merge si fallan los tests.
- Permisos editoriales validados en el servidor, no solo ocultando botones: un periodista sin permiso no puede publicar ni llamando a la API directo (test por rol).
- Subidas: límite de 100 MB por petición en el plan gratis de Cloudflare; audios hasta 90 MB, imágenes hasta 15 MB, adjuntos hasta 10 MB.
- Búsqueda en Postgres con `unaccent` y diccionario español.
- Email transaccional con SPF, DKIM y DMARC en el dominio remitente, para que los avisos no caigan en spam.

## 9. Pendiente de confirmar

- URL HTTPS del stream (hoy `emisiones.com.uy:8157`).
- Proveedor de VPS y de email transaccional (uno que solo pida registros DNS, porque la radio no tiene casillas propias).
- Dominio de la agencia para la demo.
- Cuentas de la radio (Cloudflare, VPS, GitHub, R2, envío de email) al firmar el contrato.
