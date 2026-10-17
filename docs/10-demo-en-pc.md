# La demo en una PC con Windows

Mientras no haya servidor, la demo corre en una PC con Windows y Docker Desktop. La PC no compila el sitio: descarga la imagen que publica GitHub Actions (`ghcr.io/mrofer/visionfm-web:staging`) y un túnel de Cloudflare la publica en `visionfm-labs-staging.fraybentos.uy`, detrás de Access. Todo está en [`compose.demo.yml`](../compose.demo.yml).

**Cómo queda:** la PC no abre ningún puerto a internet. El sitio sale solo por el túnel y nadie entra sin pasar por Access (la demo no se indexa ni la ve cualquiera, docs/06-revision.md). La demo está en línea mientras la PC esté prendida y con Docker Desktop abierto.

**Reglas de seguridad:** las claves se generan y se escriben solo en la PC, en el archivo `.env` de la carpeta de la demo. Nunca por chat, WhatsApp ni email.

## Qué necesita la PC

| | |
|---|---|
| Sistema | Windows 10 (22H2) u 11, de 64 bits |
| Memoria | 8 GB anda bien; con 4 GB arranca, pero la PC queda lenta mientras corre |
| Disco | unos 10 GB libres |
| Docker Desktop | <https://www.docker.com/products/docker-desktop/>; en la instalación dejar marcado **Use WSL 2** |

Para que Docker no se coma toda la memoria de la PC, antes de abrir Docker Desktop por primera vez pegar esto en PowerShell (le pone un tope de 5 GB; la demo usa bastante menos):

```powershell
Set-Content "$env:USERPROFILE\.wslconfig" "[wsl2]`r`nmemory=5GB" -Encoding ascii
wsl --shutdown
```

En Docker Desktop, **Settings → General → Start Docker Desktop when you sign in**, así la demo vuelve sola si la PC se reinicia. En Windows, **Configuración → Sistema → Inicio/apagado y suspensión → Suspender: Nunca** (enchufada), porque con la PC suspendida la demo se cae.

## 1. Túnel de Cloudflare

En Cloudflare: **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**.

1. Nombre: `visionfm-demo`.
2. En el paso de instalación elegir **Docker**. Cloudflare muestra un comando que termina en `--token` y una clave larga. Esa clave es el **token del túnel**: va solo en el `.env` de la PC (paso 2). No pegarla en ningún otro lado ni correr ese comando.
3. En **Public hostname**: subdominio `visionfm-labs-staging`, dominio `fraybentos.uy`, servicio **HTTP** `app:3000`.
4. En **Access → Applications → Add an application → Self-hosted**, para `visionfm-labs-staging.fraybentos.uy`, con una política que deje entrar solo a los emails de la agencia (y después a los de la radio, para mostrarla).

## 2. Carpeta y claves

Abrir **PowerShell** (botón Inicio, escribir "PowerShell") y pegar esto. Crea la carpeta `C:\visionfm-demo`, baja el archivo de la demo y genera las dos claves al azar en la propia PC:

```powershell
New-Item -ItemType Directory -Force C:\visionfm-demo | Out-Null
Set-Location C:\visionfm-demo
Invoke-WebRequest https://raw.githubusercontent.com/MROFER/visionfm-web/staging/compose.demo.yml -OutFile compose.yml
function Clave { $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join '' }
@(
  "POSTGRES_PASSWORD=$(Clave)"
  "PAYLOAD_SECRET=$(Clave)"
  "TUNNEL_TOKEN="
  "NEXT_PUBLIC_SITE_URL=https://visionfm-labs-staging.fraybentos.uy"
) | Set-Content -Encoding ascii .env
notepad .env
```

Se abre el Bloc de notas: pegar el token del túnel después de `TUNNEL_TOKEN=`, en la misma línea, guardar y cerrar. Las claves no hace falta anotarlas: quedan en ese archivo.

## 3. Levantar la demo

En la misma ventana de PowerShell (o en una nueva, después de `Set-Location C:\visionfm-demo`):

```powershell
docker compose up -d
docker compose ps
```

La primera vez baja las imágenes y tarda un rato según la conexión. Cuando `app` dice `healthy`, el sitio responde en <http://localhost:3000> desde la PC y, a través de Access, en <https://visionfm-labs-staging.fraybentos.uy>. Al arrancar, la app crea las tablas de la base sola.

## 4. Datos de ejemplo (una vez)

Con la demo ya levantada:

```powershell
docker compose run --rm semilla
```

La primera vez prepara las herramientas que hacen falta, sin compilar el sitio, y tarda varios minutos en una PC lenta. Termina con `Datos de ejemplo: … creados`. Si se corre de nuevo no duplica nada.

No crea usuarios: la primera cuenta del panel, en `/admin`, es la del Owner y la crea la radio.

## Uso diario

| Para | En `C:\visionfm-demo` |
|---|---|
| Ver si anda | `docker compose ps` |
| Ver qué pasa | `docker compose logs -f app` (Ctrl+C para salir) |
| Pasar a la última versión de staging | `docker compose pull` y después `docker compose up -d` |
| Apagarla (los datos quedan) | `docker compose down` |
| Volver a prenderla | `docker compose up -d` |

`docker compose down -v` **borra la base y los archivos subidos**: solo para empezar de cero.

**Antes de entregarle la demo a la radio:** la primera cuenta del panel (el Owner) la creó la agencia para probar. Hay que borrar todo con `docker compose down -v`, levantarla de nuevo y volver a cargar los datos de ejemplo, así la cuenta Owner real la crea la radio.

Cuando haya servidor, esta PC se apaga y la demo pasa allá con el mismo túnel (se cambia el destino en Cloudflare).
