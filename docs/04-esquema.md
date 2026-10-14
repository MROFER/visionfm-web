# Esquema del backend · Visión 96.5 FM

Colecciones y fichas globales de Payload sobre PostgreSQL. Payload genera las tablas y las migraciones a partir de esta configuración; los nombres de campo son los que irán en el código.

**Convenciones**
- Todas las colecciones tienen `id`, `createdAt` y `updatedAt` (los agrega Payload).
- `slug`: se genera del título, único, solo `a-z 0-9 -` (tildes y ñ se normalizan), editable.
- Fechas en UTC en la base; el panel y el sitio muestran hora de `America/Montevideo`.
- `*` = obligatorio. `✎` = con borradores y versiones.
- Imágenes y archivos: relación a `medios` o `archivos`, guardados en Cloudflare R2.

**Roles:** `admin`, `editor`, `periodista`, `cinevision`.

---

## usuarios (auth)

| Campo | Tipo | Notas |
|---|---|---|
| `nombre`* | texto | |
| `email`* | email | único, login |
| `rol`* | select | admin · editor · periodista · cinevision |
| `equipo` | relación → `equipo` | para firmar notas con la ficha pública |
| `publicaSinRevision` | checkbox | solo para `periodista`; por defecto **no**. Lo cambian `editor` y `admin` |
| `recibeAvisosRevision` | checkbox | solo para `editor` y `admin`; ve y recibe avisos de notas para revisar |
| `avisosEmail` | select | al-instante · resumen-por-hora · nunca (por defecto, al instante) |

Acceso: solo `admin` crea, edita y borra usuarios; `editor` puede cambiar `publicaSinRevision` de los periodistas. Cada usuario edita su nombre y contraseña. Bloqueo tras 5 intentos fallidos por 10 min.

## medios (upload)

| Campo | Tipo | Notas |
|---|---|---|
| archivo* | imagen | JPG, PNG, WebP, AVIF; máx. 15 MB; se generan tamaños 320, 640, 960, 1280, 1920 en WebP y AVIF |
| `alt`* | texto | texto alternativo, máx. 160 caracteres |
| `credito` | texto | fotógrafo o fuente |

Acceso: lectura pública; crea cualquier rol; borra `admin` y `editor`.

## archivos (upload)

Audios de entrevistas, adjuntos y PDF. Separado de `medios` para no generar tamaños de imagen.

| Campo | Tipo | Notas |
|---|---|---|
| archivo* | archivo | MP3, M4A, PDF, DOC/DOCX, MP4; máx. según uso |
| `privado` | checkbox | adjuntos de formularios: no públicos, se descargan con URL firmada |

## secciones

| Campo | Tipo | Notas |
|---|---|---|
| `nombre`* | texto | Locales, Nacionales, Policiales, Deportes, Cultura, Opinión |
| `slug`* | slug | único; reservado contra slugs de notas |
| `descripcion` | textarea | meta description de la sección |
| `orden`* | número | orden en la tira y el menú |

Acceso: escribe `admin`.

## noticias ✎

| Campo | Tipo | Notas |
|---|---|---|
| `titulo`* | texto | máx. 120 |
| `slug`* | slug | único dentro de la sección |
| `bajada`* | textarea | 80–280 caracteres |
| `cuerpo`* | rich text (Lexical) | párrafos, subtítulos H2/H3, citas, listas, links, imágenes, embeds de YouTube |
| `foto`* | relación → `medios` | |
| `epigrafe` | texto | |
| `seccion`* | relación → `secciones` | |
| `autor`* | relación → `usuarios` | por defecto, quien crea |
| `fechaPublicacion`* | fecha y hora | por defecto, al publicar; si es futura, la nota se programa |
| `fechaActualizacion` | fecha y hora | se completa al corregir una nota publicada; se muestra "Actualizado …" |
| `estadoEditorial`* | select | borrador · en-revision · devuelta · aprobada · publicada (ver flujo P2) |
| `comentarioEditor` | textarea | motivo al devolver una nota; visible para el autor |
| `aprobadoPor` | relación → `usuarios` | se completa al aprobar |
| `publicadoPor` | relación → `usuarios` | se completa al publicar |
| `destacada` | checkbox | candidata a destacada en Noticias |
| `seo` | grupo | `titulo`, `descripcion`, `imagen` (opcionales; caen a título, bajada y foto) |

