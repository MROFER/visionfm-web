import { obtenerExcepciones, obtenerGrilla } from '@/sitio/datos'

export const dynamic = 'force-dynamic'

/**
 * GET /api/grilla: la grilla semanal compacta y las excepciones de los próximos 7 días (docs/02-trd.md,
 * sección 4). El navegador la pide al cargar, así "Al aire" toma un partido recién cargado aunque el
 * HTML venga de la caché. Cloudflare la guarda y se purga al guardar programas o excepciones.
 */
export async function GET() {
  const [programas, excepciones] = await Promise.all([obtenerGrilla(), obtenerExcepciones()])
  return Response.json(
    { programas, excepciones },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=600' } },
  )
}
