import { describe, expect, it } from 'vitest'

import { puedeAsignarRol, seccionesDe, tienePermiso, type UsuarioConPermisos } from '@/base/permisos'

const u = (datos: Partial<UsuarioConPermisos>): UsuarioConPermisos => ({ id: 1, activo: true, ...datos })

describe('tienePermiso', () => {
  it('sin usuario, inactivo o sin rol no tiene permisos', () => {
    expect(tienePermiso(null, 'noticias', 'ver')).toBe(false)
    expect(tienePermiso(u({ rol: 'administrador', activo: false }), 'noticias', 'ver')).toBe(false)
    expect(tienePermiso(u({}), 'noticias', 'ver')).toBe(false)
  })

  it('el periodista crea y edita lo propio pero no publica ni aprueba', () => {
    const periodista = u({ rol: 'periodista' })
    expect(tienePermiso(periodista, 'noticias', 'crear')).toBe(true)
    expect(tienePermiso(periodista, 'noticias', 'editarPropio')).toBe(true)
    expect(tienePermiso(periodista, 'noticias', 'editarTodo')).toBe(false)
    expect(tienePermiso(periodista, 'noticias', 'publicar')).toBe(false)
    expect(tienePermiso(periodista, 'noticias', 'aprobar')).toBe(false)
  })

  it('el ajuste propio suma o quita Noticias → Publicar sobre el rol', () => {
    expect(tienePermiso(u({ rol: 'periodista', ajusteNoticiasPublicar: 'permitir' }), 'noticias', 'publicar')).toBe(true)
    expect(tienePermiso(u({ rol: 'editor', ajusteNoticiasPublicar: 'quitar' }), 'noticias', 'publicar')).toBe(false)
    // El ajuste solo afecta a publicar noticias
    expect(tienePermiso(u({ rol: 'periodista', ajusteNoticiasPublicar: 'permitir' }), 'noticias', 'aprobar')).toBe(false)
  })

  it('el manager gestiona contenido pero no borra ni entra a Sistema', () => {
    const manager = u({ rol: 'manager' })
    expect(tienePermiso(manager, 'publicidad', 'publicar')).toBe(true)
    expect(tienePermiso(manager, 'noticias', 'borrar')).toBe(false)
    expect(tienePermiso(manager, 'sistema', 'ver')).toBe(false)
  })

  it('Cinevisión y Comercial quedan en su área', () => {
    expect(tienePermiso(u({ rol: 'cinevision' }), 'cinevision', 'borrar')).toBe(true)
    expect(tienePermiso(u({ rol: 'cinevision' }), 'noticias', 'ver')).toBe(false)
    expect(tienePermiso(u({ rol: 'comercial' }), 'publicidad', 'editarTodo')).toBe(true)
    expect(tienePermiso(u({ rol: 'comercial' }), 'radio', 'ver')).toBe(false)
  })
})

describe('puedeAsignarRol', () => {
  it('nadie da lo que no tiene', () => {
    expect(puedeAsignarRol(u({ rol: 'administrador' }), 'manager')).toBe(true)
    expect(puedeAsignarRol(u({ rol: 'manager' }), 'administrador')).toBe(false)
    expect(puedeAsignarRol(u({ rol: 'editor' }), 'periodista')).toBe(true)
    expect(puedeAsignarRol(u({ rol: 'editor' }), 'cinevision')).toBe(false)
  })

  it('el rol Owner no se asigna, ni siquiera el Owner', () => {
    expect(puedeAsignarRol(u({ rol: 'owner', esOwner: true }), 'owner')).toBe(false)
  })
})

describe('seccionesDe', () => {
  it('vacío significa todas', () => {
    expect(seccionesDe(u({ seccionesPermitidas: [] }))).toBeNull()
    expect(seccionesDe(u({ seccionesPermitidas: [3, { id: 5 }] }))).toEqual([3, 5])
  })
})
