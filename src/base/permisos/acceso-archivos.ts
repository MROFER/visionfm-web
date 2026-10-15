import type { Access, PayloadRequest, Where } from 'payload'

import { AREAS } from './matriz'
import { tienePermiso, type UsuarioConPermisos } from './permisos'

const usuarioDe = (req: PayloadRequest) => req.user as unknown as UsuarioConPermisos | null

/** Cualquier usuario que pueda cargar contenido en alguna área puede subir archivos. */
export const puedeSubir: Access = ({ req }) =>
  AREAS.some((area) => tienePermiso(usuarioDe(req), area, 'crear'))

export const puedeBorrarArchivos: Access = ({ req }) =>
  tienePermiso(usuarioDe(req), 'noticias', 'borrar') ||
  tienePermiso(usuarioDe(req), 'sistema', 'borrar')

/** Los archivos privados (adjuntos de formularios) solo los ve quien tiene acceso a Institucional. */
export const leerArchivos: Access = ({ req }) => {
  if (tienePermiso(usuarioDe(req), 'institucional', 'ver')) return true
  const publicos: Where = { privado: { not_equals: true } }
  return publicos
}
