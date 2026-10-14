# Permisos, usuarios y publicidad · Visión 96.5 FM

Diseño del gestor de permisos, del alta y el ingreso de usuarios, y de la carga de publicidad con ubicaciones. Reemplaza los cuatro roles fijos que había en `04-esquema.md`.

---

## 1. Gestor de permisos

### Cómo se organiza

Los permisos se dan por **área** y, dentro de cada área, por **acción**. Las áreas siguen las secciones del sitio, más dos áreas internas.

| Área | Qué incluye |
|---|---|
| **Radio** | Programas, grilla, excepciones de grilla, entrevistas, equipo |
| **Noticias** | Notas, secciones, portada (destacadas) |
| **Cinevisión** | Películas, funciones, carrusel, precios, cómo llegar |
| **Institucional** | Quiénes somos, historia, ser parte, textos legales, mensajes de formularios |
| **Publicidad** | Anuncios, ubicaciones, métricas |
| **Sistema** | Usuarios, roles, ajustes generales, redirecciones, registro de cambios |

| Acción | Qué permite |
|---|---|
| **Ver** | Ver el área en el panel |
| **Crear** | Cargar contenido nuevo |
| **Editar lo propio** | Editar lo que creó uno mismo |
| **Editar todo** | Editar lo de cualquiera |
| **Publicar** | Publicar o programar sin pasar por revisión |
| **Aprobar** | Revisar, aprobar o devolver lo que otros enviaron a revisión |
| **Borrar** | Borrar contenido (no se puede deshacer; queda en el registro) |

En **Noticias** además se puede limitar a ciertas secciones: por ejemplo, un periodista de deportes que solo carga y edita notas de Deportes, o un editor que aprueba solo Policiales.

**"Publica sin revisión"** deja de ser un permiso aparte: es tener **Noticias → Publicar**. Sin ese permiso, el botón que aparece es "Enviar a revisión".

### Roles

Un rol es un conjunto de permisos con nombre. El panel trae estos de fábrica y el Owner o un administrador puede editarlos o crear otros nuevos desde una grilla de casillas (áreas × acciones).

| Rol | Permisos de fábrica |
|---|---|
| **Owner** | Todo. Uno solo, no se puede editar ni borrar. Puede transferir la titularidad a otro usuario. |
| **Administrador** | Todo, salvo tocar al Owner. Gestiona usuarios y roles. |
| **Manager** | Ver, crear, editar todo, publicar y aprobar en Radio, Noticias, Cinevisión, Institucional y Publicidad. Sin acceso a Sistema. |
| **Editor** | Noticias completo (crear, editar todo, publicar, aprobar). Radio: entrevistas. Ve los mensajes de formularios. |
| **Periodista** | Noticias: crear y editar lo propio, sin publicar (envía a revisión). Radio: crear entrevistas. |
| **Colaborador** | Noticias: crear y editar lo propio en las secciones asignadas, sin publicar. Pensado para columnistas externos. |
| **Cinevisión** | Cinevisión completo. |
| **Comercial** | Publicidad completo. Ve los mensajes de "Publicidad". |

### Permisos por usuario

Cada usuario tiene **un rol** y, opcionalmente, **ajustes propios** que suman o quitan permisos sobre su rol. Ejemplo: un periodista de confianza con Noticias → Publicar activado, sin crear un rol nuevo. La ficha del usuario muestra con colores qué viene del rol y qué es ajuste propio.

### Delegación

Las reglas que hacen segura la delegación:

1. **Nadie da lo que no tiene.** Quien gestiona usuarios solo puede asignar roles y permisos que él mismo tiene. Un administrador no puede crear a otro con más poder que el suyo.
2. **Gestionar usuarios es un permiso** (Sistema → Editar todo en Usuarios). El Owner decide a quién se lo da.
3. **Nadie se modifica a sí mismo** el rol ni los permisos.
4. **El Owner es intocable** para todos los demás. Solo él transfiere la titularidad, con confirmación por email.
5. **Todo cambio de permisos queda registrado:** quién, a quién, qué cambió y cuándo. Lo ven el Owner y los administradores en "Registro de cambios".

### Cómo se aplica

Los permisos se verifican en el servidor en cada pedido, no solo ocultando botones. Un usuario sin permiso no puede hacer la acción ni llamando a la API directamente. Esto se prueba con tests automáticos por rol.

