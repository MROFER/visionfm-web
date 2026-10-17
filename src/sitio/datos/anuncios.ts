import { unstable_cache } from 'next/cache'

import type { Seccione } from '@/payload-types'
import { hoyEnMontevideo } from '../lib/fecha'
import { mediodiaUTC } from '../publicidad/fechas'
import {
  type AnuncioRotable,
  estaVigente,
  type Ubicacion,
  vaEnSeccion,
} from '../publicidad/rotacion'
import { aImagen } from './formas'
import { payload } from './index'

/**
 * Anuncios activos de una ubicación que están en fecha hoy, leídos como visitante. El día va en la
 * clave de la caché, así a la medianoche entran los que empiezan y salen los vencidos sin guardar nada.
 */
const vigentesDelDia = unstable_cache(
  async (ubicacion: Ubicacion, hoy: string) => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'anuncios',
      overrideAccess: false,
      where: {
        and: [
          { activo: { equals: true } },
          { ubicaciones: { in: [ubicacion] } },
          { desde: { less_than_equal: mediodiaUTC(hoy) } },
          { hasta: { greater_than_equal: mediodiaUTC(hoy) } },
        ],
      },
      limit: 50,
      depth: 1,
      select: {
        peso: true,
        desde: true,
        hasta: true,
        activo: true,
        secciones: true,
        imagenWeb: true,
        imagenMovil: true,
        imagenRectangulo: true,
      },
      populate: { secciones: { slug: true } },
    })
    return docs
      .filter((a) => estaVigente(a, hoy))
      .map((a) => ({
        id: a.id,
        peso: a.peso ?? 1,
        secciones: (a.secciones ?? [])
          .filter((s): s is Seccione => typeof s === 'object' && s !== null)
          .map((s) => s.slug),
        web: aImagen(a.imagenWeb),
        movil: aImagen(a.imagenMovil),
        rectangulo: aImagen(a.imagenRectangulo),
      }))
  },
  ['anuncios-vigentes'],
  { tags: ['anuncios'] },
)

/** Los que rotan en una ubicación (y sección de Noticias, si corresponde). */
export async function anunciosVigentes(
  ubicacion: Ubicacion,
  seccion?: string,
  hoy = hoyEnMontevideo(),
): Promise<AnuncioRotable[]> {
  const lista = await vigentesDelDia(ubicacion, hoy)
  return lista
    .filter((a) => vaEnSeccion(a.secciones, ubicacion, seccion))
    .map(({ secciones: _secciones, ...a }) => a)
}
