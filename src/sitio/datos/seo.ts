import { unstable_cache } from 'next/cache'

import { aImagen } from './formas'
import { payload } from './index'

// Lecturas para sitemaps, RSS y llms.txt: solo lo publicado, con los campos justos para listar miles de URL.

const publico = { overrideAccess: false } as const

/** Un sitemap admite hasta 50.000 URL. */
const MAXIMO = 50_000

export const notasParaSitemap = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'noticias',
      sort: '-fechaPublicacion',
      limit: MAXIMO,
      pagination: false,
      depth: 1,
      select: {
        titulo: true,
        slug: true,
        seccion: true,
        fechaPublicacion: true,
        fechaActualizacion: true,
        updatedAt: true,
        foto: true,
      },
      populate: { secciones: { slug: true } },
      ...publico,
    })
    return docs.flatMap((n) => {
      if (typeof n.seccion !== 'object' || !n.seccion) return []
      const foto = typeof n.foto === 'object' && n.foto?.url ? n.foto.url : null
      return [
        {
          ruta: `/noticias/${n.seccion.slug}/${n.slug}`,
          titulo: n.titulo,
          fecha: n.fechaPublicacion ?? n.updatedAt,
          modificada: n.fechaActualizacion ?? n.updatedAt,
          imagenes: foto ? [foto] : [],
        },
      ]
    })
  },
  ['seo-notas'],
  // revalidate: la ventana de 48 h de Google News avanza aunque nadie publique
  { tags: ['noticias'], revalidate: 3600 },
)

export const CANTIDAD_RSS = 30

export const notasParaRss = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'noticias',
      sort: '-fechaPublicacion',
      limit: CANTIDAD_RSS,
      depth: 1,
      select: {
        titulo: true,
        slug: true,
        bajada: true,
        seccion: true,
        fechaPublicacion: true,
        updatedAt: true,
        foto: true,
      },
      populate: { secciones: { slug: true, nombre: true } },
      ...publico,
    })
    return docs.flatMap((n) => {
      if (typeof n.seccion !== 'object' || !n.seccion) return []
      const foto = aImagen(n.foto)
      // En el lector va una versión mediana: la original de un celular pesa varios MB
      const version = foto?.tamanos.filter((t) => t.ancho <= 1200).at(-1)
      const imagen = foto
        ? version
          ? {
              url: version.url,
              ancho: version.ancho,
              alto: Math.round((foto.alto * version.ancho) / (foto.ancho || version.ancho)),
            }
          : { url: foto.url, ancho: foto.ancho, alto: foto.alto }
        : null
      return [
        {
          ruta: `/noticias/${n.seccion.slug}/${n.slug}`,
          titulo: n.titulo,
          bajada: n.bajada,
          fecha: n.fechaPublicacion ?? n.updatedAt,
          seccion: n.seccion.nombre,
          imagen,
        },
      ]
    })
  },
  ['seo-rss'],
  { tags: ['noticias'] },
)

export const peliculasParaSitemap = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'peliculas',
      sort: '-updatedAt',
      limit: MAXIMO,
      pagination: false,
      depth: 1,
      select: { slug: true, updatedAt: true, afiche: true },
      ...publico,
    })
    return docs.map((pel) => {
      const afiche = typeof pel.afiche === 'object' && pel.afiche?.url ? pel.afiche.url : null
      return {
        ruta: `/cinevision/${pel.slug}`,
        modificada: pel.updatedAt,
        imagenes: afiche ? [afiche] : [],
      }
    })
  },
  ['seo-peliculas'],
  { tags: ['cartelera'] },
)

/** Entrevistas no tienen página propia: van el archivo y la pestaña de cada programa que tiene alguna. */
export const entrevistasParaSitemap = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'entrevistas',
      sort: '-fecha',
      limit: MAXIMO,
      pagination: false,
      depth: 1,
      select: { programa: true, fecha: true, updatedAt: true },
      populate: { programas: { slug: true } },
      ...publico,
    })
    // '' es el archivo completo, que va aunque todavía no haya entrevistas
    const ultima = new Map<string, string | null>([['', null]])
    const anotar = (clave: string, fecha: string) => {
      const actual = ultima.get(clave)
      if (!actual || fecha > actual) ultima.set(clave, fecha)
    }
    for (const e of docs) {
      anotar('', e.updatedAt)
      if (typeof e.programa === 'object' && e.programa) anotar(e.programa.slug, e.updatedAt)
    }
    return [...ultima].map(([programa, modificada]) => ({
      ruta: programa
        ? `/radio/entrevistas?programa=${encodeURIComponent(programa)}`
        : '/radio/entrevistas',
      modificada,
    }))
  },
  ['seo-entrevistas'],
  { tags: ['entrevistas', 'programas'] },
)

export const paginasLegales = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'paginas',
      sort: 'titulo',
      limit: 50,
      depth: 0,
      select: { titulo: true, slug: true, updatedAt: true },
      ...publico,
    })
    return docs.map((d) => ({
      titulo: d.titulo,
      ruta: `/legal/${d.slug}`,
      modificada: d.updatedAt,
    }))
  },
  ['seo-paginas'],
  { tags: ['paginas'] },
)
