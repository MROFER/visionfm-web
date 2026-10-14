# Visión 96.5 FM — Rediseño del sitio web (web y mobile)

Propuesta de diseño de **Labs Fray Bentos** para Visión 96.5 FM (Fray Bentos, Río Negro, Uruguay) — sitio actual: https://visionfm.com.uy/

Este paquete es la entrega de diseño para desarrollo. Está pensado para que una IA o un desarrollador implemente el sitio sin tener que adivinar. Leé este archivo completo antes de empezar.

---

## 1. Qué es Visión

Un medio local con **tres partes que conviven en el mismo edificio**:

1. **La radio** (96.5 FM): transmisión en vivo, programación, conductores, entrevistas.
2. **La redacción de noticias**: portal de noticias locales con secciones.
3. **Cinevisión**: el cine de Fray Bentos (cartelera, estrenos, funciones, entradas).

Más una parte **Institucional** (quiénes somos, historia, equipo, ser parte, publicidad, contacto).

El sitio debe tratar las tres partes por igual, pero la radio en vivo es lo que nunca puede faltar: **el botón "Escuchar en vivo" y la información de qué está al aire deben estar presentes en todo el sitio.**

---

## 2. Contenido del zip

| Carpeta | Qué contiene | Para qué usarla |
|---|---|---|
| `capturas/` | PNG de página completa de cada pantalla (web a 1440 px; mobile a 390 px, en 2x) y algunos estados interactivos | **Referencia visual principal.** Así debe verse. |
| `html/` | Cada pantalla renderizada como **HTML estático** con estilos inline y textos reales del diseño | Referencia exacta de estructura, textos, medidas, colores y tipografía. Se abre en cualquier navegador. |
| `fuente-diseno/` | Archivos originales del lienzo de diseño (`*.dc.html`) + `canvas.json` | Fuente original. Incluye la lógica de estados (ver sección 3). |
| `LEEME.md` | Este documento | Especificación funcional. |

### Correspondencia de archivos

| Página | Web (`html/` y `capturas/`) | Mobile | Fuente web | Fuente mobile |
|---|---|---|---|---|
| Inicio | `web-inicio` | `mobile-inicio` | `Main.dc.html` | `Mobile-Inicio.dc.html` |
| En vivo (reproductor) | — (en web es el hero del Inicio) | `mobile-en-vivo` | — | `Mobile-EnVivo.dc.html` |
| Noticias (listado) | `web-noticias` | `mobile-noticias` | `Noticias.dc.html` | `Mobile-Noticias.dc.html` |
| Nota (artículo) | `web-nota` | `mobile-nota` | `Nota.dc.html` | `Mobile-Nota.dc.html` |
| Programación | `web-programacion` | `mobile-programacion` | `Programacion.dc.html` | `Mobile-Programacion.dc.html` |
| Entrevistas | `web-entrevistas` | `mobile-entrevistas` | `Entrevistas.dc.html` | `Mobile-Entrevistas.dc.html` |
| Cinevisión | `web-cinevision` | `mobile-cinevision` | `Cinevision.dc.html` | `Mobile-Cinevision.dc.html` |
| Película (ficha) | `web-pelicula` | `mobile-pelicula` | `Pelicula.dc.html` | `Mobile-Pelicula.dc.html` |
| Institucional | `web-institucional` | `mobile-institucional` | `Institucional.dc.html` | `Mobile-Institucional.dc.html` |
| Quiero sumarme | `web-sumarse` | `mobile-sumarse` | `Sumarse.dc.html` | `Mobile-Sumarse.dc.html` |
| Pedir tarifas | `web-tarifas` | `mobile-tarifas` | `Tarifas.dc.html` | `Mobile-Tarifas.dc.html` |
| Contacto | `web-contacto` | `mobile-contacto` | `Contacto.dc.html` | `Mobile-Contacto.dc.html` |

Capturas de estados extra:
- `web-inicio--menu-abierto.png`: menú desplegable del header (ej. Noticias).
- `web-inicio--reproduciendo.png`: botón en estado "Pausar".
- `mobile-inicio--menu-abierto.png`: menú hamburguesa abierto con un grupo expandido.
- `mobile-inicio--reproduciendo.png`: mini reproductor fijo abajo mientras suena la radio.
- `web-cinevision--imagen-2.png`: carrusel de Cinevisión en la segunda imagen.

**Importante:** "web" y "mobile" son **dos puntos de corte del mismo sitio**, no dos sitios. Implementar un único sitio responsive (sugerido: diseño mobile hasta ~768 px, diseño web desde ~1024 px, y una transición razonable entre ambos).

