# Servidor de la demo · Oracle Cloud Always Free

Guía para levantar `visionfm-labs.fraybentos.uy` en un servidor gratis de Oracle, con Coolify igual que producción (docs/05-plan.md). Todo va en cuentas de la agencia.

**Cómo queda:** el servidor no tiene ningún puerto abierto al público. El sitio y el panel de Coolify llegan por un túnel de Cloudflare, y los dos van detrás de Access (la demo no se indexa ni la ve cualquiera, docs/06-revision.md).

**Reglas de seguridad:** las contraseñas y claves se escriben solo en el servidor o en el panel donde se usan; nunca por chat, WhatsApp ni email. La clave SSH privada queda en la computadora de quien administra el servidor.

## 1. Cuenta de Oracle Cloud

1. Entrar a <https://www.oracle.com/cloud/free/> y tocar **Start for free**.
2. Usar un email de la agencia (no uno personal ni de la radio).
3. **Home region: Chile Central (Santiago).** Es la de la cuenta de la agencia y no se puede cambiar después.
4. Piden una tarjeta solo para verificar identidad; no cobran mientras se use lo gratis.
5. Al entrar, activar la verificación en dos pasos (Profile → My profile → Multi-factor authentication).

La cuenta puede tardar desde minutos hasta un día en quedar activa.

## 2. Crear la máquina

En el menú: **Compute → Instances → Create instance**.

| Campo | Valor |
|---|---|
| Name | `visionfm-demo` |
| Image | **Canonical Ubuntu 24.04** (la versión para ARM, *aarch64*) |
| Shape | **Ampere → VM.Standard.A1.Flex**, 4 OCPU y 24 GB de memoria (el máximo gratis) |
| Networking | dejar la red que crea por defecto, con IP pública |
| SSH keys | **Generate a key pair for me** → bajar la clave privada y guardarla en la computadora |
| Boot volume | 100 GB |

Si aparece *Out of capacity*, probar otro *Availability domain* o reintentar más tarde: es común en la capa gratis.

Anotar la **IP pública** que muestra la instancia al terminar.

## 3. Instalar Coolify

Desde la computadora donde quedó la clave (en Windows, la terminal de PowerShell):

```sh
ssh -i ruta/a/la-clave.key ubuntu@IP_PUBLICA
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Tarda unos minutos. Después, desde la computadora, abrir el panel por el propio SSH (así todavía no queda expuesto a internet):

```sh
ssh -i ruta/a/la-clave.key -L 8000:localhost:8000 ubuntu@IP_PUBLICA
```

y entrar a <http://localhost:8000>. **Crear enseguida la cuenta de administrador**: la primera persona que entra al panel queda como dueña.

## 4. Túnel de Cloudflare

En Cloudflare: **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**.

1. Nombre: `visionfm-demo`.
2. Elegir **Debian** y **arm64**. Cloudflare muestra un comando de instalación que incluye la clave del túnel: copiarlo y pegarlo **directo en el servidor** (por SSH). No pegarlo en ningún otro lado.
3. En **Public hostnames** cargar dos:

| Subdominio | Servicio |
|---|---|
| `visionfm-labs.fraybentos.uy` | `http://localhost:80` (el proxy de Coolify) |
| `coolify-labs.fraybentos.uy` | `http://localhost:8000` (el panel de Coolify) |

4. En **Access → Applications**, crear una aplicación *Self-hosted* para cada subdominio, con una política que deje entrar solo a los emails de la agencia (y después a los de la radio, para la demo).

Con el túnel andando, en Oracle se puede cerrar el puerto 22 al público (Networking → Virtual cloud networks → la red → Security lists → borrar la regla del 22 o limitarla a la IP de la agencia).

## 5. La imagen del sitio

GitHub Actions publica la imagen en `ghcr.io/mrofer/visionfm-web` con las dos arquitecturas (amd64 y arm64). GitHub la crea privada aunque el repo sea público: en GitHub, **Packages → visionfm-web → Package settings → Change visibility → Public**. La imagen no lleva ninguna clave, así que puede ser pública.

## 6. Proyecto en Coolify

En el panel (<https://coolify-labs.fraybentos.uy>):

1. **Projects → New** → `visionfm`.
2. **+ New → Database → PostgreSQL 16**. Coolify genera usuario y contraseña; copiar la *Postgres URL (internal)*.
3. **+ New → Docker Image** → `ghcr.io/mrofer/visionfm-web:staging` (cuando exista `main`, la demo pasa a `:main`).
   - **Domains:** `http://visionfm-labs.fraybentos.uy` (con `http`: el HTTPS lo pone Cloudflare; con `https` acá el túnel entra en un bucle de redirecciones).
   - **Ports exposes:** `3000`.
   - **Environment variables:**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la *Postgres URL (internal)* del paso 2 |
| `PAYLOAD_SECRET` | una clave larga al azar: en el servidor, `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://visionfm-labs.fraybentos.uy` |

   - **Persistent storage:** dos *Directory mounts*: `/data/visionfm/medios` → `/app/medios` y `/data/visionfm/archivos` → `/app/archivos`. Antes, en el servidor: `sudo mkdir -p /data/visionfm/medios /data/visionfm/archivos && sudo chown -R 1001:1001 /data/visionfm`.
4. **Deploy.** Al arrancar, el sitio aplica solo las migraciones de la base.

Sin las variables `R2_*` las fotos quedan en el disco del servidor; sin `CF_ACCESS_*` el panel `/admin` no valida el JWT de Access en el servidor (Access igual lo protege desde Cloudflare). Las dos cosas se suman cuando se creen esas claves.

## 7. Datos de ejemplo

La imagen del sitio no trae las herramientas para cargar datos, así que se arma una aparte en el servidor, una sola vez:

```sh
docker build -t visionfm-semilla --target builder -f docker/Dockerfile https://github.com/MROFER/visionfm-web.git#staging
docker run --rm --network coolify \
  -e DATABASE_URL='la Postgres URL (internal)' -e PAYLOAD_SECRET='la misma del paso 6' \
  -v /data/visionfm/medios:/app/medios -v /data/visionfm/archivos:/app/archivos \
  visionfm-semilla pnpm seed
sudo chown -R 1001:1001 /data/visionfm
```

Después, entrar a <https://visionfm-labs.fraybentos.uy>.

## 8. Actualizaciones

Cada merge a `staging` publica una imagen nueva. En Coolify, **Redeploy** la descarga y la levanta (o activar el webhook de Coolify para que lo haga solo).
