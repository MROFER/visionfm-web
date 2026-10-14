# Flujos de la app · Visión 96.5 FM

Recorridos paso a paso del sitio público y del panel. Las pantallas son las del diseño de Labs Fray Bentos; las rutas, las de la arquitectura.

## Mapa del sitio

```
/                                   Inicio
├─ /radio                           → redirige a /radio/programacion
│  ├─ /radio/en-vivo                Pantalla del vivo
│  ├─ /radio/programacion           Grilla por día + #conductores
│  └─ /radio/entrevistas            Archivo con buscador y filtro por programa
├─ /noticias                        Destacada, últimas, archivo, buscador
│  ├─ /noticias/[seccion]           locales · nacionales · policiales · deportes · cultura · opinion
│  └─ /noticias/[seccion]/[slug]    Nota
├─ /cinevision                      #cartelera · #estrenos · #entradas · #como-llegar
│  └─ /cinevision/[pelicula]        Ficha, #trailer, #funciones
├─ /institucional                   #nosotros · #historia · #equipo
│  ├─ /institucional/sumarse        Ser parte (formulario)
│  ├─ /institucional/publicidad     Pedir tarifas (formulario + kit PDF)
│  └─ /institucional/contacto       Contacto (formulario)
├─ /legal/[slug]                    aviso-legal · privacidad · cookies · condiciones
└─ /admin                           Panel (Cloudflare Access + login)
```

Elementos globales en todas las páginas: barra superior (fecha, "Al aire", teléfono), header con menú y botón "Escuchar en vivo", banner publicitario (salvo Cinevisión y Película), footer. En celular, mini reproductor fijo abajo mientras suena algo.

---

## Flujos del público

### F1 · Escuchar el vivo
1. El oyente entra a cualquier página. La barra superior ya muestra "■ AL AIRE {programa} · {conductor}", calculado en el navegador con la grilla y la hora de Montevideo.
2. Toca "Escuchar en vivo" (header en escritorio, play redondo en celular, hero del Inicio, banda de Programación o pantalla En vivo).
3. El motor de audio se conecta al stream. Mientras conecta, el botón muestra "Conectando…".
4. Al sonar, todos los botones pasan a "Pausar" y en celular aparece el mini reproductor.
5. El oyente navega a cualquier página: el audio sigue sin cortes.
6. Desde la pantalla bloqueada del celular puede pausar o reanudar (Media Session).
7. **Errores:** si el stream no responde en 10 s, aparece "No pudimos conectar con la radio. Probá de nuevo." con botón de reintento. Si el stream se cae mientras suena, se reintenta solo 3 veces antes de mostrar el error.

### F2 · Escuchar una entrevista
1. En Inicio o en `/radio/entrevistas`, el oyente toca play en una entrevista.
2. Si el vivo estaba sonando, se pausa. Suena la entrevista con su barra de progreso.
3. El mini reproductor muestra la entrevista y puede volver al vivo desde ahí.
4. Al terminar la entrevista, el reproductor queda detenido (no vuelve solo al vivo).

### F3 · Leer una noticia
1. El lector llega desde Google, Facebook o WhatsApp a `/noticias/[seccion]/[slug]`, o navega desde Inicio o Noticias.
2. Ve sección, título, bajada, autor, fecha, foto con epígrafe y cuerpo. El banner va arriba del título.
3. Al final, "Seguí leyendo" con notas de la misma sección.
4. Comparte con el botón nativo del teléfono (el diseño no lleva botón propio en celular).

### F4 · Buscar
1. En Noticias o Entrevistas, el lector escribe en el buscador de la sección.
2. Los resultados reemplazan al listado, paginados, con el término resaltado.
3. Sin resultados: "No encontramos notas con «{término}»." y link a las últimas.

### F5 · Ver la cartelera y elegir función
1. En `/cinevision` ve el carrusel, la cartelera y los estrenos.
2. Filtra por día (Todos, Vie, Sáb, Dom): la cartelera muestra solo las películas con funciones ese día.
3. Toca un afiche y va a `/cinevision/[pelicula]`.
4. En Funciones elige el día en las pestañas y ve horarios con idioma y formato, más precios y cómo se compran las entradas.
5. Mira el tráiler: la imagen se reemplaza por el video de YouTube al tocar play.
6. **Sin funciones esta semana:** "No hay funciones programadas. Mirá los próximos estrenos." con link.