---

## 3. Cómo leer los archivos de `fuente-diseno/`

Son HTML con una pequeña capa de plantilla:

- `<x-dc>` envuelve la página. `<helmet>` contiene fuentes y estilos globales.
- `{{ algo }}` es un valor que viene de la lógica (ver `renderVals()` en el `<script>` del final).
- `<sc-for list="{{ lista }}" as="item">` repite su contenido por cada elemento.
- `<sc-if value="{{ condicion }}">` muestra el contenido solo si la condición es verdadera.
- El `<script type="text/x-dc">` define `class Component` con:
  - `this.state`: estado de la UI (menú abierto, radio sonando, día elegido, imagen del carrusel, etc.).
  - `renderVals()`: datos de ejemplo y cálculos. **Los arrays de ahí son el modelo de datos de ejemplo.**
  - `onClick="{{ fn }}"`: la acción del botón (normalmente un `setState`).
- `data-props` → `accent`: color de acento (por defecto `#C03A0B`).
- Los links entre páginas usan nombres `*.dc.html`. En `html/` ya están reescritos a los nombres estáticos. En la implementación real usar las URLs de la sección 5.

---

## 4. Sistema visual

### Colores
| Token | Valor | Uso |
|---|---|---|
| `ink` | `#13161D` | Texto principal, fondos oscuros (barra superior, hero en vivo, footer), botones secundarios, líneas gruesas |
| `accent` | `#C03A0B` | Botón "Escuchar en vivo", kickers/etiquetas de sección, subrayado de pestaña activa, botones principales |
| `live` | `#FF7A45` / `#FF9A6E` | Indicador "Al aire" (cuadradito) y texto "Al aire" sobre fondo oscuro |
| `rule` | `#D9D7D2` | Líneas divisorias finas |
| `soft` | `#F3F2EF` | Fondos suaves (banda de Cinevisión en Inicio, campos de formulario, chips) |
| `placeholder` | `#E6E3DC` | Cajas de imagen sin foto |
| `ad-bg` | `#ECEAE5` + borde punteado `#A9A59C` | Espacios publicitarios |
| Grises de texto | `#3B3F48` (cuerpo secundario), `#545862` (metadatos), `#9EA3AE` / `#C9CCD3` (sobre oscuro) | |
| Carrusel de cine | fondo gris `#D4D2CD` / `#CBC9C3`; negativos `#1C1D21` con perforaciones `#D9D7D2` | |

### Tipografía (Google Fonts)
- **Libre Franklin** (500–800): titulares, nombres de programas, títulos de sección.
- **Public Sans** (400–800): cuerpo, UI, botones, etiquetas.
- **Newsreader** (700): **solo el logotipo "Visión"**.
- Etiquetas, botones y kickers: MAYÚSCULAS, peso 800, `letter-spacing` 0.08–0.14em, 11–14 px.

### Formas y layout
- **Esquinas rectas** en todo (botones, tarjetas, campos). Excepciones redondas: el botón play del header mobile, los botones play del reproductor, los íconos de redes del footer y las flechas del carrusel.
- Contenedor web: `max-width: 1240px`, padding lateral 24 px. Mobile: padding lateral 16 px.
- Títulos de sección: texto grande + **línea inferior de 3 px `ink`**.
- Pestañas/filtros: texto en mayúsculas; activa = peso 800 + subrayado de 3 px en `accent`.
- Campos de formulario: fondo `soft`, sin borde, solo `border-bottom: 2px ink`, alto mínimo 48 px.
- Áreas táctiles mínimas de 44–48 px.

---

## 5. Mapa del sitio y navegación

URLs sugeridas:

```
/                         Inicio
/en-vivo                  Reproductor (pantalla dedicada en mobile)
/programacion             Programación (+ #conductores)
/entrevistas              Entrevistas (archivo con buscador)
/noticias                 Noticias (+ /noticias/{seccion})
/noticias/{slug}          Nota
/cinevision               Cinevisión (#cartelera, #estrenos, #entradas)
/cinevision/{slug}        Película
/institucional            Institucional (#nosotros, #equipo, #ser-parte, #publicidad, #contacto)
/sumarse                  Quiero sumarme
/tarifas                  Pedir tarifas (publicidad)
/contacto                 Contacto
```

