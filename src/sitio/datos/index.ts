import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Equipo } from '@/payload-types'
import { enumerar } from '../lib/texto'
import type { ProgramaGrilla } from './tipos'

// Lecturas del sitio público con la Local API. Cada una queda en la caché de Next con las etiquetas que
// los hooks refrescan al guardar (src/sitio/cache/mapa.ts), así la base solo se consulta cuando algo cambia.

export const payload = () => getPayload({ config })

export const obtenerAjustes = unstable_cache(
  async () => {
    const p = await payload()
    const a = await p.findGlobal({ slug: 'ajustes', depth: 0 })
    return {
      streamUrl: a.streamUrl ?? '',
      telefono: a.telefono ?? '',
      whatsapp: a.whatsapp ?? '',
      direccion: a.direccion ?? '',
      email: a.email ?? '',
      redes: (a.redes ?? []).map(({ red, url }) => ({ red, url })),
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
