import {
  Forbidden,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
} from 'payload'

import type { Area } from './matriz'
import { tienePermiso, type UsuarioConPermisos } from './permisos'

/**
 * Los hooks de cambio no saben si se guarda un borrador o se despublica (los dos llegan con
 * `_status: draft`); la operación sí, así que lo anota en el contexto del pedido.
 */
export const anotarSiEsBorrador: CollectionBeforeOperationHook = ({ args }) => {
  if (args?.req) args.req.context.guardandoBorrador = Boolean((args as { draft?: boolean }).draft)
  return args
}

/**
 * Sin "Publicar" en el área no se puede publicar ni despublicar, ni llamando a la API directo.
 * Guardar un borrador sobre algo publicado sí se puede: la versión publicada sigue en el sitio.
 * Requiere `anotarSiEsBorrador` en `beforeOperation`.
 */
export function soloPublicaQuienPuede(area: Area): CollectionBeforeChangeHook {
  return ({ data, originalDoc, req }) => {
    if (!req.user) return data
    const publica = data?._status === 'published'
    const despublica =
      originalDoc?._status === 'published' &&
      data?._status === 'draft' &&
      !req.context.guardandoBorrador
    if (
      (publica || despublica) &&
      !tienePermiso(req.user as unknown as UsuarioConPermisos, area, 'publicar')
    ) {
      throw new Forbidden(req.t)
    }
    return data
  }
}

/** Completa el autor con quien crea, si no viene. Lo usa "Editar lo propio". */
export const autorPorDefecto =
  (campo = 'autor'): CollectionBeforeChangeHook =>
  ({ data, req, operation }) => {
    if (operation === 'create' && req.user && !data?.[campo])
      return { ...data, [campo]: req.user.id }
    return data
  }
