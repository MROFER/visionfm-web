import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { armarTabla } from './tabla'

/** Toda la tabla de redirecciones. Se purga al guardar una (etiqueta `redirecciones`). */
export const obtenerTablaRedirecciones = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'redirecciones',
      pagination: false,
      depth: 0,
      select: { desde: true, hacia: true, tipo: true },
      overrideAccess: false,
    })
    return armarTabla(docs)
  },
  ['tabla-redirecciones'],
  { tags: ['redirecciones'] },
)
