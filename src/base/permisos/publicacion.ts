import { Forbidden, type CollectionBeforeChangeHook } from 'payload'

import type { Area } from './matriz'
import { tienePermiso, type UsuarioConPermisos } from './permisos'

/**
 * Sin "Publicar" en el área no se puede guardar como publicado, ni llamando a la API directo.
 * El flujo editorial completo (enviar a revisión, aprobar, devolver) se apoya en esta regla.
 */
export function soloPublicaQuienPuede(area: Area): CollectionBeforeChangeHook {
  return ({ data, req }) => {
    if (!req.user || data?._status !== 'published') return data
    if (!tienePermiso(req.user as unknown as UsuarioConPermisos, area, 'publicar'))
      throw new Forbidden(req.t)
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
