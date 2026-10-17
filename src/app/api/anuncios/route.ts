import { anunciosVigentes } from '@/sitio/datos/anuncios'
import { esUbicacion } from '@/sitio/publicidad/rotacion'

export const dynamic = 'force-dynamic'

const SLUG = /^[a-z0-9-]{1,80}$/

/**
 * GET /api/anuncios?ubicacion=…&seccion=…: los anuncios que rotan hoy en esa ubicación (docs/02-trd.md,
 * sección 4). El navegador elige uno por visita. Cloudflare lo guarda 5 minutos y se purga al guardar
 * un anuncio.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const ubicacion = params.get('ubicacion')
  const seccion = params.get('seccion') ?? undefined
  if (!esUbicacion(ubicacion) || (seccion !== undefined && !SLUG.test(seccion))) {
    return Response.json(
      { error: { codigo: 'VALIDACION', mensaje: 'Ubicación o sección inválida.' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const anuncios = await anunciosVigentes(ubicacion, seccion)
  return Response.json(
    { anuncios },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
  )
}
