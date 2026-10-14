# Plan de implementación · Visión 96.5 FM

Seis fases en orden. Cada una termina con algo que la radio puede ver en staging. Las horas son estimaciones propias para ajustar con la tarifa y el ritmo real del equipo; el total quedó en 238–334 h: la revisión del 2026-10-14 sumó el flujo editorial, las excepciones de grilla y las tareas de SEO de la migración.

**Antes de empezar:** instalar la app de Claude en GitHub para `MROFER/visionfm-web`, elegir proveedor de VPS y conseguir acceso al Cloudflare de la radio. Sin el VPS se puede avanzar con las fases 0 a 3 en local.

---

## Fase 0 · Base del proyecto · 16–24 h

| Tarea | Listo cuando |
|---|---|
| Crear el proyecto Next + Payload + Postgres con TypeScript estricto y pnpm | `pnpm dev` levanta sitio y `/admin` |
| Estructura `src/base` / `src/sitio`, alias y reglas de import | lint falla si `base` importa `sitio` |
| Docker Compose para desarrollo y Dockerfile de producción | `docker compose up` levanta todo de cero |
| Copiar el diseño a `design/` y los documentos a `docs/` | están en el repo |
| GitHub Actions: lint, tipos, tests, build | CI verde en el primer PR |
| VPS con Coolify, staging desde la rama `staging`, Postgres y respaldo diario a R2 | `staging.visionfm.com.uy` responde detrás de Access |
| Cloudflare: DNS de staging, R2, Access, reglas de WAF | panel pide código antes del login |

## Fase 1 · Contenido y panel · 48–65 h

| Tarea | Listo cuando |
|---|---|
| Colecciones y fichas del esquema (`docs/04-esquema.md`) con validaciones | todas visibles en el panel, migraciones versionadas |
| Roles y permisos por colección y campo | cada rol ve y edita solo lo suyo (test por rol) |
| Flujo editorial: estados, permiso "Publica sin revisión", lista "Para revisar", devolver con comentario, avisos por email | un periodista sin permiso no puede publicar ni por API; el editor aprueba, programa o devuelve |
| Excepciones de grilla | un partido cargado reemplaza "Al aire" en su horario |
| Prueba del panel en celular con un periodista real | sube una nota con foto desde el teléfono sin ayuda |
| Panel en español con logo y colores de la radio | |
| Medios a R2 con tamaños WebP/AVIF; archivos privados con URL firmada | subir una foto de celular genera los tamaños |
| Borradores, versiones, vista previa y publicación programada | una nota programada se publica sola a la hora |
| Hooks de revalidación y purga de Cloudflare | publicar refresca solo las URL afectadas |
| Vista de grilla de funciones con "Copiar semana anterior" | Cinevisión carga una semana en minutos |
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

## Fase 3 · Funciones interactivas · 40–55 h

| Tarea | Listo cuando |
|---|---|
| Motor de audio único en el layout, estado global, todos los botones sincronizados | test de Playwright: navegar 5 páginas sin que se corte |
| Mini reproductor, Media Session, reconexión y errores del stream | |
| Entrevistas con el mismo motor (pausa el vivo) | |
| "Al aire" y "A continuación" con `/api/grilla` y hora de Montevideo | tests de bordes: medianoche, fin de semana, sin programa |
| Carrusel de Cinevisión con negativos, flechas, swipe y autoavance | |
| Filtro por día en cartelera y pestañas de funciones | |
| Tráiler y mapa que cargan al tocar | |
| Buscador de Noticias y Entrevistas con Postgres | |
| Formularios con adjunto, Turnstile, límite por IP y email | un envío llega al email y queda en Mensajes |
| **Hito:** el sitio funciona completo en staging | |

## Fase 4 · Migración de WordPress · 15–25 h

| Tarea | Listo cuando |
|---|---|
| Script que lee notas, categorías e imágenes de la API REST de WordPress | |
| Filtro de spam (entradas y enlaces ocultos) con lista revisada a mano | cero enlaces de casinos en lo migrado |
| Conversión a Lexical, imágenes a R2, asignación de sección | |
| Tabla de redirecciones 301 de las notas legítimas y 410 de las URL de spam | todas las URL del sitemap viejo responden 301 → 200 o 410 |
| Línea base: exportar Search Console, PageSpeed y URL con tráfico del sitio actual | archivos guardados antes del cambio |
| Inventario de registros DNS (MX, SPF, DKIM, verificaciones) | ningún registro se pierde en el cambio |
| Ensayo en staging y revisión con la radio | |

## Fase 5 · Calidad y lanzamiento · 34–50 h

| Tarea | Listo cuando |
|---|---|
| Metadata, datos estructurados, sitemaps (general y noticias), RSS, `llms.txt`, robots | validan en Rich Results Test |
| Presupuestos de rendimiento y Lighthouse CI | objetivos del PRD en las 12 páginas |
| Auditoría de accesibilidad WCAG 2.1 AA | sin errores en axe; navegación con teclado completa |
| Cabeceras de seguridad, firewall, revisión de permisos | |
| Monitoreo de disponibilidad, errores y respaldos probados (restaurar uno) | |
| Capacitación: prensa, Cinevisión y editor (1 h cada uno) + guía corta en PDF | |
| Producción: carga de contenido real, migración final, cambio de DNS | sitio en `visionfm.com.uy`, viejo apagado |
| Alta en Search Console, Bing Webmaster Tools y Google News Publisher Center; revisión de "Problemas de seguridad" y pedido de eliminación de URL de spam | sitemaps enviados, sin avisos de seguridad |
| Imagen Open Graph por nota y por defecto | la vista previa sale en WhatsApp y Facebook |
| Consentimiento en formularios y borrado automático de mensajes | |
| Congelamiento de publicación de 24 h el día del cambio | |
| **Hito:** lanzamiento | |

## Coordinación y QA · 15–20 h

Reuniones, revisiones de diseño, ajustes de la radio y pruebas en dispositivos reales.

---

## Después del lanzamiento

- Semanas 1–2: monitoreo, ajustes y soporte a la redacción.
- Mes 1: revisar Core Web Vitals reales y Search Console.
- Extraer `src/base` + infraestructura a un repo plantilla de la agencia.
- Evaluar publicación automática en Facebook al publicar una nota.

## Dependencias externas

| Necesitamos | De quién | Para la fase |
|---|---|---|
| App de Claude instalada en el repo | Maximiliano | 0 |
| VPS contratado | agencia o radio | 0 |
| Acceso a Cloudflare de la radio | radio | 0 |
| URL HTTPS del stream | proveedor del stream | 3 |
| Contenido real (grilla, cartelera, precios, fotos, legales, kit) | radio | 5 (antes del lanzamiento) |
| Imagen principal del carrusel | Labs Fray Bentos | 2 |
| Acceso al WordPress actual (usuario o API) | radio | 4 |
