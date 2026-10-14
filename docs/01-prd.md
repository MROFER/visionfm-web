# PRD · Nuevo sitio de Visión 96.5 FM

**Cliente:** Visión 96.5 FM, Fray Bentos (Río Negro, Uruguay) · **Sitio:** visionfm.com.uy
**Diseño:** Labs Fray Bentos (`docs/diseno/` o `/mnt/project-files/diseno/VisionFM-rediseno`)
**Estado:** borrador para revisión · 2026-10-14

## 1. Problema

El sitio actual es un WordPress con Astra y Elementor en un hosting compartido. Tiene tres problemas que el rediseño tiene que resolver:

1. **Está comprometido.** Hay enlaces ocultos de casinos y una entrada de spam (`1win-plinko…`) indexada en el sitemap.
2. **No existe para Google ni para las IA.** Las notas son solo título e imagen, no hay H1, todo está en "Uncategorized", no hay datos estructurados y la cartelera de Cinevisión se publica como imágenes.
3. **El vivo se corta.** El audio se interrumpe cada vez que el oyente cambia de página.

## 2. Objetivo

Un sitio que trate por igual a las tres partes del medio (radio, redacción y Cinevisión), en el que la radio en vivo esté siempre a un toque y no se corte nunca, y que la redacción y el cine puedan mantener sin ayuda técnica.

## 3. Usuarios

| Usuario | Qué necesita | Desde dónde |
|---|---|---|
| **Oyente** | Escuchar el vivo, saber qué está al aire y qué viene | Celular, sobre todo |
| **Lector** | Noticias locales actualizadas, encontrarlas por sección o búsqueda | Celular y escritorio, llega desde Google, Facebook y WhatsApp |
| **Público de cine** | Qué se da, qué día, a qué hora y cuánto sale | Celular, muchas veces el mismo día |
| **Anunciante** | Tarifas y kit comercial | Escritorio |
| **Periodista** | Publicar rápido desde el celular, con fotos de WhatsApp | Panel |
| **Responsable de Cinevisión** | Cargar películas y la grilla semanal de funciones | Panel |
| **Dirección / editor** | Portada, destacados, programación, anuncios, mensajes | Panel |

## 4. Alcance

### Entra (versión 1)

**Sitio público** (12 páginas del diseño, escritorio y celular):
- Inicio, Radio (En vivo, Programación, Entrevistas), Noticias (listado, sección, nota), Cinevisión (cartelera, película), Institucional (nosotros, sumarse, publicidad, contacto) y textos legales.
- Reproductor único y persistente: el vivo y las entrevistas comparten audio, no se corta al navegar, mini reproductor en celular.
- "Al aire" y "A continuación" en todo el sitio, calculados con la grilla y la hora de Montevideo.
- Un banner rotativo por página (970×90 / 320×100), nunca en Cinevisión ni en Película.
- Buscador interno en Noticias y Entrevistas.
- Tres formularios con adjunto (contacto, sumarse, tarifas) con protección contra spam.

**Panel** (Payload, en español):
- Usuarios con roles: admin, editor, periodista, Cinevisión.
- Noticias con flujo editorial: subir y publicar son pasos separados; el editor decide por periodista si publica directo o si sus notas pasan por revisión (aprobar, programar o devolver con comentario).
- Borradores, programación de publicación, vista previa y campos obligatorios.
- Entrevistas con audio, programas y grilla con excepciones (partidos, feriados), equipo, películas y funciones con "Copiar semana anterior", anuncios con impresiones y clics, mensajes de formularios, ajustes generales.
- Imágenes convertidas a WebP/AVIF automáticamente.

**Plataforma:**
- SEO y AEO: metadata, datos estructurados (RadioStation, NewsArticle, Movie, ScreeningEvent), sitemaps, RSS, `llms.txt`.
- Migración de las notas del WordPress, sin spam, con redirecciones 301.
- Hosting en VPS con Cloudflare, staging, respaldos diarios, panel con 2FA.

### No entra (versión 1)

- Comentarios de lectores, cuentas de usuario o newsletter.
- Venta de entradas en línea (las entradas se compran en boletería).
- App nativa o notificaciones push.
- Podcast en plataformas externas (Spotify, Apple) y transcripción de entrevistas.
- Varios idiomas.
- Grabación automática del vivo.

## 5. Requisitos no funcionales

| Tema | Requisito |
|---|---|
| Velocidad | LCP < 1,2 s en usuarios reales (p75) y < 1,5 s en Lighthouse móvil; INP < 150 ms; CLS < 0,05; JS inicial < 120 KB; Lighthouse ≥ 95 |
| Publicación | Una nota publicada aparece en el sitio en menos de 10 s |
| Disponibilidad | Si el VPS se cae, las páginas cacheadas siguen saliendo desde Cloudflare |
| Accesibilidad | WCAG 2.1 AA; el diseño ya trae `aria-*`, foco visible y teclado |
| Seguridad | Sin plugins de terceros, panel detrás de Cloudflare Access, IP del servidor oculta |
| Datos personales | Ley 18.331: consentimiento en formularios, política de privacidad, borrado automático de mensajes y CV |
| Costo | Infraestructura de USD 8–17 por mes |

## 6. Cómo medimos el éxito

A los 3 meses del lanzamiento, comparado con el sitio actual:
- Core Web Vitals en verde en Search Console para todas las URL.
- Notas indexadas en Google y apareciendo en Google News o Discover.
- Cartelera visible en Google con horarios (resultados enriquecidos).
- La redacción publica sin pedir ayuda técnica.
- Cero incidentes de spam o seguridad.
- Tiempo de escucha del vivo desde la web (se mide con eventos de reproducción).

## 7. Reglas acordadas con el cliente

Vienen del diseño y no se cambian sin consultar (ver LEEME del diseñador, sección 11): el vivo y "Al aire" en todas las páginas, una sola publicidad por página y ninguna en el cine, sin lupa en el header, Nosotros y Contacto dentro de Institucional, la cartelera web solo con afiches, días y no horas en "También en cartelera", y legales a la derecha en el footer.

## 8. Contenido que tiene que aportar la radio

Grilla de programación real, películas y funciones, precios y promociones del cine, dirección, fotos del equipo, URL de Instagram, textos legales, kit comercial en PDF, imagen principal del carrusel, y confirmación del WhatsApp +598 99 318 578 y del teléfono 099 318 578.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| El stream solo sirve HTTP y el navegador lo bloquea | Pedir URL HTTPS al proveedor; si no hay, proxy en el VPS |
| El contenido real llega tarde | Se lanza con lo cargado; las secciones vacías tienen estados vacíos diseñados |
| Las notas viejas no tienen texto | Se migran igual con redirección; la prensa completa las más vistas |
| La redacción no adopta el panel | Capacitación y campos obligatorios simples; publicación desde el celular |

## 10. Decisiones tomadas

- Next.js + Payload CMS en un solo proyecto, PostgreSQL, Cloudflare R2 para archivos (elegido el 2026-10-14 frente a Astro).
- VPS con Coolify detrás de Cloudflare.
- URL bajo las cuatro secciones del menú; `/radio` redirige a `/radio/programacion`.
- El permiso de publicar es por periodista y lo maneja el editor; por defecto, las notas pasan por revisión (2026-10-14).
- Revisión completa de la arquitectura en `06-revision.md`.
