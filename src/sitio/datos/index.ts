import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Equipo } from '@/payload-types'
import { enumerar } from '../lib/texto'
import { aImagen, aTarjetaNota, aTarjetaPelicula } from './formas'
import type { ProgramaGrilla } from './tipos'

// Lecturas del sitio público con la Local API. Cada una queda en la caché de Next con las etiquetas que
// los hooks refrescan al guardar (src/sitio/cache/mapa.ts), así la base solo se consulta cuando algo cambia.

export const payload = () => getPayload({ config })

export const obtenerAjustes = unstable_cache(
  async () => {
    const p = await payload()
    const a = await p.findGlobal({ slug: 'ajustes', depth: 1 })
    return {
      streamUrl: a.streamUrl ?? '',
      telefono: a.telefono ?? '',
      whatsapp: a.whatsapp ?? '',
      direccion: a.direccion ?? '',
      email: a.email ?? '',
      redes: (a.redes ?? []).map(({ red, url }) => ({ red, url })),
      avisoPropio: {
        web: aImagen(a.avisoPropio?.imagenWeb),
        movil: aImagen(a.avisoPropio?.imagenMovil),
        link: a.avisoPropio?.link || '/institucional/publicidad',
      },
    }
  },
  ['ajustes'],
  { tags: ['ajustes'] },
)

export type AjustesSitio = Awaited<ReturnType<typeof obtenerAjustes>>

export const obtenerSecciones = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'secciones',
      sort: 'orden',
      limit: 50,
      depth: 0,
      select: { nombre: true, slug: true },
    })
    return docs.map((s) => ({ nombre: s.nombre, slug: s.slug }))
  },
  ['secciones'],
  { tags: ['noticias'] },
)

/** Grilla semanal compacta: viaja con la página y el navegador calcula qué está al aire. */
export const obtenerGrilla = unstable_cache(
  async (): Promise<ProgramaGrilla[]> => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'programas',
      where: { activo: { equals: true } },
      limit: 200,
      depth: 1,
      select: { nombre: true, slug: true, horarios: true, conductores: true },
      populate: { equipo: { nombre: true } },
    })
    return docs.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      slug: d.slug,
      conduccion: enumerar(
        (d.conductores ?? [])
          .filter((c): c is Equipo => typeof c === 'object' && c !== null)
          .map((c) => c.nombre),
      ),
      horarios: d.horarios.map(({ dias, inicio, fin }) => ({ dias, inicio, fin })),
    }))
  },
  ['grilla'],
  { tags: ['grilla', 'programas'] },
)

// Lo público se lee con las reglas de acceso de un visitante (sin usuario): solo lo publicado.
const publico = { overrideAccess: false } as const

export const obtenerPortada = unstable_cache(
  async () => {
    const p = await payload()
    const portada = await p.findGlobal({ slug: 'portada', depth: 0, ...publico })
    return {
      notaDestacada: typeof portada.notaDestacada === 'number' ? portada.notaDestacada : null,
      peliculaDestacada:
        typeof portada.peliculaDestacada === 'number' ? portada.peliculaDestacada : null,
    }
  },
  ['portada'],
  { tags: ['portada'] },
)

export const ultimasNoticias = unstable_cache(
  async (cantidad: number, destacadaId: number | null) => {
    const p = await payload()
    const destacada = destacadaId
      ? await p
          .findByID({ collection: 'noticias', id: destacadaId, depth: 1, ...publico })
          .catch(() => null)
      : null
    const { docs } = await p.find({
      collection: 'noticias',
      sort: '-fechaPublicacion',
      limit: cantidad,
      depth: 1,
      where: destacada ? { id: { not_equals: destacada.id } } : undefined,
      ...publico,
    })
    // Sin destacada elegida en la portada, va la más reciente marcada como destacada, o la última
    const principal = destacada ?? docs.find((n) => n.destacada) ?? docs[0] ?? null
    return {
      destacada: principal ? aTarjetaNota(principal) : null,
      resto: docs.filter((n) => n.id !== principal?.id).map(aTarjetaNota),
    }
  },
  ['ultimas-noticias'],
  { tags: ['noticias', 'portada'] },
)

/**
 * Películas con funciones desde hoy y durante la semana, con los días en que se dan. La clave incluye
 * el día, así la cartelera cambia sola a la medianoche aunque nadie toque el panel.
 */
export const obtenerCartelera = unstable_cache(
  async (hoy: string) => {
    const p = await payload()
    const desde = `${hoy}T00:00:00-03:00`
    const hasta = new Date(new Date(desde).getTime() + 7 * 24 * 3600_000).toISOString()
    const { docs: funciones } = await p.find({
      collection: 'funciones',
      where: { fechaHora: { greater_than_equal: desde, less_than: hasta } },
      sort: 'fechaHora',
      limit: 500,
      depth: 0,
      ...publico,
    })
    const ids = [...new Set(funciones.map((f) => (typeof f.pelicula === 'object' ? f.pelicula.id : f.pelicula)))]
    if (!ids.length) return []
    const { docs: peliculas } = await p.find({
      collection: 'peliculas',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 1,
      ...publico,
    })
    return peliculas
      .map((pel) => {
        const suyas = funciones.filter(
          (f) => (typeof f.pelicula === 'object' ? f.pelicula.id : f.pelicula) === pel.id,
        )
        return {
          ...aTarjetaPelicula(pel),
          funciones: suyas.map((f) => ({ fechaHora: f.fechaHora, idioma: f.idioma, formato: f.formato })),
        }
      })
      .sort((a, b) => a.funciones[0].fechaHora.localeCompare(b.funciones[0].fechaHora))
  },
  ['cartelera'],
  { tags: ['cartelera'], revalidate: 3600 },
)

export const ultimasEntrevistas = unstable_cache(
  async (cantidad: number) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'entrevistas',
      sort: '-fecha',
      limit: cantidad,
      depth: 1,
      populate: { programas: { nombre: true } },
      ...publico,
    })
    return docs.map((e) => ({
      id: e.id,
      slug: e.slug,
      entrevistado: e.entrevistado,
      tema: e.tema,
      fecha: e.fecha,
      duracion: e.duracion ?? null,
      programa: typeof e.programa === 'object' ? e.programa.nombre : '',
    }))
  },
  ['ultimas-entrevistas'],
  { tags: ['entrevistas'] },
)
