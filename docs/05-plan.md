# Plan de implementación · Visión 96.5 FM

Siete fases en orden. Las fases 0 a 5 se hacen en cuentas de la agencia, con dominio provisorio, para presentarle a la radio un producto que funciona; la fase 6 traspasa todo a la radio si firma el contrato. Cada una termina con algo que la radio puede ver en staging. Las horas son estimaciones propias para ajustar con la tarifa y el ritmo real del equipo; el total antes del lanzamiento quedó en 283–402 h, más 10–14 h de la etapa 2 de permisos al mes del lanzamiento: la revisión del 2026-10-14 sumó el flujo editorial, las excepciones de grilla y las tareas de SEO de la migración, y el gestor de permisos y la publicidad por ubicaciones sumaron 32–46 h junto con el registro de actividad (ver `07-permisos-y-publicidad.md`). La segunda revisión sumó 6–10 h de seguridad e infraestructura en la fase 0, y la parte de operación 3–4 h (aviso de vencimiento de anuncios, usuario de emergencia y entrega de cuentas). Las respuestas de la radio sumaron el reporte mensual a anunciantes (3–5 h) y la fase 6 de traspaso.

**Antes de empezar:** elegir el dominio provisorio de la agencia y el proveedor de VPS. Sin el VPS se puede avanzar con las fases 0 a 3 en local.

---

## Fase 0 · Base del proyecto · 22–34 h

| Tarea | Listo cuando |
|---|---|
| Crear el proyecto Next + Payload + Postgres con TypeScript estricto y pnpm | `pnpm dev` levanta sitio y `/admin` |
| Estructura `src/base` / `src/sitio`, alias y reglas de import | lint falla si `base` importa `sitio` |
| Docker Compose para desarrollo y Dockerfile de producción | `docker compose up` levanta todo de cero |
| Copiar el diseño a `design/` y los documentos a `docs/` | están en el repo |
| GitHub Actions: lint, tipos, tests, build | CI verde en el primer PR |
| VPS con Coolify, staging desde la rama `staging`, Postgres y respaldo diario a R2 | `visionfm-staging.labs-fraybentos.uy` responde detrás de Access |
| Cloudflare: DNS de staging, R2, Access, reglas de WAF | panel pide código antes del login |
| API de Payload en `/cms-api` detrás de Access, GraphQL apagado y validación del JWT de Access en el servidor | `curl` a `/cms-api/usuarios/login` sin Access devuelve 403 |
| Tres buckets de R2 (público, privado, auditoría con bloqueo de objetos) y copia de respaldos fuera de Cloudflare | se restaura la base y los medios desde la copia externa |
| Panel de Coolify detrás de Access; SPF, DKIM y DMARC del email remitente | un email de prueba llega a Gmail sin ir a spam |

## Fase 1 · Contenido y panel · 69–95 h

| Tarea | Listo cuando |
|---|---|
| Colecciones y fichas del esquema (`docs/04-esquema.md`) con validaciones | todas visibles en el panel, migraciones versionadas |
| Permisos etapa 1: 8 roles de fábrica fijos, permiso Noticias → Publicar por persona y secciones permitidas | test por rol y por acción, también por API |
| Usuarios por invitación, sincronización con Cloudflare Access, sesiones visibles, desactivación | un usuario desactivado no pasa Access ni conserva sesiones |
| Registro de actividad de todo el panel (quién, qué, antes/después, cuándo, desde dónde), historial por contenido y restauración | cualquier cambio aparece en el registro y nadie puede borrarlo |
| Flujo editorial: estados, permiso Noticias → Publicar, lista "Para revisar", devolver con comentario, pendientes en el inicio del panel, contadores en el menú y avisos por email según preferencia | un periodista sin permiso no puede publicar ni por API; el editor aprueba, programa o devuelve |
| Excepciones de grilla | un partido cargado reemplaza "Al aire" en su horario |
| Prueba del panel en celular con un periodista real | sube una nota con foto desde el teléfono sin ayuda |
| Panel en español con logo y colores de la radio | |
| Medios a R2 con tamaños WebP/AVIF; archivos privados con URL firmada | subir una foto de celular genera los tamaños |
| Borradores, versiones, vista previa y publicación programada | una nota programada se publica sola a la hora |
| Hooks de revalidación y purga de Cloudflare | publicar refresca solo las URL afectadas |
| Vista de grilla de funciones con "Copiar semana anterior" | Cinevisión carga una semana en minutos |
| Aviso de vencimiento de anuncios 7 días antes (email y panel) | un anuncio que vence en 7 días genera el aviso |
| Reporte mensual por anunciante (PDF por email y descarga en el panel) | un anunciante de prueba recibe su PDF |
| Seed con datos de ejemplo realistas | `pnpm seed` deja staging navegable |
| **Hito:** la radio prueba el panel en staging | |