---

## 2. Usuarios: alta, ingreso y seguridad

### Alta por invitación

No hay registro público. Solo alguien con permiso de gestionar usuarios crea cuentas:

1. Carga nombre, email, rol y, si hace falta, ajustes propios o secciones permitidas.
2. El sistema manda una **invitación por email** con un link que vale 48 h.
3. La persona abre el link, elige su contraseña (mínimo 12 caracteres, se rechazan las filtradas conocidas) y entra.
4. Si el link vence, se reenvía la invitación desde la ficha.

### Ingreso

Dos pasos, en este orden:

1. **Cloudflare Access** pide el email y manda un código de un solo uso (o entra con Google). Solo pasan los emails de usuarios activos: al crear o desactivar un usuario, el panel actualiza la lista de Access sola.
2. **Login del panel** con email y contraseña. Tras 5 intentos fallidos la cuenta se bloquea 10 minutos.

El primer paso cumple la función de verificación en dos pasos (2FA) sin que nadie instale una app.

### Sesiones y recuperación

- La sesión dura 7 días en el mismo dispositivo.
- "Olvidé mi contraseña" manda un link que vale 1 h.
- Cambiar la contraseña cierra las demás sesiones.
- El usuario ve en su perfil sus sesiones abiertas y puede cerrarlas.

### Bajas

Los usuarios **se desactivan, no se borran**: así sus notas conservan la firma y el historial. Desactivar cierra todas sus sesiones y lo saca de Cloudflare Access al instante.

---

## 3. Publicidad

### Cómo funciona

Se carga **cada anuncio una sola vez** y se elige **en qué ubicaciones aparece**. Un mismo anuncio puede salir en Noticias y en Programación sin duplicarse, y no salir en Institucional.

### Ubicaciones

Son los espacios que tiene el diseño: uno por página, siempre en la zona de primer impacto. Cinevisión y Película no tienen.

| Ubicación | Dónde aparece |
|---|---|
| Inicio | Entre el hero en vivo y Noticias |
| Radio · En vivo | Debajo del reproductor |
| Radio · Programación | Debajo de la banda "Al aire" |
| Radio · Entrevistas | Arriba del listado |
| Noticias · Listado | Arriba de la destacada |
| Noticias · Sección | Arriba del listado de la sección (se puede elegir qué secciones) |
| Noticias · Nota | Arriba del título (se puede elegir notas de qué secciones) |
| Institucional | Arriba del contenido |
| Institucional · Sumarse, Publicidad, Contacto | Arriba del formulario |

### Al cargar un anuncio

1. **Creatividad:** imagen 970×90 (escritorio) e imagen 320×100 (celular), con validación de medidas, y link de destino.
2. **Dónde:** casillas con las ubicaciones. Atajos: "Todas", "Todo Radio", "Todo Noticias". En Sección y Nota, además, qué secciones (por ejemplo, solo Deportes).
3. **Cuándo:** fecha de inicio y fin.
4. **Peso:** cuántas veces sale en la rotación comparado con los otros anuncios de la misma ubicación (1 = normal, 2 = el doble).
5. Guarda: el anuncio entra en rotación en esas ubicaciones durante su vigencia, sin tocar nada más.

### Vista por ubicación

Desde "Ubicaciones" se ve, para cada espacio, qué anuncios rotan hoy y cuáles están programados. Si un espacio queda sin anuncios, muestra el **aviso propio de la radio** ("Anunciá en Visión" con link a Publicidad), así nunca queda un hueco.

### Métricas

Cada anuncio muestra impresiones y clics totales, por ubicación y por día, y se exporta a CSV para enviarle al anunciante.

---

## 4. Impacto en el plan

| Cambio | Horas extra estimadas |
|---|---|
| Roles editables, grilla de permisos, ajustes por usuario, restricción por sección, delegación y registro de cambios | 14–20 h |
| Invitaciones, sincronización con Cloudflare Access, sesiones visibles | 6–8 h |
| Ubicaciones, segmentación por sección, peso, aviso propio, métricas por ubicación y CSV | 6–9 h |
| **Total** | **26–37 h** |

El total del proyecto pasa a **264–371 h**.
