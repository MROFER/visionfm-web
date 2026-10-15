import { unstable_cache } from 'next/cache'

import { aImagen, aTarjetaPelicula } from './formas'
import { payload } from './index'

// Lecturas de la página de Cinevisión y de cada película. La cartelera de la semana sale de
// obtenerCartelera (datos/index.ts), que también usa el Inicio.

const publico = { overrideAccess: false } as const

/** El carrusel, los precios y "Cómo llegar" que carga la radio en Cinevisión. */
export const obtenerCinevision = unstable_cache(
  async () => {
    const p = await payload()
    const c = await p.findGlobal({ slug: 'cinevision', depth: 1, ...publico })
    return {
      carrusel: [...(c.carrusel ?? [])]
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((s) => ({ web: aImagen(s.imagenWeb), movil: aImagen(s.imagenMovil), alt: s.alt, link: s.link ?? '' }))
        .filter((s): s is DiapositivaCine => Boolean(s.web && s.movil)),
      precios: (c.precios ?? []).map(({ concepto, precio }) => ({ concepto, precio })),
      promociones: (c.promociones ?? []).map(({ titulo, detalle }) => ({ titulo, detalle: detalle ?? '' })),
      comoSeCompran: c.comoSeCompran ?? '',
      comoLlegar: {
        direccion: c.comoLlegar?.direccion ?? '',
        mapa: aImagen(c.comoLlegar?.mapaImagen),
        mapaLink: c.comoLlegar?.mapaLink ?? '',
        telefono: c.comoLlegar?.telefono ?? '',
      },
    }
  },
  ['cinevision'],
  { tags: ['cinevision'] },
)

export type DatosCinevision = Awaited<ReturnType<typeof obtenerCinevision>>
export type DiapositivaCine = {
  web: NonNullable<ReturnType<typeof aImagen>>
  movil: NonNullable<ReturnType<typeof aImagen>>
  alt: string
  link: string
}

/** Películas con fecha de estreno después de hoy, la más cercana primero. */
export const proximosEstrenos = unstable_cache(
  async (hoy: string, cantidad: number) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'peliculas',
      where: { fechaEstreno: { greater_than: `${hoy}T23:59:59-03:00` } },
      sort: 'fechaEstreno',
      limit: cantidad,
      depth: 1,
      ...publico,
    })
    return docs.map((d) => ({ ...aTarjetaPelicula(d), fechaEstreno: d.fechaEstreno! }))
  },
  ['proximos-estrenos'],
  { tags: ['cartelera'], revalidate: 3600 },
)

/** La ficha completa de una película publicada. Las funciones salen de la cartelera de la semana. */
export const obtenerPelicula = unstable_cache(
  async (slug: string) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'peliculas',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      ...publico,
    })
    const d = docs[0]
    if (!d) return null
    return {
      ...aTarjetaPelicula(d),
      tituloOriginal: d.tituloOriginal ?? '',
      anio: d.anio ?? null,
      idiomas: d.idiomas ?? [],
      formatos: d.formatos ?? [],
      trailer: d.trailer ?? '',
      fechaEstreno: d.fechaEstreno ?? null,
      creditos: {
        direccion: d.creditos?.direccion ?? '',
        reparto: d.creditos?.reparto ?? '',
        guion: d.creditos?.guion ?? '',
        pais: d.creditos?.pais ?? '',
        idiomaOriginal: d.creditos?.idiomaOriginal ?? '',
        distribuidora: d.creditos?.distribuidora ?? '',
      },
      seo: {
        titulo: d.seo?.titulo || d.titulo,
        descripcion: d.seo?.descripcion || d.sinopsis.slice(0, 160),
      },
    }
  },
  ['pelicula'],
  { tags: ['cartelera'] },
)

export type PeliculaCompleta = NonNullable<Awaited<ReturnType<typeof obtenerPelicula>>>