Índices: `(seccion, fechaPublicacion desc)`, `estadoEditorial`, `slug`, búsqueda de texto completo en español con `unaccent` sobre `titulo + bajada + cuerpo`.
Acceso: `periodista` crea y edita las suyas; publica solo si tiene `publicaSinRevision`, si no, la envía a revisión. `editor` y `admin` editan, aprueban, devuelven y publican todas.
Regla en el servidor (hook `beforeChange`): un periodista sin permiso no puede guardar `_status: published` ni `estadoEditorial: publicada|aprobada`; si edita una nota publicada, su cambio queda como borrador pendiente y la versión publicada sigue en línea hasta que un editor apruebe.
Avisos: dentro del panel, el inicio y el menú muestran contadores calculados en vivo (notas `en-revision` para editores, `devuelta` para el autor, mensajes `nuevo`); no hace falta una tabla de notificaciones. Por email, según `avisosEmail` de cada usuario: al pasar a `en-revision` → editores con `recibeAvisosRevision`; al pasar a `devuelta` o `publicada` → el autor.
Hooks: al publicar o cambiar → revalidar nota, sección, `/noticias`, `/`, RSS y purgar Cloudflare. Si cambia sección o slug → crear redirección 301.

## entrevistas ✎

| Campo | Tipo | Notas |
|---|---|---|
| `entrevistado`* | texto | |
| `tema`* | texto | |
| `slug`* | slug | |
| `programa`* | relación → `programas` | |
| `fecha`* | fecha | |
| `audio`* | relación → `archivos` | MP3/M4A, máx. 90 MB (límite de subida de Cloudflare: 100 MB) |
| `duracion` | número (segundos) | se calcula del archivo |
| `foto` | relación → `medios` | |
| `resumen` | textarea | para SEO y buscador |
| `destacada` | checkbox | |

Índices: `fecha desc`, `programa`, búsqueda de texto sobre `entrevistado + tema + resumen`.
Acceso: `periodista`, `editor`, `admin`.

## programas

| Campo | Tipo | Notas |
|---|---|---|
| `nombre`* | texto | |
| `slug`* | slug | |
| `descripcion` | textarea | |
| `conductores` | relación múltiple → `equipo` | |
| `foto` | relación → `medios` | |
| `horarios`* | array | cada fila: `dias`* (multiselect lun–dom), `inicio`* (HH:MM), `fin`* (HH:MM) |
| `activo` | checkbox | por defecto sí |

Validación: el panel avisa si dos programas activos se superponen en día y horario. Un horario que cruza la medianoche se carga como dos filas.
Acceso: `editor`, `admin`.
API pública: `GET /api/grilla` devuelve la grilla semanal compacta (pocos KB) para calcular "Al aire" y "A continuación" en el navegador; se cachea en Cloudflare y se purga al guardar.

## excepcionesGrilla

Partidos, feriados o coberturas especiales que reemplazan la grilla habitual.

| Campo | Tipo | Notas |
|---|---|---|
| `fecha`* | fecha | |
| `inicio`* / `fin`* | hora | |
| `programa` | relación → `programas` | o bien `titulo` |
| `titulo` | texto | ej. "Fútbol: Laureles vs. Anglo" |
| `conduccion` | texto | |

Acceso: `editor`, `admin`. `/api/grilla` incluye las excepciones de los próximos 7 días y el cálculo de "Al aire" las aplica antes que la grilla.

## equipo

| Campo | Tipo | Notas |
|---|---|---|
| `nombre`* | texto | |
| `rol`* | texto | ej. "Producción y conducción" |
| `grupo`* | select | direccion · produccion-general · conduccion · columnistas · tecnico |
| `foto` | relación → `medios` | |
| `bio` | textarea | |
| `redes` | array | `red` (select), `url` |
| `orden`* | número | orden dentro del grupo |

Acceso: `editor`, `admin`.

## peliculas ✎

| Campo | Tipo | Notas |
|---|---|---|
| `titulo`* | texto | |
| `slug`* | slug | |
| `tituloOriginal` | texto | |
| `anio` | número | |
| `genero`* | texto | |
| `duracion`* | número (minutos) | |
| `calificacion`* | select | ATP · +7 · +13 · +16 · +18 |
| `idiomas`* | multiselect | subtitulada · doblada |
| `formatos`* | multiselect | 2D · 3D |
| `sinopsis`* | textarea | la versión corta sale de los primeros 280 caracteres |
| `afiche`* | relación → `medios` | proporción 2:3 |
| `trailer` | URL | YouTube; se guarda el ID |
| `creditos` | grupo | `direccion`, `reparto`, `guion`, `pais`, `idiomaOriginal`, `distribuidora` |
| `esEstreno` | checkbox | etiqueta "Estreno" |
| `fechaEstreno` | fecha | si es futura, va a "Próximos estrenos" |

