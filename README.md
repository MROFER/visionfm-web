# visionfm-web

Nuevo sitio de Visión 96.5 FM (Fray Bentos): web pública y panel de gestión con Next.js y Payload CMS.

- Documentación: [`docs/`](docs/README.md)
- Diseño (Labs Fray Bentos): [`design/LEEME.md`](design/LEEME.md)

## Desarrollo local

Requisitos: Node 22, pnpm 10 y Docker.

```bash
cp .env.example .env          # completar PAYLOAD_SECRET con cualquier texto largo
docker compose up -d db       # Postgres 16
pnpm install
pnpm migrate                  # crea las tablas
pnpm seed                     # datos de ejemplo (opcional)
pnpm dev                      # sitio en http://localhost:3000, panel en /admin
```

Para levantar todo como en producción: `docker compose up --build`.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/app/(sitio)` | web pública |
| `src/app/(payload)` | panel en `/admin` y API de Payload en `/cms-api` (va detrás de Cloudflare Access) |
| `src/app/api` | rutas públicas propias (`/api/salud`, y más adelante grilla, anuncios, búsqueda, formularios) |
| `src/base` | lo reutilizable entre clientes; no puede importar de `src/sitio` (lo controla el lint) |
| `src/sitio` | lo propio de la radio |
| `src/migrations` | migraciones de Postgres versionadas |
| `src/seed` | datos de ejemplo para `pnpm seed` |
| `src/migracion` | migración de las notas del WordPress viejo (`pnpm migrar:wordpress`) |

## Comandos

| Comando | Para qué |
|---|---|
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | lo mismo que corre el CI |
| `pnpm migrate:create nombre` | nueva migración después de cambiar colecciones |
| `pnpm seed` | carga datos de ejemplo; solo en local, staging y la demo, y no duplica si se corre de nuevo. No crea usuarios: la primera cuenta del panel queda como Owner |
| `pnpm migrar:wordpress` | trae las notas del WordPress viejo sin spam y arma las redirecciones; se puede repetir sin duplicar. `--seco` solo informa, `--limite=20` prueba con pocas, `--seccion=locales` elige la sección por defecto. Deja el informe en `migracion-informe/`; lo que se corrige a mano va en `src/migracion/revision.ts` |
| `pnpm generate:types` | actualiza `src/payload-types.ts` |
| `pnpm generate:importmap` | después de sumar componentes propios al panel |

## Ramas

Cada cambio entra por PR a `staging`; de `staging` a `main` con "Create a merge commit". Las dos ramas están protegidas.
