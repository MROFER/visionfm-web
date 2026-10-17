import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { diaEnMontevideo, mediodiaUTC } from './fechas'
import type { Ubicacion } from './rotacion'

/**
 * Suma impresiones o clics al día de hoy (Montevideo) de un anuncio en una ubicación, y a los totales
 * del anuncio. Va directo en SQL: es un contador atómico que no tiene que pasar por hooks, versiones ni
 * el registro de actividad, y dos visitas al mismo tiempo no se pisan.
 */
export async function sumarMetrica(
  payload: Payload,
  { anuncio, ubicacion, impresiones = 0, clics = 0 }: {
    anuncio: number
    ubicacion: Ubicacion
    impresiones?: number
    clics?: number
  },
  ahora = new Date(),
) {
  if (impresiones <= 0 && clics <= 0) return
  const fecha = mediodiaUTC(diaEnMontevideo(ahora))
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle
  await db.execute(sql`
    INSERT INTO anuncios_metricas (anuncio_id, ubicacion, fecha, impresiones, clics)
    VALUES (${anuncio}, ${ubicacion}, ${fecha}, ${impresiones}, ${clics})
    ON CONFLICT (anuncio_id, ubicacion, fecha) DO UPDATE SET
      impresiones = anuncios_metricas.impresiones + EXCLUDED.impresiones,
      clics = anuncios_metricas.clics + EXCLUDED.clics,
      updated_at = now()
  `)
  await db.execute(sql`
    UPDATE anuncios SET
      impresiones = COALESCE(impresiones, 0) + ${impresiones},
      clics = COALESCE(clics, 0) + ${clics}
    WHERE id = ${anuncio}
  `)
}
