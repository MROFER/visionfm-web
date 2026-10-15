import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import type { Equipo } from '@/payload-types'
import { enumerar } from '../lib/texto'
import { aImagen, aTarjetaEntrevista, aTarjetaNota, aTarjetaPelicula } from './formas'
import type { ProgramaCompleto, ProgramaGrilla, Voz } from './tipos'

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
        rectangulo: aImagen(a.avisoPropio?.imagenRectangulo),
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

/** Programas activos con conducción armada y horarios; la descripción solo la usa Programación. */
async function programasActivos() {
  const p = await payload()
  const { docs } = await p.find({
    collection: 'programas',
    where: { activo: { equals: true } },
    limit: 200,
    depth: 1,
    select: { nombre: true, slug: true, horarios: true, conductores: true, descripcion: true },
    populate: { equipo: { nombre: true } },
  })
  return docs
}

/** Grilla semanal compacta: viaja con la página y el navegador calcula qué está al aire. */
export const obtenerGrilla = unstable_cache(
  async (): Promise<ProgramaGrilla[]> => {
    const docs = await programasActivos()
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
  async (cantidad: number) => (await listarEntrevistas({ pagina: 1, cantidad })).entrevistas,
  ['ultimas-entrevistas'],
  { tags: ['entrevistas'] },
)

export const ENTREVISTAS_POR_PAGINA = 8

/** Archivo de entrevistas, de un programa o de todos. `q` busca en el nombre y el tema. */
export const listarEntrevistas = unstable_cache(
  async ({
    pagina,
    cantidad = ENTREVISTAS_POR_PAGINA,
    programa,
    q,
    excluir,
  }: {
    pagina: number
    cantidad?: number
    programa?: string
    q?: string
    excluir?: number | null
  }) => {
    const p = await payload()
    const condiciones: Where[] = []
    if (programa) condiciones.push({ 'programa.slug': { equals: programa } })
    if (excluir) condiciones.push({ id: { not_equals: excluir } })
    if (q) condiciones.push({ or: [{ entrevistado: { like: q } }, { tema: { like: q } }] })
    const r = await p.find({
      collection: 'entrevistas',
      sort: '-fecha',
      limit: cantidad,
      page: pagina,
      depth: 1,
      where: condiciones.length ? { and: condiciones } : undefined,
      populate: { programas: { nombre: true, slug: true } },
      ...publico,
    })
    return {
      entrevistas: r.docs.map(aTarjetaEntrevista),
      pagina: r.page ?? pagina,
      paginas: Math.max(r.totalPages, 1),
      total: r.totalDocs,
    }
  },
  ['listar-entrevistas'],
  // El nombre del programa viene de Programas
  { tags: ['entrevistas', 'programas'] },
)

/** La destacada: la última marcada como destacada, o la última publicada. */
export const entrevistaDestacada = unstable_cache(
  async (programa?: string) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'entrevistas',
      sort: ['-destacada', '-fecha'],
      limit: 1,
      depth: 1,
      where: programa ? { 'programa.slug': { equals: programa } } : undefined,
      populate: { programas: { nombre: true, slug: true } },
      ...publico,
    })
    return docs[0] ? aTarjetaEntrevista(docs[0]) : null
  },
  ['entrevista-destacada'],
  // El nombre del programa viene de Programas
  { tags: ['entrevistas', 'programas'] },
)

export const obtenerProgramacion = unstable_cache(
  async (): Promise<ProgramaCompleto[]> => {
    const [grilla, docs] = await Promise.all([obtenerGrilla(), programasActivos()])
    return grilla.map((g) => ({ ...g, descripcion: docs.find((d) => d.id === g.id)?.descripcion ?? '' }))
  },
  ['programacion'],
  { tags: ['grilla', 'programas'] },
)

/** "Las voces de Visión": quienes conducen, en el orden que les dio la radio. */
export const obtenerVoces = unstable_cache(
  async (): Promise<Voz[]> => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'equipo',
      where: { grupo: { equals: 'conduccion' } },
      sort: 'orden',
      limit: 50,
      depth: 1,
      select: { nombre: true, rol: true, foto: true },
      ...publico,
    })
    return docs.map((e) => ({ id: e.id, nombre: e.nombre, rol: e.rol, foto: aImagen(e.foto) }))
  },
  ['voces'],
  // Los cambios en Equipo refrescan la etiqueta de programas (src/sitio/cache/mapa.ts)
  { tags: ['programas'] },
)

