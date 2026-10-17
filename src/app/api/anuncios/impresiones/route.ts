import config from '@payload-config'
import { getPayload } from 'payload'

import { anunciosVigentes } from '@/sitio/datos/anuncios'
import { ipDe } from '@/sitio/formularios/servidor'
import { sumarMetrica } from '@/sitio/publicidad/contador'
import { superaLimiteImpresiones } from '@/sitio/publicidad/limite'
import { esRobot, esUbicacion } from '@/sitio/publicidad/rotacion'

export const dynamic = 'force-dynamic'

const MAXIMO_POR_ENVIO = 10

const sinContenido = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

/**
 * POST /api/anuncios/impresiones con `{ ubicacion, ids }`: el navegador avisa qué anuncios se vieron
 * (docs/02-trd.md, sección 4). Solo suman los que de verdad rotan hoy en esa ubicación, y cada conexión
 * tiene un tope por minuto, así nadie infla los números de un anuncio.
 */
export async function POST(request: Request) {
  if (esRobot(request.headers.get('user-agent'))) return sinContenido()
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return Response.json(
      { error: { codigo: 'VALIDACION', mensaje: 'Formato inválido.' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const { ubicacion, ids } = (cuerpo ?? {}) as { ubicacion?: unknown; ids?: unknown }
  const lista = Array.isArray(ids)
    ? [...new Set(ids.filter((i): i is number => Number.isInteger(i) && i > 0))].slice(0, MAXIMO_POR_ENVIO)
    : []
  if (!esUbicacion(ubicacion) || lista.length === 0) {
    return Response.json(
      { error: { codigo: 'VALIDACION', mensaje: 'Ubicación o anuncios inválidos.' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (superaLimiteImpresiones(ipDe(request), lista.length)) {
    return Response.json(
      { error: { codigo: 'DEMASIADOS_ENVIOS', mensaje: 'Demasiadas impresiones seguidas.' } },
      { status: 429, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const vigentes = new Set((await anunciosVigentes(ubicacion)).map((a) => a.id))
  const payload = await getPayload({ config })
  for (const anuncio of lista.filter((id) => vigentes.has(id))) {
    await sumarMetrica(payload, { anuncio, ubicacion, impresiones: 1 }).catch((err: unknown) =>
      payload.logger.error({ err, msg: `No se pudo sumar la impresión del anuncio ${anuncio}` }),
    )
  }
  return sinContenido()
}
