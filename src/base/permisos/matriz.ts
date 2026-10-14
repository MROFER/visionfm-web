/**
 * Permisos por área y acción (docs/07-permisos-y-publicidad.md).
 * Etapa 1: los 8 roles de fábrica están fijos en este archivo. En la etapa 2 pasan a la colección `roles`.
 */

export const AREAS = ['radio', 'noticias', 'cinevision', 'institucional', 'publicidad', 'sistema'] as const
export type Area = (typeof AREAS)[number]

export const ACCIONES = ['ver', 'crear', 'editarPropio', 'editarTodo', 'publicar', 'aprobar', 'borrar'] as const
export type Accion = (typeof ACCIONES)[number]

export type Permisos = Record<Area, readonly Accion[]>

export const ROLES = [
  'owner',
  'administrador',
  'manager',
  'editor',
  'periodista',
  'colaborador',
  'cinevision',
  'comercial',
] as const
export type Rol = (typeof ROLES)[number]

export const NOMBRES_ROL: Record<Rol, string> = {
  owner: 'Owner',
  administrador: 'Administrador',
  manager: 'Manager',
  editor: 'Editor',
  periodista: 'Periodista',
  colaborador: 'Colaborador',
  cinevision: 'Cinevisión',
  comercial: 'Comercial',
}

const TODO: readonly Accion[] = ACCIONES
const NADA: readonly Accion[] = []
const GESTION: readonly Accion[] = ['ver', 'crear', 'editarPropio', 'editarTodo', 'publicar', 'aprobar']
const PROPIO: readonly Accion[] = ['ver', 'crear', 'editarPropio']

const todasLasAreas = (acciones: readonly Accion[]): Permisos =>
  Object.fromEntries(AREAS.map((area) => [area, acciones])) as Permisos

export const PERMISOS_DE_FABRICA: Record<Rol, Permisos> = {
  owner: todasLasAreas(TODO),
  administrador: todasLasAreas(TODO),
  manager: { ...todasLasAreas(GESTION), sistema: NADA },
  editor: {
    ...todasLasAreas(NADA),
    noticias: TODO,
    radio: ['ver', 'crear', 'editarPropio', 'editarTodo', 'publicar'],
    // Ve los mensajes de formularios, que viven en Institucional
    institucional: ['ver'],
  },
  periodista: { ...todasLasAreas(NADA), noticias: PROPIO, radio: PROPIO },
  colaborador: { ...todasLasAreas(NADA), noticias: PROPIO },
  cinevision: { ...todasLasAreas(NADA), cinevision: TODO },
  comercial: { ...todasLasAreas(NADA), publicidad: TODO, institucional: ['ver'] },
}

/** Roles que se pueden asignar desde el panel. Owner solo se obtiene por transferencia de titularidad. */
export const ROLES_ASIGNABLES: readonly Rol[] = ROLES.filter((rol) => rol !== 'owner')
