# Revisión de la arquitectura · 2026-10-14

Revisión punta a punta de la arquitectura y los documentos 01–05 para detectar lo que faltaba. Cada hallazgo indica su gravedad y dónde quedó resuelto.

**Gravedad:** 🔴 bloquea el lanzamiento o expone a un problema legal o de seguridad · 🟠 afecta a usuarios, SEO o costos si no se resuelve · 🟢 mejora recomendada.

## 1. Flujo editorial

| | Hallazgo | Resolución |
|---|---|---|
| 🔴 | Subir una nota y publicarla eran el mismo paso. No había forma de que un editor apruebe antes de publicar ni de decidirlo por periodista. | Nuevo flujo con estados (borrador → en revisión → publicada / devuelta) y permiso por persona (hoy **Noticias → Publicar**, ver `07-permisos-y-publicidad.md`). Ver `03-flujos.md` P2 y `04-esquema.md`. |
| 🟠 | Si un periodista editaba una nota ya publicada, el cambio salía en vivo sin control. | Los cambios de quien no tiene permiso quedan como borrador pendiente; la versión publicada sigue en el sitio hasta que el editor apruebe. |
| 🟠 | No quedaba registro de quién publicó o aprobó cada nota. | Campos `publicadoPor`, `aprobadoPor` e historial de versiones de Payload. |
| 🟢 | Las notas corregidas no lo decían. | Campo `fechaActualizacion` visible ("Actualizado …") y en los datos estructurados (`dateModified`). |

## 2. Legal y datos personales

| | Hallazgo | Resolución |
|---|---|---|
| 🔴 | Los formularios recogen datos personales y CV. En Uruguay aplica la Ley 18.331 de Protección de Datos Personales: hace falta consentimiento informado, política de privacidad y, según el caso, inscribir la base ante la URCDP. | Casilla de consentimiento obligatoria con link a la política de privacidad; política de conservación (mensajes y adjuntos se borran solos a los 12 meses, CV de "Sumarse" a los 24); la radio confirma con su asesor si inscribe la base. Textos legales: los aporta la radio. |
| 🟠 | El diseño tiene link a "Cookies", pero el sitio casi no usa cookies. | Cloudflare Web Analytics no usa cookies y YouTube y el mapa cargan solo al tocarlos, así que no hace falta banner. La página de cookies lo explica. |
| 🟠 | No estaba claro quién es dueño del dominio `.com.uy`, la cuenta de Cloudflare, el VPS y R2. | Todo a nombre de la radio, con la agencia como usuario delegado. Se confirma antes de la fase 0. |

## 3. Migración y SEO

| | Hallazgo | Resolución |
|---|---|---|
| 🔴 | El plan redirigía todas las URL viejas, incluidas las de spam. Redirigir spam a páginas reales transfiere su mala reputación. | Las URL de spam responden **410 Gone**; solo las notas legítimas llevan 301. |
| 🔴 | Google puede tener marcado el sitio por el hackeo. | Antes del lanzamiento: revisar "Problemas de seguridad" en Search Console, pedir la eliminación de las URL de spam y la revisión manual si hay aviso. |
| 🟠 | No había línea base para comparar después del lanzamiento. | Exportar antes del cambio: Search Console (consultas y páginas, 16 meses), PageSpeed del sitio actual y listado de URL con tráfico. |
| 🟠 | El DNS se cambia sin inventario: se pueden perder el email del dominio u otros registros. | Inventario de todos los registros DNS antes del cambio (MX, SPF, DKIM, verificaciones). Los subdominios `cpanel` y `webmail` que exponen la IP vieja se borran al dar de baja el hosting. |
| 🟠 | Bing no estaba en el plan, y alimenta a ChatGPT y Copilot. | Alta en Bing Webmaster Tools e **IndexNow** al publicar (avisa a Bing y Yandex en segundos). Clave para AEO. |
| 🟠 | Las vistas previas en WhatsApp y Facebook dependen de la imagen Open Graph, y son el canal principal del público local. | Imagen OG por nota generada en el servidor (1200×630, < 300 KB para que WhatsApp la muestre) e imagen por defecto con la marca. |
| 🟢 | AEO: faltaban datos estructurados útiles para asistentes. | `MovieTheater` con dirección para Cinevisión, `speakable` en notas, `Organization` con `sameAs` de redes, `BreadcrumbList` en todo el sitio. |
| 🟢 | Google News. | Alta en Publisher Center; el sitemap de noticias incluye solo las últimas 48 h, como pide Google. |

## 4. Radio y contenido

| | Hallazgo | Resolución |
|---|---|---|
| 🟠 | La grilla no contemplaba excepciones: partidos de fútbol, feriados o coberturas especiales que reemplazan un programa. "Al aire" mostraría algo falso. | Colección **Excepciones de grilla**: fecha, horario, programa o texto que reemplaza. El cálculo de "Al aire" las aplica primero. |
| 🟠 | "Al aire" se calculaba al cargar la página; si el oyente la deja abierta, el programa queda viejo. | Se recalcula cada minuto en el navegador. |
| 🟠 | Si el stream se cae, nadie se entera. | El monitoreo externo también revisa el stream cada 5 min y avisa por email a la radio y a la agencia. |
| 🟠 | Los anunciantes van a pedir cuántas veces se vio y se tocó su aviso. | Contador de impresiones y clics por anuncio (link de salida `/a/{id}`), visible en el panel. |
| 🟢 | Las notas locales suelen incluir publicaciones de Facebook o Instagram. | Embeds de redes en el editor, que cargan al tocarlos para no frenar la página. |
| 🟢 | Textos pegados desde WhatsApp o Word traen formato basura. | El editor limpia formato al pegar. |