Acceso: `cinevision`, `admin`.

## funciones

| Campo | Tipo | Notas |
|---|---|---|
| `pelicula`* | relación → `peliculas` | |
| `fechaHora`* | fecha y hora | |
| `idioma`* | select | subtitulada · doblada (limitado a los idiomas de la película) |
| `formato`* | select | 2D · 3D (limitado a los formatos de la película) |

Índices: `(fechaHora)`, `(pelicula, fechaHora)`.
Las funciones con `fechaHora` pasada no se consultan en el sitio. Se conservan 90 días y después se borran solas.
Acceso: `cinevision`, `admin`. Vista de panel propia: grilla semanal con "Copiar semana anterior".

## anuncios

| Campo | Tipo | Notas |
|---|---|---|
| `nombre`* | texto | interno (anunciante) |
| `imagenWeb`* | relación → `medios` | 970×90 exacto |
| `imagenMovil`* | relación → `medios` | 320×100 exacto |
| `link` | URL | |
| `desde`* / `hasta`* | fecha | vigencia |
| `orden` | número | orden de rotación |
| `activo` | checkbox | |
| `impresiones` | número | solo lectura; se suma desde el sitio en lotes |
| `clics` | número | solo lectura; se suma en el link de salida `/a/{id}` |

Acceso: `editor`, `admin`. El sitio pide los anuncios vigentes; rotan en el navegador.

## mensajes

| Campo | Tipo | Notas |
|---|---|---|
| `tipo`* | select | contacto · sumarse · tarifas |
| `nombre`* | texto | |
| `email`* | email | |
| `telefono` | texto | |
| `datos` | JSON | campos propios de cada formulario (motivo, área de interés, dónde anunciar, presupuesto, plazo, empresa) |
| `mensaje` | textarea | |
| `adjunto` | relación → `archivos` (privado) | máx. 10 MB |
| `estado`* | select | nuevo · leído · respondido |
| `consentimiento`* | checkbox + fecha | aceptación de la política de privacidad (Ley 18.331) |

Creación: solo por `POST /api/formularios/{tipo}` con Turnstile válido y límite de 5 envíos por IP por hora.
Acceso: lectura y edición `editor`, `admin`. Nadie puede crear desde el panel.
Hook: al crear, envía email al destinatario configurado en Ajustes según el tipo.
Conservación: tarea semanal que borra mensajes y adjuntos de más de 12 meses (24 para `sumarse`).

## paginas ✎

| Campo | Tipo | Notas |
|---|---|---|
| `titulo`* | texto | |
| `slug`* | slug | |
| `cuerpo`* | rich text | |
| `seo` | grupo | |

Uso: textos legales en `/legal/[slug]`. Acceso: `admin`.

## redirecciones

| Campo | Tipo | Notas |
|---|---|---|
| `desde`* | texto | ruta vieja, única |
| `hacia`* | texto o relación | ruta nueva o documento |
| `tipo` | select | 301 · 302 · 410 (spam y contenido eliminado) |

Se cargan en la migración de WordPress y las crean los hooks de noticias. Acceso: `admin`.

---

## Fichas globales

### ajustes
`streamUrl`*, `telefono`*, `whatsapp`*, `direccion`, `email`, `redes` (array red/url), `emailsFormularios` (contacto, sumarse, tarifas). Acceso: `admin`.

### portada
`notaDestacada` (→ noticias), `peliculaDestacada` (→ peliculas). Acceso: `editor`, `admin`.

### cinevision
`carrusel` (array: `imagenWeb` 1440×640, `imagenMovil` 390×240, `alt`*, `link`, `orden`), `precios` (array: `concepto`, `precio`), `promociones` (array), `comoSeCompran` (textarea), `comoLlegar` (`direccion`, `mapaImagen`, `mapaLink`, `telefono`). Acceso: `cinevision`, `admin`.

### institucional
`quienesSomos` (rich text), `hitos` (array: `anio`, `titulo`, `texto`), `serParte` (rich text), `publicidad` (rich text), `kitComercial` (→ archivos, PDF). Acceso: `admin`.

---

## Relaciones

```
usuarios ──< noticias >── secciones
   │            └── medios
   └── equipo >──< programas ──< entrevistas ── archivos
peliculas ──< funciones
anuncios, mensajes, paginas, redirecciones: independientes
```
