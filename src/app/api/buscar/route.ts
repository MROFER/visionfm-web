import { listarEntrevistas, listarNoticias } from '@/sitio/datos'

export const dynamic = 'force-dynamic'

const error = (mensaje: string) =>
  Response.json(
    { error: { codigo: 'VALIDACION', mensaje } },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  )

/**
 * GET /api/buscar?en=noticias|entrevistas&q=&pagina=: búsqueda de texto completo (docs/02-trd.md,
 * sección 4). Las páginas de Noticias y Entrevistas buscan del lado del servidor con lo mismo; esta ruta
 * queda para pedirlo desde el navegador. El límite por IP lo pone el WAF de Cloudflare.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const en = params.get('en')
  const q = params.get('q')?.trim() ?? ''
  const pagina = Number(params.get('pagina') ?? 1)
  if (en !== 'noticias' && en !== 'entrevistas') return error('Elegí noticias o entrevistas.')
  if (q.length < 2 || q.length > 100) return error('La búsqueda va de 2 a 100 caracteres.')
  if (!Number.isInteger(pagina) || pagina < 1 || pagina > 100) return error('Página inválida.')

  const cabeceras = { 'Cache-Control': 'public, max-age=60, s-maxage=60' }
  if (en === 'noticias') {
    const { notas, ...resto } = await listarNoticias({ pagina, q })
    return Response.json({ resultados: notas, ...resto }, { headers: cabeceras })
  }
  const { entrevistas, ...resto } = await listarEntrevistas({ pagina, q })
  return Response.json({ resultados: entrevistas, ...resto }, { headers: cabeceras })
}
