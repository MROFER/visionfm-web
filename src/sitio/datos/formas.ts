import type { Medio, Noticia, Pelicula } from '@/payload-types'

// Lo que viaja a los componentes: solo los campos que muestran, sin el documento entero de Payload.

export type Imagen = {
  url: string
  alt: string
  ancho: number
  alto: number
  /** Versiones redimensionadas para srcset, de menor a mayor. */
  tamanos: { url: string; ancho: number }[]
}

export function aImagen(m: number | Medio | null | undefined): Imagen | null {
  if (!m || typeof m !== 'object' || !m.url) return null
  const tamanos = Object.values(m.sizes ?? {})
    .filter((t): t is { url: string; width: number } => Boolean(t?.url && t.width))
    .map((t) => ({ url: t.url, ancho: t.width }))
    .sort((a, b) => a.ancho - b.ancho)
  return { url: m.url, alt: m.alt ?? '', ancho: m.width ?? 0, alto: m.height ?? 0, tamanos }
}

export type TarjetaNota = {
  id: number
  titulo: string
  bajada: string
  href: string
  seccion: { nombre: string; slug: string } | null
  fecha: string | null
  foto: Imagen | null
}

export function aTarjetaNota(n: Noticia): TarjetaNota {
  const seccion = typeof n.seccion === 'object' ? { nombre: n.seccion.nombre, slug: n.seccion.slug } : null
  return {
    id: n.id,
    titulo: n.titulo,
    bajada: n.bajada,
    href: seccion ? `/noticias/${seccion.slug}/${n.slug}` : '/noticias',
    seccion,
    fecha: n.fechaPublicacion ?? null,
    foto: aImagen(n.foto),
  }
}

export type TarjetaPelicula = {
  id: number
  titulo: string
  slug: string
  genero: string
  duracion: number
  calificacion: Pelicula['calificacion']
  sinopsis: string
  esEstreno: boolean
  afiche: Imagen | null
}

export function aTarjetaPelicula(p: Pelicula): TarjetaPelicula {
  return {
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    genero: p.genero,
    duracion: p.duracion,
    calificacion: p.calificacion,
    sinopsis: p.sinopsis,
    esEstreno: Boolean(p.esEstreno),
    afiche: aImagen(p.afiche),
  }
}
