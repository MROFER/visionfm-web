import { notasParaSitemap, entrevistasParaSitemap, peliculasParaSitemap } from '@/sitio/datos/seo'
import { urlDelSitio } from '@/sitio/lib/compartir'
import { respuesta } from '@/sitio/seo/respuesta'
import { SITEMAPS } from '@/sitio/seo/rutas'
import { indiceDeSitemaps, masNueva } from '@/sitio/seo/xml'

export const dynamic = 'force-dynamic'

/** GET /sitemap.xml: el índice con los sitemaps de cada tipo de contenido. */
export async function GET() {
  const [notas, entrevistas, peliculas] = await Promise.all([
    notasParaSitemap(),
    entrevistasParaSitemap(),
    peliculasParaSitemap(),
  ])
  // Una fecha futura no vale como lastmod (los datos de ejemplo traen notas con hora de más tarde)
  const ahora = new Date().toISOString()
  const hasta = (fecha: string | null) => (fecha && fecha > ahora ? ahora : fecha)
  const ultimaNota = hasta(masNueva(notas.map((n) => n.modificada)))
  const modificada: Record<(typeof SITEMAPS)[number], string | null> = {
    general: ultimaNota,
    noticias: ultimaNota,
    'google-news': hasta(masNueva(notas.map((n) => n.fecha))),
    entrevistas: masNueva(entrevistas.map((e) => e.modificada)),
    peliculas: masNueva(peliculas.map((p) => p.modificada)),
  }
  const xml = indiceDeSitemaps(
    urlDelSitio().origin,
    SITEMAPS.map((nombre) => ({ ruta: `/sitemaps/${nombre}.xml`, modificada: modificada[nombre] })),
  )
  return respuesta(xml, 'application/xml')
}