export const POR_PAGINA = 10

/**
 * Archivo de Noticias, de una sección o de todas, paginado. `q` filtra por título o bajada; la búsqueda
 * de texto completo llega en la fase 3.
 */
export const listarNoticias = unstable_cache(
  async ({
    seccion,
    pagina,
    q,
    excluir,
  }: {
    seccion?: string
    pagina: number
    q?: string
    excluir?: number | null
  }) => {
    const p = await payload()
    const condiciones: Where[] = []
    if (seccion) condiciones.push({ 'seccion.slug': { equals: seccion } })
    if (excluir) condiciones.push({ id: { not_equals: excluir } })
    if (q) condiciones.push({ or: [{ titulo: { like: q } }, { bajada: { like: q } }] })
    const r = await p.find({
      collection: 'noticias',
      sort: '-fechaPublicacion',
      limit: POR_PAGINA,
      page: pagina,
      depth: 1,
      where: condiciones.length ? { and: condiciones } : undefined,
      ...publico,
    })
    return {
      notas: r.docs.map(aTarjetaNota),
      pagina: r.page ?? pagina,
      paginas: Math.max(r.totalPages, 1),
      total: r.totalDocs,
    }
  },
  ['listar-noticias'],
  { tags: ['noticias'] },
)

/** Destacada de una sección: la última marcada como destacada, o la última publicada. */
export const destacadaDeSeccion = unstable_cache(
  async (seccion: string) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'noticias',
      sort: ['-destacada', '-fechaPublicacion'],
      limit: 1,
      depth: 1,
      where: { 'seccion.slug': { equals: seccion } },
      ...publico,
    })
    return docs[0] ? aTarjetaNota(docs[0]) : null
  },
  ['destacada-seccion'],
  { tags: ['noticias'] },
)

export const obtenerNota = unstable_cache(
  async (seccion: string, slug: string) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'noticias',
      limit: 1,
      depth: 1,
      where: { and: [{ slug: { equals: slug } }, { 'seccion.slug': { equals: seccion } }] },
      ...publico,
    })
    const n = docs[0]
    if (!n) return null
    // Los usuarios no son públicos: de quien escribió solo sale el nombre de su ficha del equipo
    const autorId = n.autor && typeof n.autor === 'object' ? n.autor.id : n.autor
    const autor = autorId
      ? await p
          .findByID({ collection: 'usuarios', id: autorId, depth: 1, select: { equipo: true } })
          .catch(() => null)
      : null
    const firma = autor?.equipo && typeof autor.equipo === 'object' ? autor.equipo.nombre : null
    const foto = typeof n.foto === 'object' ? n.foto : null
    return {
      ...aTarjetaNota(n),
      cuerpo: n.cuerpo,
      epigrafe: n.epigrafe ?? '',
      credito: foto?.credito ?? '',
      firma: firma || 'Redacción Visión',
      seo: {
        titulo: n.seo?.titulo || n.titulo,
        descripcion: n.seo?.descripcion || n.bajada,
        imagen: aImagen(n.seo?.imagen) ?? aImagen(n.foto),
      },
    }
  },
  ['nota'],
  { tags: ['noticias'] },
)

export type NotaCompleta = NonNullable<Awaited<ReturnType<typeof obtenerNota>>>

/** "Seguí leyendo": las últimas de la misma sección y, si no alcanzan, las últimas de las demás. */
export const notasRelacionadas = unstable_cache(
  async (id: number, seccion: string, cantidad: number) => {
    const misma = await listarNoticias({ seccion, pagina: 1, excluir: id })
    const notas = misma.notas.slice(0, cantidad)
    if (notas.length < cantidad) {
      const otras = await listarNoticias({ pagina: 1, excluir: id })
      for (const n of otras.notas) {
        if (notas.length >= cantidad) break
        if (!notas.some((m) => m.id === n.id)) notas.push(n)
      }
    }
    return notas
  },
  ['notas-relacionadas'],
  { tags: ['noticias'] },
)
