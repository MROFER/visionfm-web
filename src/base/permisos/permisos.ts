import { type Accion, type Area, PERMISOS_DE_FABRICA, type Rol } from './matriz'

/** Lo mínimo del usuario que hace falta para decidir permisos. */
export type UsuarioConPermisos = {
  id: number | string
  rol?: Rol | null
  activo?: boolean | null
  esOwner?: boolean | null
  /** Ajuste propio de la etapa 1: suma o quita Noticias → Publicar sobre el rol. */
  ajusteNoticiasPublicar?: 'rol' | 'permitir' | 'quitar' | null
  seccionesPermitidas?: (number | string | { id: number | string })[] | null
}

export function tienePermiso(
  usuario: UsuarioConPermisos | null | undefined,
  area: Area,
  accion: Accion,
): boolean {
  if (!usuario || usuario.activo === false || !usuario.rol) return false
  if (usuario.esOwner) return true

  if (area === 'noticias' && accion === 'publicar') {
    if (usuario.ajusteNoticiasPublicar === 'permitir') return true
    if (usuario.ajusteNoticiasPublicar === 'quitar') return false
  }

  return PERMISOS_DE_FABRICA[usuario.rol]?.[area]?.includes(accion) ?? false
}

/** "Nadie da lo que no tiene": un rol se puede asignar solo si quien lo asigna tiene todos sus permisos. */
export function puedeAsignarRol(asignador: UsuarioConPermisos, rol: Rol): boolean {
  if (rol === 'owner') return false
  const permisos = PERMISOS_DE_FABRICA[rol]
  return (Object.keys(permisos) as Area[]).every((area) =>
    permisos[area].every((accion) => tienePermiso(asignador, area, accion)),
  )
}

/** Ids de las secciones a las que está limitado; `null` si puede trabajar en todas. */
export function seccionesDe(usuario: UsuarioConPermisos): (number | string)[] | null {
  const secciones = usuario.seccionesPermitidas ?? []
  if (secciones.length === 0) return null
  return secciones.map((s) => (typeof s === 'object' ? s.id : s))
}
