import { APIError, type CollectionBeforeOperationHook } from 'payload'

// Límites por archivo (docs/02-trd.md, sección de subidas). El plan gratis de Cloudflare
// corta las peticiones de más de 100 MB, así que nada puede superar los 90 MB.
export const MB = 1024 * 1024
export const LIMITE_GLOBAL = 90 * MB

/** Máximo en bytes para un tipo MIME; la primera regla cuyo prefijo coincide gana. */
export type ReglasTamano = { prefijo: string; maximo: number }[]

export function maximoPara(reglas: ReglasTamano, mimetype: string) {
  return reglas.find((r) => mimetype.startsWith(r.prefijo))?.maximo ?? LIMITE_GLOBAL
}

const enMB = (bytes: number) => `${Math.round(bytes / MB)} MB`

/** Rechaza con 413 los archivos que superan el máximo de su tipo, antes de procesarlos. */
export const limitarTamano =
  (reglas: ReglasTamano): CollectionBeforeOperationHook =>
  ({ args, operation }) => {
    if (operation !== 'create' && operation !== 'update') return args
    const archivo = args.req?.file
    if (!archivo) return args
    const maximo = maximoPara(reglas, archivo.mimetype)
    if (archivo.size > maximo) {
      throw new APIError(
        `El archivo pesa ${enMB(archivo.size)} y el máximo para este tipo es ${enMB(maximo)}.`,
        413,
      )
    }
    return args
  }