## 5. Infraestructura

| | Hallazgo | Resolución |
|---|---|---|
| 🔴 | Compilar Next en un VPS de 4 GB mientras sirve el sitio puede quedarse sin memoria y tirar la producción. | La imagen Docker se compila en GitHub Actions y se publica en GitHub Container Registry; Coolify solo la descarga y la levanta. |
| 🟠 | El plan gratis de Cloudflare rechaza subidas de más de 100 MB. Los audios de entrevistas estaban en 100 MB. | Límite de audio en 90 MB (≈ 90 min a 128 kbps). Para más, se sube comprimido. |
| 🟠 | La búsqueda en español fallaría con tildes ("musica" no encuentra "música"). | Postgres con la extensión `unaccent` y diccionario español. |
| 🟠 | Los periodistas usan el panel desde el celular y no estaba probado. | Prueba del panel en celular en la fase 1 con un periodista real; ajustes de interfaz si hace falta. |
| 🟢 | Los slugs con ñ o tildes. | Normalización (`año` → `ano`, `música` → `musica`). |
| 🟢 | Staging con datos reales expone mensajes y CV. | Staging usa solo datos de ejemplo; nunca copia de producción con mensajes. |

## 6. Operación y entrega

| | Hallazgo | Resolución |
|---|---|---|
| 🟠 | No estaba definido quién mantiene el sitio después ni con qué tiempos de respuesta. | Definir abono y tiempos de respuesta en la propuesta comercial (fuera de este repo). |
| 🟠 | Durante la migración final, la redacción podría publicar en el WordPress viejo y perderse. | Congelamiento de publicación de 24 h el día del cambio; las notas de ese día se cargan en el panel nuevo. |
| 🟢 | Publicar en Facebook automáticamente al publicar una nota. | Fuera de la versión 1; se evalúa después. |

## 7. Segunda revisión (2026-10-14)

Se releyeron los siete documentos juntos, después de sumar permisos, auditoría y publicidad por ubicaciones.

**Huecos nuevos**

| | Hallazgo | Resolución |
|---|---|---|
| 🔴 | La API de Payload (`/api/usuarios/login`) quedaba fuera de Cloudflare Access: alguien podía intentar entrar por API salteando el 2FA. | La API de Payload pasa a `/cms-api`, detrás de Access igual que `/admin`; GraphQL apagado; el servidor valida el JWT de Access. Las rutas públicas siguen en `/api`. |
| 🟠 | R2 no guarda versiones: un borrado o un ataque a la cuenta de Cloudflare se lleva medios y respaldos. | Respaldos de base y medios copiados también fuera de Cloudflare (Backblaze B2 u otro S3). |
| 🟠 | Un solo bucket mezclaba fotos públicas, CV privados y auditoría. | Tres buckets: público, privado (URL firmada) y auditoría con bloqueo de objetos. |
| 🟠 | El panel de Coolify no estaba protegido. | Subdominio propio detrás de Access. |
| 🟠 | Una vista previa de un borrador podía quedar en la caché de Cloudflare y verse en público. | Vista previa con `no-store` y regla de Cloudflare que saltea la caché con la cookie de vista previa. |
| 🟢 | El buscador se puede abusar con muchas consultas. | Límite por IP en el WAF para `/api/buscar`. |
| 🟢 | Los avisos por email podían caer en spam. | SPF, DKIM y DMARC en el dominio remitente. |
| 🟢 | Los sitemaps no incluían entrevistas ni películas. | Sitemaps de noticias, entrevistas y películas. |

**Inconsistencias corregidas**

- PRD: roles viejos (admin, editor, periodista, Cinevisión) reemplazados por los 8 roles y las dos etapas; redirecciones 301 y 410; ruta del diseño en `design/`; decisiones nuevas (dos etapas, ramas, `/cms-api`).
- TRD: staging solo con datos de ejemplo; variables de los tres buckets, Access y respaldo externo; `/api/anuncios` con ubicación y sección; etiquetas de caché de portada, grilla, Cinevisión, Institucional y páginas.
- Esquema: el campo `publicaSinRevision` se eliminó (es Noticias → Publicar); cada colección dice qué área la controla en lugar de `admin` / `editor`; la colección `roles` es de solo lectura en la etapa 1.
- Flujos y plan: "Publica sin revisión" pasa a Noticias → Publicar; fase 0 sube a 22–34 h.

## 8. Preguntas abiertas para la radio

1. ¿Qué periodistas publican sin revisión desde el primer día? (por defecto, ninguno)
2. ¿Quiénes son editores y reciben el aviso de notas para revisar?
3. ¿Quién es dueño del dominio y la cuenta de Cloudflare?
4. ¿El dominio tiene email propio (`@visionfm.com.uy`)?
5. ¿Hay transmisiones especiales recurrentes que reemplacen la grilla?
6. ¿Los anunciantes reciben hoy algún reporte?
