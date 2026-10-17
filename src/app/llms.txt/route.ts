import { obtenerAjustes, obtenerCartelera, obtenerGrilla, obtenerSecciones } from '@/sitio/datos'
import { notasParaRss } from '@/sitio/datos/seo'
import { urlDelSitio } from '@/sitio/lib/compartir'
import { hoyEnMontevideo } from '@/sitio/lib/fecha'
import { llmsTxt } from '@/sitio/seo/llms'
import { respuesta } from '@/sitio/seo/respuesta'

export const dynamic = 'force-dynamic'

/** GET /llms.txt: el sitio resumido para asistentes de IA. */
export async function GET() {
  const [ajustes, secciones, notas, cartelera, grilla] = await Promise.all([
    obtenerAjustes(),
    obtenerSecciones(),
    notasParaRss(),
    obtenerCartelera(hoyEnMontevideo()),
    obtenerGrilla(),
  ])
  const texto = llmsTxt(urlDelSitio().origin, {
    ...ajustes,
    secciones,
    notas: notas.slice(0, 15),
    peliculas: cartelera.map((p) => ({ titulo: p.titulo, slug: p.slug })),
    programas: grilla,
  })
  return respuesta(texto, 'text/plain')
}
