import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/** Como mucho, cuántas coincidencias se traen: después se ordenan por fecha y se paginan. */
export const MAXIMO_RESULTADOS = 500

/**
 * Lo que escribió la persona, como consulta de Postgres: cada palabra también como comienzo de palabra
 * ("laure" encuentra "Laureles") y todas tienen que estar. Sin palabras, `null`.
 */
export function aConsulta(texto: string): string | null {
  const palabras = (texto.match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 8).map((p) => p.slice(0, 40))
  return palabras.length ? palabras.map((p) => `${p}:*`).join(' & ') : null
}

/**
 * Ids de Noticias o Entrevistas cuyo texto coincide, en español y sin distinguir tildes (índice de la
 * migración 20261017_002804_busqueda). No mira si están publicadas: eso lo resuelve la lectura con
 * permisos de visitante.
 */
export async function idsQueCoinciden(
  payload: Payload,
  coleccion: 'noticias' | 'entrevistas',
  texto: string,
): Promise<number[]> {
  const consulta = aConsulta(texto)
  if (!consulta) return []
  const vector = sql`to_tsvector('spanish', sin_tildes(coalesce("texto_busqueda", '')))`
  const { rows } = (await payload.db.drizzle.execute(sql`
    SELECT "id" FROM ${sql.identifier(coleccion)}
    WHERE ${vector} @@ to_tsquery('spanish', sin_tildes(${consulta}))
    LIMIT ${MAXIMO_RESULTADOS}
  `)) as unknown as { rows: { id: number }[] }
  return rows.map((r) => Number(r.id))
}
