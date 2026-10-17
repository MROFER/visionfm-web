import { NextResponse, type NextRequest } from 'next/server'

import { configJwt, verificarJwt } from './base/acceso/jwt'
import { buscar, type Tabla } from './base/redirecciones/tabla'

// /admin y /cms-api solo responden a pedidos que pasaron por Cloudflare Access (docs/02-trd.md).
// Sin CF_ACCESS_TEAM_DOMAIN y CF_ACCESS_AUD (local, tests) no se exige nada.
async function soloConAccess(request: NextRequest) {
  const cfg = configJwt()
  if (!cfg) return NextResponse.next()

  const token =
    request.headers.get('cf-access-jwt-assertion') ?? request.cookies.get('CF_Authorization')?.value
  if (await verificarJwt(token, cfg)) return NextResponse.next()

  return new NextResponse('Acceso denegado.', {
    status: 403,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// La tabla de redirecciones se pide al propio servidor y se guarda un minuto en memoria: cada pedido
// la consulta sin ir a la base, y un cambio en el panel se nota a más tardar al minuto.
const VIGENCIA = 60_000
let tabla: Tabla | null = null
let leida = 0
let pendiente: Promise<void> | null = null

async function cargar(request: NextRequest) {
  const puerto = process.env.PORT || request.nextUrl.port || '3000'
  try {
    const respuesta = await fetch(`http://127.0.0.1:${puerto}/api/redirecciones`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    if (respuesta.ok) {
      tabla = (await respuesta.json()) as Tabla
      leida = Date.now()
    }
  } catch {
    // Sin tabla el sitio sigue andando: las direcciones viejas dan 404 hasta el próximo intento
  }
}

async function tablaActual(request: NextRequest) {
  if (Date.now() - leida > VIGENCIA && !pendiente) {
    pendiente = cargar(request).finally(() => {
      pendiente = null
    })
  }
  // Solo el primer pedido espera; después se usa la tabla anterior mientras se renueva
  if (!tabla && pendiente) await pendiente
  return tabla ?? {}
}

const ELIMINADA = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página eliminada · Visión 96.5 FM</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1>Esta página ya no existe</h1><p>Se eliminó del sitio y no va a volver.</p><p><a href="/">Ir a la portada de Visión 96.5 FM</a></p></body></html>`

// Next exige una Location absoluta. Detrás del túnel de Cloudflare el servidor ve http: el protocolo
// sale de X-Forwarded-Proto, si no el navegador saltaría a http:// para volver a https://
function redirigir(request: NextRequest, destino: string, status: number, cache?: string) {
  const protocolo = request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
  const origen = protocolo
    ? `${protocolo}://${request.headers.get('host') ?? request.nextUrl.host}`
    : request.nextUrl.origin
  return NextResponse.redirect(new URL(destino, origen), {
    status,
    headers: cache ? { 'Cache-Control': cache } : undefined,
  })
}

async function redireccionVieja(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const destino = buscar(await tablaActual(request), pathname)

  if (destino?.tipo === '410') {
    return new NextResponse(ELIMINADA, {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  if (destino) {
    const conConsulta = destino.hacia.includes('?') ? destino.hacia : destino.hacia + search
    return redirigir(request, conConsulta, Number(destino.tipo), 'public, max-age=3600')
  }
  // Lo que Next haría solo (skipTrailingSlashRedirect en next.config.ts): /nota/ → /nota. Se hace
  // acá para que una nota vieja con barra final llegue a la nueva en un solo salto.
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return redirigir(request, pathname.replace(/\/+$/, '') + search, 308)
  }
  return NextResponse.next()
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/admin') || pathname.startsWith('/cms-api'))
    return soloConAccess(request)
  return redireccionVieja(request)
}

export const config = {
  // Todo menos los archivos de Next, las rutas propias de /api y los archivos estáticos
  matcher: [
    '/((?!_next/|api/|favicon\\.ico|marca/|fuentes/|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
}
