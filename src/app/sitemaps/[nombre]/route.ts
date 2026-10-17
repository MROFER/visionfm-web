import { obtenerSecciones } from '@/sitio/datos'
import {
  entrevistasParaSitemap,
  notasParaSitemap,
  paginasLegales,
  peliculasParaSitemap,
} from '@/sitio/datos/seo'
import { urlDelSitio } from '@/sitio/lib/compartir'
import { respuesta } from '@/sitio/seo/respuesta'
import { PAGINAS_FIJAS, SITEMAPS, type NombreDeSitemap } from '@/sitio/seo/rutas'
import { sitemap, sitemapDeNoticias, type UrlDelSitemap } from '@/sitio/seo/xml'

export const dynamic = 'force-dynamic'

const armar: Record<NombreDeSitemap, () => Promise<UrlDelSitemap[] | string>> = {
  general: async () => {
    const [secciones, paginas] = await Promise.all([obtenerSecciones(), paginasLegales()])
    return [
      ...PAGINAS_FIJAS.map((ruta) => ({ ruta })),
      ...secciones.map((s) => ({ ruta: `/noticias/${s.slug}` })),
      ...paginas,
    ]
  },
  noticias: notasParaSitemap,
  'google-news': async () => sitemapDeNoticias(urlDelSitio().origin, await notasParaSitemap()),
  entrevistas: entrevistasParaSitemap,
  peliculas: peliculasParaSitemap,
}

/** GET /sitemaps/{nombre}.xml: uno de los sitemaps del índice. */
export async function GET(_: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const nombre = (await params).nombre.replace(/\.xml$/, '') as NombreDeSitemap
  if (!SITEMAPS.includes(nombre)) return new Response('No existe.', { status: 404 })
  const resultado = await armar[nombre]()
  const xml = typeof resultado === 'string' ? resultado : sitemap(urlDelSitio().origin, resultado)
  return respuesta(xml, 'application/xml')
}
