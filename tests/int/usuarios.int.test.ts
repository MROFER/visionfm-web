import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Usuario } from '@/payload-types'

// Permisos validados en el servidor: estas pruebas usan la API local con overrideAccess: false,
// que aplica las mismas reglas que un pedido HTTP a /cms-api.
let payload: Payload
let owner: Usuario
let admin: Usuario
let editor: Usuario
let periodista: Usuario

const clave = 'Clave-de-prueba-123'

async function crear(datos: Partial<Usuario> & { email: string }, como: Usuario) {
  return payload.create({
    collection: 'usuarios',
    data: { nombre: datos.email, password: clave, ...datos } as Usuario & { password: string },
    user: como,
    overrideAccess: false,
  })
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.delete({ collection: 'usuarios', where: { id: { exists: true } }, overrideAccess: true })
  await payload.delete({ collection: 'secciones', where: { id: { exists: true } }, overrideAccess: true })

  owner = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Dueño', email: 'owner@prueba.uy', password: clave, rol: 'periodista' },
  })
  admin = await crear({ email: 'admin@prueba.uy', rol: 'administrador' }, owner)
  editor = await crear({ email: 'editor@prueba.uy', rol: 'editor' }, owner)
  periodista = await crear({ email: 'periodista@prueba.uy', rol: 'periodista' }, owner)
})

describe('usuarios', () => {
  it('el primer usuario es el Owner, aunque pida otro rol', () => {
    expect(owner.rol).toBe('owner')
    expect(owner.esOwner).toBe(true)
  })

  it('un periodista no puede crear usuarios', async () => {
    await expect(crear({ email: 'x@prueba.uy', rol: 'periodista' }, periodista)).rejects.toThrow()
  })

  it('nadie asigna el rol Owner', async () => {
    await expect(crear({ email: 'otro-owner@prueba.uy', rol: 'owner' }, owner)).rejects.toThrow()
  })

  it('el Owner es intocable para un administrador', async () => {
    await expect(
      payload.update({ collection: 'usuarios', id: owner.id, data: { nombre: 'Otro' }, user: admin, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('nadie cambia su propio rol', async () => {
    const actualizado = await payload.update({
      collection: 'usuarios',
      id: admin.id,
      data: { rol: 'periodista' },
      user: admin,
      overrideAccess: false,
    })
    expect(actualizado.rol).toBe('administrador')
  })

  it('el editor habilita a un periodista a publicar, con motivo', async () => {
    await expect(
      payload.update({
        collection: 'usuarios',
        id: periodista.id,
        data: { ajusteNoticiasPublicar: 'permitir' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/motivo/)

    const actualizado = await payload.update({
      collection: 'usuarios',
      id: periodista.id,
      data: { ajusteNoticiasPublicar: 'permitir', motivoAjuste: 'Cubre la mañana sola' },
      user: editor,
      overrideAccess: false,
    })
    expect(actualizado.ajusteNoticiasPublicar).toBe('permitir')
  })

  it('el editor no cambia otros datos del periodista', async () => {
    await expect(
      payload.update({ collection: 'usuarios', id: periodista.id, data: { nombre: 'Cambiado' }, user: editor, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('el editor no toca a un administrador', async () => {
    await expect(
      payload.update({
        collection: 'usuarios',
        id: admin.id,
        data: { ajusteNoticiasPublicar: 'quitar', motivoAjuste: 'x' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('los usuarios no se borran, ni el Owner puede', async () => {
    await expect(
      payload.delete({ collection: 'usuarios', id: periodista.id, user: owner, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('un usuario desactivado no puede entrar', async () => {
    const baja = await crear({ email: 'baja@prueba.uy', rol: 'periodista' }, owner)
    await payload.update({ collection: 'usuarios', id: baja.id, data: { activo: false }, user: owner, overrideAccess: false })
    await expect(
      payload.login({ collection: 'usuarios', data: { email: 'baja@prueba.uy', password: clave } }),
    ).rejects.toThrow(/desactivado/)
  })
})

describe('secciones', () => {
  it('el editor crea secciones y el periodista no', async () => {
    const seccion = await payload.create({
      collection: 'secciones',
      data: { nombre: 'Policiales', orden: 3, slug: '' },
      user: editor,
      overrideAccess: false,
    })
    expect(seccion.slug).toBe('policiales')

    await expect(
      payload.create({ collection: 'secciones', data: { nombre: 'Otra', orden: 9, slug: '' }, user: periodista, overrideAccess: false }),
    ).rejects.toThrow()
  })
})
