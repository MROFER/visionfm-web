import type { Entrevista, Medio, Noticia, Pelicula } from '@/payload-types'

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

export type TarjetaEntrevista = {
  id: number
  slug: string
  entrevistado: string
  tema: string
  resumen: string
  fecha: string
  /** Segundos, o null si el panel todavía no la calculó. */
  duracion: number | null
  programa: { nombre: string; slug: string } | null
  foto: Imagen | null
  /** Ruta pública del audio, o null si la entrevista no tiene. */
  audio: string | null
}

export function aTarjetaEntrevista(e: Entrevista): TarjetaEntrevista {
  return {
    id: e.id,
    slug: e.slug,
    entrevistado: e.entrevistado,
    tema: e.tema,
    resumen: e.resumen ?? '',
    fecha: e.fecha,
    duracion: e.duracion ?? null,
    programa: typeof e.programa === 'object' && e.programa ? { nombre: e.programa.nombre, slug: e.programa.slug } : null,
    foto: aImagen(e.foto),
    audio: e.audio ? `/api/entrevistas/${encodeURIComponent(e.slug)}/audio` : null,
  }
}