### F6 · Enviar un formulario (contacto, sumarse, tarifas)
1. El usuario completa los campos; la validación avisa campo por campo al salir de cada uno.
2. Adjunta un archivo (opcional): se valida tipo y tamaño (máximo 10 MB) antes de subir.
3. Envía: Cloudflare Turnstile verifica en segundo plano que no sea un bot.
4. Éxito: el formulario se reemplaza por "Recibimos tu mensaje. Te respondemos a la brevedad." El mensaje queda en el panel y llega por email al destinatario configurado.
5. Error de red: "No pudimos enviar el mensaje. Revisá tu conexión y probá de nuevo." sin perder lo escrito.
6. En Publicidad, el kit comercial se descarga con un link directo al PDF.

---

## Flujos del panel

### P1 · Entrar al panel
1. El usuario va a `visionfm.com.uy/admin`.
2. Cloudflare Access pide su email y le manda un código (o entra con Google).
3. Payload pide email y contraseña. Tras 5 intentos fallidos la cuenta se bloquea 10 minutos.
4. Ve solo las secciones que su rol permite.

### P2 · El periodista publica una nota
1. Noticias → "Crear nueva". Escribe título; el slug se genera solo.
2. Completa bajada, cuerpo, sección y foto. La foto puede subirse desde la galería del celular; se convierte a WebP/AVIF sola. El texto alternativo es obligatorio.
3. El borrador se guarda solo cada pocos segundos.
4. "Vista previa" abre la nota tal como se verá en el sitio.
5. Elige: **Publicar ahora**, **Programar** (fecha y hora de Montevideo) o **Guardar borrador**.
6. Si falta un campo obligatorio, el panel marca el campo y no deja publicar.
7. Al publicar, se refrescan la nota, Inicio, la sección, Noticias y el RSS, y se borran esas URL de la caché de Cloudflare. En menos de 10 s está en línea.

### P3 · El editor arma la portada
1. Ajustes → Portada. Elige la nota destacada y la película destacada.
2. Guarda: Inicio se refresca.

### P4 · Cinevisión carga la semana
1. Películas: carga una vez cada película nueva (afiche, datos, sinopsis, tráiler, créditos, si es estreno y su fecha).
2. Funciones → vista de grilla semanal. Toca "Copiar semana anterior" para arrancar desde lo de la semana pasada.
3. Ajusta: agrega, borra o cambia horarios, idioma y formato.
4. Guarda: se refrescan Cinevisión, las fichas afectadas e Inicio.
5. Las funciones vencidas dejan de mostrarse solas; a medianoche se refresca la cartelera.
6. Cinevisión → Ajustes: actualiza precios, promociones, imágenes del carrusel y cómo llegar.

### P5 · Publicar una entrevista
1. Entrevistas → "Crear nueva". Sube el audio (MP3 o M4A), elige el programa, completa entrevistado/a y tema.
2. La duración se calcula sola del archivo.
3. Publica: se refrescan Entrevistas e Inicio.

### P6 · Cargar un anuncio
1. Anuncios → "Crear nuevo". Sube la imagen de 970×90 y la de 320×100 (el panel valida las medidas), el link y las fechas de vigencia.
2. Fuera de vigencia, el anuncio deja de rotar solo.

### P7 · Responder mensajes
1. Mensajes muestra los envíos de los tres formularios, filtrables por tipo y estado.
2. El editor abre uno, descarga el adjunto y lo marca como "Respondido".

### P8 · Cambiar la programación
1. Programas: edita días y horarios de un programa, o crea uno nuevo con sus conductores.
2. Guarda: se refresca la grilla y el cálculo de "Al aire" usa los nuevos horarios en la siguiente carga de cada página.

---

## Estados que el diseño no muestra y hay que construir

| Estado | Dónde | Comportamiento |
|---|---|---|
| Sin programa al aire | Barra superior, hero | "Visión 96.5 FM · Música" con el botón en vivo igual |
| Conectando / error del stream | Todos los botones de play | Ver F1 |
| Listado vacío | Noticias por sección, entrevistas, cartelera | Texto corto y link a otra sección con contenido |
| Imagen faltante | Tarjetas y afiches | Caja `placeholder` con el logo, sin romper el diseño |
| 404 | Cualquier URL inexistente | Página con el header, "No encontramos esta página" y links a las cuatro secciones |
| 500 | Error del servidor | Página estática servida por Cloudflare |
| Formulario enviado / con error | Formularios | Ver F6 |
