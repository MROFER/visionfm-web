import { obtenerTablaRedirecciones } from '@/base/redirecciones/datos'

export const dynamic = 'force-dynamic'

/** GET /api/redirecciones: la tabla que usa src/proxy.ts. La pide el propio servidor, no el navegador. */
export async function GET() {
  return Response.json(await obtenerTablaRedirecciones(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
