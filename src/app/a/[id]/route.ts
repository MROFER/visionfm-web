import config from '@payload-config'
import { getPayload } from 'payload'

import { sumarMetrica } from '@/sitio/publicidad/contador'
import { esRobot, esUbicacion } from '@/sitio/publicidad/rotacion'

export const dynamic = 'force-dynamic'

/**
 * GET /a/{id}?u={ubicacion}: link de salida de un anuncio. Suma un clic en esa ubicación y redirige al
 * destino que cargó el área comercial (docs/02-trd.md, sección 4). Sin destino, va a la portada.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sitio = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const ir = (destino: string) =>
    new Response(null, { status: 302, headers: { Location: destino, 'Cache-Control': 'no-store' } })

  const numero = Number(id)
  if (!Number.isInteger(numero) || numero <= 0) return ir(new URL('/', sitio).toString())

  const payload = await getPayload({ config })
  // Como visitante: un anuncio desactivado no se lee y no suma
  const anuncio = await payload
    .findByID({ collection: 'anuncios', id: numero, depth: 0, overrideAccess: false, select: { link: true } })
    .catch(() => null)
  if (!anuncio) return ir(new URL('/', sitio).toString())

  const ubicacion = new URL(request.url).searchParams.get('u')
  if (esUbicacion(ubicacion) && !esRobot(request.headers.get('user-agent'))) {
    await sumarMetrica(payload, { anuncio: numero, ubicacion, clics: 1 }).catch((err: unknown) =>
      payload.logger.error({ err, msg: `No se pudo sumar el clic del anuncio ${numero}` }),
    )
  }
  return ir(destinoSeguro(anuncio.link, sitio))
}

/** Solo links web o rutas del propio sitio: nada de `javascript:` ni otros esquemas. */
function destinoSeguro(link: string | null | undefined, sitio: string) {
  try {
    const url = new URL(link?.trim() || '/', sitio)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : new URL('/', sitio).toString()
  } catch {
    return new URL('/', sitio).toString()
  }
}
