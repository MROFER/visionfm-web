import type { Access, PayloadRequest, Where } from 'payload'

import type { Area } from './matriz'
import { tienePermiso, type UsuarioConPermisos } from './permisos'

const usuarioDe = (req: PayloadRequest) => req.user as unknown as UsuarioConPermisos | null

type OpcionesArea = {
  /** Campo con el autor del documento, para "Editar lo propio". Sin él, editar exige "Editar todo". */
  campoAutor?: string
  /** Si la lectura es pública (el sitio muestra estos datos). */
  lecturaPublica?: boolean
}

/**
 * Acceso de una colección según su área. Se valida en el servidor en cada pedido,
 * también cuando se llama a la API directo.
 */
export function accesoPorArea(
  area: Area,
  { campoAutor, lecturaPublica = false }: OpcionesArea = {},
) {
  const read: Access = ({ req }) => lecturaPublica || tienePermiso(usuarioDe(req), area, 'ver')

  const create: Access = ({ req }) => tienePermiso(usuarioDe(req), area, 'crear')

  const update: Access = ({ req }) => {
    const usuario = usuarioDe(req)
    if (tienePermiso(usuario, area, 'editarTodo')) return true
    if (campoAutor && usuario && tienePermiso(usuario, area, 'editarPropio')) {
      return { [campoAutor]: { equals: usuario.id } } satisfies Where
    }
    return false
  }

  const del: Access = ({ req }) => tienePermiso(usuarioDe(req), area, 'borrar')

  return { read, create, update, delete: del }
}

/** Para fichas globales: leer es público, editar exige "Editar todo" en el área. */
export function accesoFichaPorArea(area: Area) {
  return {
    read: () => true,
    update: (({ req }) => tienePermiso(usuarioDe(req), area, 'editarTodo')) as Access,
  }
}

/** Lectura de colecciones con borradores: el público ve solo lo publicado; quien tiene "Ver" en el área ve todo. */
export function lecturaPublicadoOArea(area: Area): Access {
  return ({ req }) =>
    tienePermiso(usuarioDe(req), area, 'ver') ||
    ({ _status: { equals: 'published' } } satisfies Where)
}