**Menú principal** (igual en web y mobile):
- **Radio:** En vivo · Programación · Entrevistas · Conductores
- **Noticias:** Últimas noticias · Locales · Nacionales · Policiales · Deportes · Cultura · Opinión
- **Cinevisión:** Cartelera · Estrenos · Entradas y precios · Cómo llegar
- **Institucional:** Quiénes somos · Equipo · Ser parte · Publicidad · Contacto

En web cada grupo es un desplegable. El grupo de la sección actual va subrayado en `accent`. En mobile es un menú hamburguesa con grupos tipo acordeón (+ / −) y al final "Llamá a la radio: 099 318 578".

⚠️ **Links a corregir:** en los diseños web, algunos links del footer apuntan a anclas del Inicio (`Main.dc.html#cine`, `#nosotros`, `#contacto`, `#programacion`). **Deben apuntar a las páginas reales** según el mapa de arriba. También están sin destino: Instagram (`#`), Aviso legal, Privacidad, Cookies, Condiciones de uso y "Labs Fray Bentos".

---

## 6. Componentes globales

### Web
- **Barra superior oscura:** fecha del día · "■ AL AIRE {programa} · {conductor}" · "Llamá a la radio: 099 318 578" (link `tel:`).
- **Header:** logotipo "Visión 96.5 FM" (link al Inicio) · menú con desplegables · botón **"■ Escuchar en vivo"** (pasa a "Pausar" mientras suena). Línea inferior de 3 px.
- **Footer oscuro:** marca + descripción · columnas La radio / Cinevisión / Noticias / Institucional (con ciudad e íconos de Instagram, Facebook y WhatsApp) · fila legal: © a la izquierda; Aviso legal · Privacidad · Cookies · Condiciones de uso · Publicidad · "Desarrollado por Labs Fray Bentos" a la derecha.

### Mobile
- **Header:** logotipo + **botón play redondo** (inicia o pausa la radio) + hamburguesa. Debajo, la fecha. La línea de 3 px va de borde a borde.
- **Mini reproductor fijo abajo** (solo mientras la radio suena): programa actual, botón pausa y link a `/en-vivo`. El footer tiene padding inferior extra para que no lo tape.
- **Footer:** marca + "Radio, noticias y cine en Fray Bentos desde 2005." + íconos de redes · grilla 2×2 (Radio / Noticias / Cinevisión / Institucional) · ciudad · links legales · © · "Desarrollado por Labs Fray Bentos".

### Publicidad (una sola por página, arriba)
- Web: banner **970×90 rotativo** debajo del header (en Inicio, entre el hero en vivo y Noticias; en Nota, por encima del título). Etiqueta "PUBLICIDAD" e indicadores de rotación.
- Mobile: banner **320×100 rotativo** en la posición equivalente (en Inicio reemplaza a los dos últimos ítems de "A continuación").
- **Cinevisión, Película y sus versiones mobile NO llevan publicidad**: ese lugar es para el carrusel.

### Bloque "Participá"
Recuadro con borde de 2 px: kicker "PARTICIPÁ", título "¿Tenés una noticia? Mandala a la redacción.", bajada "Fotos, audios, avisos o lo que esté pasando en tu barrio." y dos botones: **WhatsApp** (`https://wa.me/59899318578`, en `accent`) y **Escribinos →** (a `/contacto`). Va al final del Inicio (web y mobile) y al final de Noticias mobile.

### Otros
- **Paginación numerada** (1, 2, … n, anterior / siguiente) en listados de noticias y entrevistas.
- **Buscador interno por sección** (Noticias, Entrevistas). **No** hay lupa global en el header.

---

## 7. Página por página

**Inicio**
1. **Hero en vivo** (fondo oscuro): "■ AL AIRE AHORA · 96.5 FM", nombre del programa, conductor y horario, barra de progreso del programa (inicio–fin), botones "Escuchar en vivo" y "Programación completa", teléfono. A la derecha, **"A continuación"**: el primer ítem lleva la etiqueta **"Después"** y los siguientes **"Más tarde"** (nunca "Ahora").
2. Publicidad 970×90.
3. **Noticias:** tira de secciones · nota destacada grande a la izquierda (ocupa 2 filas) · 4 notas chicas en grilla 2×2 a la derecha · botón "Todas las noticias".
4. **Cinevisión** (banda gris): película destacada (afiche, título, género · duración · calificación, sinopsis, botones Ver tráiler → `/cinevision/{slug}#trailer` y Ver funciones → `#funciones`) + "También en cartelera" (afiche, título, género · calificación y **solo los días**, sin horarios).
5. **Entrevistas:** buscador + últimas 4 entrevistas con botón play.
6. Bloque **Participá**.

