import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Config,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { refrescar, unir, type Afectado } from './purga'

type Doc = Record<string, unknown> & { id?: number | string }

/** Para armar rutas: busca el slug de un documento relacionado (por ejemplo, la sección de una nota). */
export type BuscarSlug = (coleccion: string, ref: unknown) => Promise<string | null>

export type MapaDeCache = {
  colecciones: Record<string, (doc: Doc, buscarSlug: BuscarSlug) => Afectado | Promise<Afectado>>
  fichas: Record<string, Afectado>
}

const buscarSlugCon =
  (req: PayloadRequest): BuscarSlug =>
  async (coleccion, ref) => {
    if (ref && typeof ref === 'object')
      return ((ref as { slug?: string }).slug ?? null) as string | null
    if (ref == null) return null
    const doc = await req.payload
      .findByID({
        collection: coleccion as 'secciones',
        id: ref as number,
        depth: 0,
        req,
        draft: false,
      })
      .catch(() => null)
    return (doc as { slug?: string } | null)?.slug ?? null
  }

const publicado = (doc?: Doc | null) =>
  !doc || doc._status === undefined || doc._status === 'published'

/**
 * Suma a cada colección y ficha del mapa la revalidación de Next y la purga de Cloudflare
 * (docs/02-trd.md, sección 5). Los borradores no tocan la caché: solo lo publicado, o lo que deja de estarlo.
 */
export function conRevalidacion(config: Config, mapa: MapaDeCache): Config {
  return {
    ...config,
    collections: (config.collections ?? []).map((coleccion) => {
      const afectadoPor = mapa.colecciones[coleccion.slug]
      if (!afectadoPor) return coleccion

      const alCambiar: CollectionAfterChangeHook = async ({ doc, previousDoc, req, operation }) => {
        const antes = operation === 'update' ? (previousDoc as Doc) : null
        if (!publicado(doc) && !(antes && antes._status === 'published')) return doc
        const buscarSlug = buscarSlugCon(req)
        // Las rutas viejas también: si cambió el slug o la sección, la URL anterior deja de valer
        const partes = [await afectadoPor(doc, buscarSlug)]
        if (antes) partes.push(await afectadoPor(antes, buscarSlug))
        await refrescar(unir(...partes), req.payload.logger)
        return doc
      }
      const alBorrar: CollectionAfterDeleteHook = async ({ doc, req }) => {
        await refrescar(await afectadoPor(doc, buscarSlugCon(req)), req.payload.logger)
      }

      const hooks = coleccion.hooks ?? {}
      return {
        ...coleccion,
        hooks: {
          ...hooks,
          afterChange: [...(hooks.afterChange ?? []), alCambiar],
          afterDelete: [...(hooks.afterDelete ?? []), alBorrar],
        },
      }
    }),
    globals: (config.globals ?? []).map((ficha) => {
      const afectado = mapa.fichas[ficha.slug]
      if (!afectado) return ficha
      const alCambiar: GlobalAfterChangeHook = async ({ doc, req }) => {
        await refrescar(afectado, req.payload.logger)
        return doc
      }
      return {
        ...ficha,
        hooks: { ...ficha.hooks, afterChange: [...(ficha.hooks?.afterChange ?? []), alCambiar] },
      }
    }),
  }
}