## Fase 2 · Sitio con el diseño · 70–95 h

| Tarea | Listo cuando |
|---|---|
| Tokens del diseño, tipografías propias, logo en SVG | sin Newsreader; solo los pesos usados |
| Componentes globales: barra superior, header con desplegables, menú hamburguesa con acordeón, footer, banner rotativo, Participá | iguales a las capturas en 390 y 1440 px |
| Componentes de contenido: título de sección, pestañas, tarjetas, filas de entrevista, afiches, chips, paginación, buscador, campos | |
| Inicio | |
| Radio: En vivo, Programación, Entrevistas (sin audio todavía) | |
| Noticias: listado, sección, nota | |
| Cinevisión y Película | |
| Institucional, Sumarse, Publicidad, Contacto (sin envío todavía), legales | |
| 404, 500 y estados vacíos (`docs/03-flujos.md`) | |
| Responsive entre 768 y 1024 px | sin saltos ni scroll horizontal |
| **Hito:** las 12 páginas en staging con datos de ejemplo, revisadas con Labs Fray Bentos | |

## Fase 3 · Funciones interactivas · 46–64 h

| Tarea | Listo cuando |
|---|---|
| Motor de audio único en el layout, estado global, todos los botones sincronizados | test de Playwright: navegar 5 páginas sin que se corte |
| Mini reproductor, Media Session, reconexión y errores del stream | |
| Entrevistas con el mismo motor (pausa el vivo) | |
| "Al aire" y "A continuación" con `/api/grilla` y hora de Montevideo | tests de bordes: medianoche, fin de semana, sin programa |
| Carrusel de Cinevisión con negativos, flechas, swipe y autoavance | |
| Publicidad por ubicaciones con segmentación por sección, peso, aviso propio de relleno y métricas por ubicación exportables | un mismo anuncio rota en las ubicaciones elegidas y en ninguna otra |
| Filtro por día en cartelera y pestañas de funciones | |
| Tráiler y mapa que cargan al tocar | |
| Buscador de Noticias y Entrevistas con Postgres | |
| Formularios con adjunto, Turnstile, límite por IP y email | un envío llega al email y queda en Mensajes |
| **Hito:** el sitio funciona completo en staging | |

## Fase 4 · Migración de WordPress · 18–30 h

| Tarea | Listo cuando |
|---|---|
| Script que lee notas, categorías e imágenes de la API REST pública de WordPress (sin usuario). Si la API está cerrada, lee el sitemap y el HTML de cada nota | importa todas las notas del sitemap viejo |
| Script repetible: cada nota se identifica por su id de WordPress, así una segunda corrida solo trae lo nuevo o lo cambiado | correrlo dos veces no duplica nada |
| Entrevistas: ubicar dónde están hoy (notas con audio, YouTube, Facebook, SoundCloud u otro). Los audios propios se descargan a R2 como entrevistas; los que viven en plataformas externas se enlazan | cada entrevista vieja tiene su ficha en el sitio nuevo |
| Filtro de spam (entradas y enlaces ocultos) con lista revisada a mano | cero enlaces de casinos en lo migrado |
| Conversión a Lexical, imágenes a R2, asignación de sección | |
| Tabla de redirecciones 301 de las notas legítimas y 410 de las URL de spam | todas las URL del sitemap viejo responden 301 → 200 o 410 |
| Línea base: exportar Search Console, PageSpeed y URL con tráfico del sitio actual | archivos guardados antes del cambio |
| Inventario de registros DNS (MX, SPF, DKIM, verificaciones) | ningún registro se pierde en el cambio |
| Ensayo en staging y revisión con la radio | |

