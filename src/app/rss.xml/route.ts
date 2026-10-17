import { notasParaRss } from '@/sitio/datos/seo'
import { urlDelSitio } from '@/sitio/lib/compartir'
import { respuesta } from '@/sitio/seo/respuesta'
import { NOMBRE_DEL_SITIO, rss } from '@/sitio/seo/xml'

export const dynamic = 'force-dynamic'

/** GET /rss.xml: las últimas notas, para lectores de RSS y agregadores. */
export async function GET() {
  const xml = rss(
    urlDelSitio().origin,
    {
      titulo: `Noticias · ${NOMBRE_DEL_SITIO}`,
      descripcion: 'Las últimas noticias de Fray Bentos y Río Negro, de Visión 96.5 FM.',
      ruta: '/rss.xml',
    },
    await notasParaRss(),
  )
  return respuesta(xml, 'application/rss+xml')
}