En mobile el orden es el mismo; la película destacada **debe mostrar género, duración y calificación**.

**Noticias:** título, tira de secciones (Locales, Nacionales, Policiales, Deportes, Cultura, Opinión), buscador interno, destacada, "Últimas noticias", "Archivo" y paginación numerada.

**Nota:** sección, título, bajada, autor y fecha, foto principal con epígrafe, cuerpo con cita, "Seguí leyendo". En mobile el header es el estándar (hamburguesa); no hay botón de compartir propio porque el teléfono ya lo trae.

**Programación:** banda "Al aire ahora" con botón en vivo, pestañas por día (Lunes a Domingo) y grilla horario · programa · descripción · conducción, con estado "Al aire" en el programa actual. Debajo, "Las voces de Visión" (conductores) con link al equipo.

**Entrevistas:** buscador, entrevista destacada con reproductor, listado con fecha, programa y duración, y paginación.

**Cinevisión**
- **Carrusel** a todo el ancho (web 1440×640; mobile 390×240). Hoy son espacios grises "Imagen principal", "Imagen 2"… para insertar imágenes; la imagen principal se diseñará aparte.
  - Los **indicadores no son puntos: son negativos de película chicos** (base `#1C1D21`, 3 perforaciones arriba y abajo, ventana gris). El activo tiene ventana clara, borde fino blanco y escala ×1.15. Se pueden tocar.
  - En web hay flechas redondas a los costados.
- **Cartelera** con filtro por día (Todos / Vie / Sáb / Dom):
  - Web: **solo afiches**, sin texto.
  - Mobile: **grilla de 2 columnas**, afiche + nombre debajo.
  - Cada afiche lleva a la página de la película.
- **Próximos estrenos:** afiche + "Estreno: [FECHA]" debajo (mobile: carrusel horizontal con nombre y fecha).
- **Entradas y precios** (General, promociones, cómo se compran) y **Cómo llegar** (mapa, dirección, teléfono).

**Película (`/cinevision/{slug}`)**
- Ruta (web) o "‹ Cartelera" (mobile).
- Franja oscura con afiche, etiqueta "Estreno", título, título original · año, calificación en recuadro, género, duración, idioma ("Subtitulada y doblada") y formato (2D). En web lleva además la **sinopsis corta**. **Sin botones** de Ver funciones o Ver tráiler.
- **Web:** fila de dos columnas de igual alto: **Tráiler** (video 16:9) a la izquierda y **Funciones** a la derecha. Funciones tiene pestañas por día, horarios con chips de idioma y formato, y al pie los precios y "Las entradas se compran en boletería…". **No** lleva botón "Cómo llegar". Debajo, la **Ficha técnica** a todo el ancho en 2 columnas, y después "También en cartelera". **No** hay sección "Sinopsis" aparte.
- **Mobile:** Funciones (pestañas, horarios, precios y cómo se compran) → Tráiler → **Sinopsis** → Ficha técnica → También en cartelera.

**Institucional:** hero, Quiénes somos, **Nuestra historia** (línea de tiempo de hitos), **Equipo**, Ser parte, Publicidad, Contacto. El Equipo va en este orden:
1. **Dirección:** foto grande.
2. **Producción general:** debajo de Dirección, foto grande, una sola persona.
3. **Conducción.**
4. **Columnistas y colaboradores.**
5. **Equipo técnico.**

**Quiero sumarme:** formulario con área de interés, datos personales, mensaje y adjunto (CV, audio o video), más los pasos de "Cómo funciona".

**Pedir tarifas:** formulario comercial que pregunta dónde se quiere anunciar (Radio, Web o Cine, multiselección), datos de la empresa, presupuesto y plazo. Ofrece la **descarga del kit comercial en PDF**. Los pedidos van a un email o planilla comercial.

**Contacto:** texto, dirección e íconos de redes; formulario con nombre, email, motivo (Noticia o aviso / Publicidad / Ser parte / Cinevisión / Otro), mensaje y **adjuntar archivo**.

---

## 8. Comportamientos clave

1. **Radio en vivo:**
   - El reproductor es uno solo para todo el sitio. Lo ideal es que **no se corte al cambiar de página**: hacerlo como SPA, con layout persistente o con un reproductor fijo fuera del área que se recarga.
   - Todos los botones de play o "Escuchar en vivo" controlan ese mismo audio y reflejan su estado (Escuchar en vivo ↔ Pausar).
