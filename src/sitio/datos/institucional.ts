import { unstable_cache } from 'next/cache'

import type { Equipo } from '@/payload-types'
import { aImagen, type Imagen } from './formas'
import { payload } from './index'

// Lecturas de la página Institucional: textos, historia y equipo.

const publico = { overrideAccess: false } as const

export const obtenerInstitucional = unstable_cache(
  async () => {
    const p = await payload()
    const g = await p.findGlobal({ slug: 'institucional', depth: 0, ...publico })
    return {
      quienesSomos: g.quienesSomos ?? null,
      hitos: (g.hitos ?? []).map(({ anio, titulo, texto }) => ({ anio, titulo, texto: texto ?? '' })),
      serParte: g.serParte ?? null,
      publicidad: g.publicidad ?? null,
      /** Se descarga desde /api/kit-comercial */
      hayKitComercial: Boolean(g.kitComercial),
    }
  },
  ['institucional'],
  { tags: ['institucional'] },
)

export type Integrante = { id: number; nombre: string; rol: string; foto: Imagen | null }
export type GrupoEquipo = Equipo['grupo']

/** Todo el equipo, agrupado y en el orden que le dio la radio. */
export const obtenerEquipo = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'equipo',
      sort: 'orden',
      limit: 200,
      depth: 1,
      select: { nombre: true, rol: true, grupo: true, foto: true },
      ...publico,
    })
    const grupos: Record<GrupoEquipo, Integrante[]> = {
      direccion: [],
      'produccion-general': [],
      conduccion: [],
      columnistas: [],
      tecnico: [],
    }
    for (const e of docs) {
      grupos[e.grupo]?.push({ id: e.id, nombre: e.nombre, rol: e.rol, foto: aImagen(e.foto) })
    }
    return grupos
  },
  ['equipo'],
  // Los cambios en Equipo refrescan esta etiqueta (src/sitio/cache/mapa.ts)
  { tags: ['institucional'] },
)