## Fase 5 · Calidad y demo · 31–46 h

| Tarea | Listo cuando |
|---|---|
| Metadata, datos estructurados, sitemaps (general, noticias, entrevistas y películas), RSS, `llms.txt`, robots | validan en Rich Results Test |
| Presupuestos de rendimiento y Lighthouse CI | objetivos del PRD en las 12 páginas |
| Auditoría de accesibilidad WCAG 2.1 AA | sin errores en axe; navegación con teclado completa |
| Cabeceras de seguridad, firewall, revisión de permisos | |
| Monitoreo de disponibilidad, errores y respaldos probados (restaurar uno), con destinatarios de alertas definidos por la radio | |
| Capacitación: prensa, Cinevisión y editor (1 h cada uno) + guía corta en PDF | |
| Alta en Search Console, Bing Webmaster Tools y Google News Publisher Center; revisión de "Problemas de seguridad" y pedido de eliminación de URL de spam | sitemaps enviados, sin avisos de seguridad |
| Imagen Open Graph por nota y por defecto | la vista previa sale en WhatsApp y Facebook |
| Consentimiento en formularios y borrado automático de mensajes | |
| **Hito:** demo lista para presentar a la radio | |

## Fase 6 · Traspaso a la radio y lanzamiento · 12–18 h

Solo si la radio firma. El código no cambia: cambian las variables de entorno y las cuentas.

| Tarea | Listo cuando |
|---|---|
| Crear las cuentas de la radio (Cloudflare, VPS, GitHub, R2, envío de email) con un email de la radio, y su gestor de contraseñas | el dueño entra a cada cuenta con su clave |
| Transferir el repo a la organización de GitHub de la radio | CI corre en el repo nuevo |
| Copiar base y archivos de R2 a las cuentas nuevas; respaldo externo a nombre de la radio | la copia restaura completa en el VPS de la radio |
| Registros DNS de `visionfm.com.uy`: sitio, staging, Access, SPF, DKIM y DMARC | un aviso del panel llega desde `avisos@visionfm.com.uy` |
| Usuarios: Owner del dueño, Administrador de emergencia de la radio, Administrador de la agencia | el usuario de emergencia entra al panel |
| Congelamiento de publicación de 24 h el día del cambio | |
| Carga de contenido real, última corrida del script de migración (trae lo publicado desde la demo) y cambio de DNS | sitio en `visionfm.com.uy`, viejo apagado |
| Apagar la demo y borrar los datos de la radio de las cuentas de la agencia | |
| **Hito:** lanzamiento | |

## Coordinación y QA · 15–20 h

Reuniones, revisiones de diseño, ajustes de la radio y pruebas en dispositivos reales.

---

## Después del lanzamiento

- Semanas 1–2: monitoreo, ajustes y soporte a la redacción.
- Mes 1: revisar Core Web Vitals reales y Search Console.
- Mes 1: **permisos etapa 2** (10–14 h): roles editables desde la grilla, roles nuevos, ajustes propios con motivo, reglas de delegación y transferencia de titularidad.
- Extraer `src/base` + infraestructura a un repo plantilla de la agencia.
- Evaluar publicación automática en Facebook al publicar una nota.

## Dependencias externas

| Necesitamos | De quién | Para la fase |
|---|---|---|
| App de Claude instalada en el repo | Maximiliano | 0 |
| Dominio provisorio y VPS de la agencia | agencia | 0 |
| Cuentas de la radio y acceso a su dominio | radio, al firmar | 6 |
| URL HTTPS del stream | proveedor del stream | 3 |
| Contenido real para la demo: lo que ya está publicado en el sitio y redes de la radio | agencia lo carga | 4–5 |
| Contenido que no está publicado (precios, legales, kit, fotos nuevas) | radio, al firmar | 6 |
| Imagen principal del carrusel | Labs Fray Bentos | 2 |
| WordPress actual: alcanza con su API pública; usuario solo si faltan datos | radio (opcional) | 4 |