2. **"Al aire" y "A continuación"** se calculan con la grilla de programación y la hora de Uruguay (America/Montevideo).
3. **Cartelera:** el filtro por día cambia qué películas se ven. En la página de la película, las pestañas por día cambian los horarios.
4. **Carrusel de Cinevisión:** flechas, toque en los negativos y deslizar con el dedo en mobile. Autoavance opcional, que se pausa al interactuar.
5. **Formularios:** validación, adjuntos con límite de tamaño ([X] MB a definir) y confirmación de envío.
6. **Accesibilidad:** el HTML ya trae `aria-label`, `aria-expanded`, `aria-pressed` y `aria-current`. Mantenerlos y asegurar foco visible y navegación con teclado.

---

## 9. Modelo de datos sugerido

- **Programa:** nombre, descripción, conductores[], días[], hora_inicio, hora_fin, foto.
- **Persona del equipo:** nombre, rol, grupo (dirección | producción general | conducción | columnistas y colaboradores | técnico), foto, orden.
- **Nota:** título, bajada, cuerpo, sección (Locales | Nacionales | Policiales | Deportes | Cultura | Opinión), autor, fecha, foto, epígrafe, destacada.
- **Entrevista:** entrevistado/a, tema, programa, fecha, duración, audio_url, foto.
- **Película:**
  - Datos: título, título_original, año, género, duración, calificación, idiomas (subtitulada / doblada), formato (2D / 3D), sinopsis, afiche, tráiler_url (YouTube).
  - Créditos: dirección, reparto, guion, país, idioma original, distribuidora.
  - Estado: es_estreno, fecha_estreno (para próximos estrenos).
  - **funciones[]:** fecha, hora, idioma, formato.
- **Imagen del carrusel:** imagen web, imagen mobile, alt, link opcional, orden.
- **Anuncio:** imagen 970×90, imagen 320×100, link, vigencia, orden de rotación.
- **Configuración:** URL del stream, teléfono, WhatsApp, dirección, redes, precios de entradas.

Se recomienda un CMS sencillo para que la radio cargue notas, cartelera, funciones, programación y anuncios sin ayuda técnica.

---

## 10. Datos pendientes (placeholders)

Todo lo que aparece entre corchetes `[ASÍ]` es contenido que falta y no hay que inventarlo. Lo principal:

- **Radio:** horarios y programas de la grilla ([HORARIO], [PROGRAMA], [CONDUCCIÓN], [DESCRIPCIÓN DEL PROGRAMA]).
- **Cine:** películas, funciones, precios y cómo se compran las entradas ([PELÍCULA], [AFICHE], [HORA], [PRECIO], [PROMOCIÓN], [CÓMO SE COMPRAN]) y la dirección del cine/radio ([DIRECCIÓN]).
- **Contenido:** fotos ([FOTO]) y entrevistas ([ENTREVISTADO/A], [TEMA], [DURACIÓN]).
- **Contacto y redes:** URL de Instagram. Confirmar WhatsApp **+598 99 318 578** y teléfono **099 318 578**.
- **Legales y comerciales:** textos legales (aviso legal, privacidad, cookies, condiciones) y kit comercial en PDF.

Datos ya confirmados que sí se usan:
- Facebook: https://www.facebook.com/VisionFMFrayBentos/
- Programa de ejemplo al aire: "Visión Temprana" con Idilia Rodríguez.
- Conductores: Idilia Rodríguez (producción y conducción), Luper Orellano, Mariana Ferreyra, Meylin Cóceres, Antonio Albarracín, Paolo Piazzolli.
- Las noticias de ejemplo con título real se tomaron del sitio actual.

⚠️ El sitio actual tiene **enlaces de spam de casinos inyectados**. No migrar contenido del sitio viejo sin limpiarlo.

---

## 11. Reglas de diseño acordadas con el cliente (no cambiar sin consultar)

- El botón **"Escuchar en vivo"** y la info de **qué está al aire** van siempre y en todas las páginas.
- **Una sola publicidad por página**, en la zona de primer impacto, y ninguna en Cinevisión ni en Película.
- La lupa **no** va en el header; cada sección tiene su propio buscador.
- "Nosotros" y "Contacto" viven dentro de **Institucional**.
- En la cartelera web va **solo el afiche**. En mobile, afiche + nombre en 2 columnas.
- En "También en cartelera" del Inicio se muestran los **días, no las horas**.
- La película destacada del Inicio muestra **género, duración y calificación** (también en mobile).
- En la Nota mobile no hay botón de compartir propio: el header es el estándar con hamburguesa.
- Footer: legales y "Desarrollado por Labs Fray Bentos" a la derecha, y redes con **íconos** (no nombres escritos).
