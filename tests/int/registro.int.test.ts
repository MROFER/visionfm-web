import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { Usuario } from '@/payload-types'

let payload: Payload
let owner: Usuario
let periodista: Usuario
const clave = 'Clave-de-prueba-123'

const ultimo = async (where: Record<string, unknown>) => {
  const { docs } = await payload.find({
    collection: 'registroActividad',
    where: where as never,
    sort: '-id',
    limit: 1,
    overrideAccess: true,
  })
  return docs[0]
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.delete({ collection: 'usuarios', where: { id: { exists: true } }, overrideAccess: true })
  await payload.delete({ collection: 'secciones', where: { id: { exists: true } }, overrideAccess: true })
  owner = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Dueño', email: 'owner@prueba.uy', password: clave, rol: 'owner' },
  })
  periodista = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Luper', email: 'luper@prueba.uy', password: clave, rol: 'periodista' },
    user: owner,
    overrideAccess: false,
  })
})

describe('registro de actividad', () => {
  it('registra quién creó qué', async () => {
    const seccion = await payload.create({
      collection: 'secciones',
      data: { nombre: 'Deportes', orden: 4, slug: '' },
      user: owner,
      overrideAccess: false,
    })
    const entrada = await ultimo({ coleccion: { equals: 'secciones' }, documentoId: { equals: String(seccion.id) } })
    expect(entrada?.accion).toBe('crear')
    expect(typeof entrada?.quien === 'object' ? entrada?.quien?.id : entrada?.quien).toBe(owner.id)
  })

  it('guarda antes y después solo de los campos cambiados', async () => {
    const seccion = await payload.create({ collection: 'secciones', data: { nombre: 'Cultura', orden: 5, slug: '' }, user: owner })
    await payload.update({ collection: 'secciones', id: seccion.id, data: { orden: 6 }, user: owner, overrideAccess: false })
    const entrada = await ultimo({ accion: { equals: 'editar' }, documentoId: { equals: String(seccion.id) } })
    expect(entrada?.campos).toEqual(['orden'])
    expect(entrada?.antes).toEqual({ orden: 5 })
    expect(entrada?.despues).toEqual({ orden: 6 })
  })

  it('marca los cambios de permisos y nunca guarda contraseñas', async () => {
    await payload.update({
      collection: 'usuarios',
      id: periodista.id,
      data: { ajusteNoticiasPublicar: 'permitir', motivoAjuste: 'Prueba', password: 'Otra-clave-456789' },
      user: owner,
      overrideAccess: false,
    })
    const entrada = await ultimo({ accion: { equals: 'cambiar-permisos' }, documentoId: { equals: String(periodista.id) } })
    expect(entrada?.campos).toContain('ajusteNoticiasPublicar')
    expect(JSON.stringify(entrada)).not.toMatch(/Otra-clave|hash|salt/)
  })

  it('registra los ingresos al panel', async () => {
    await payload.login({ collection: 'usuarios', data: { email: 'owner@prueba.uy', password: clave } })
    const entrada = await ultimo({ accion: { equals: 'ingresar' } })
    expect(entrada?.documentoId).toBe(String(owner.id))
  })

  it('nadie lo edita ni lo borra, ni el Owner; el periodista no lo ve', async () => {
    const entrada = await ultimo({})
    await expect(
      payload.update({ collection: 'registroActividad', id: entrada!.id, data: { resumen: 'x' }, user: owner, overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'registroActividad', id: entrada!.id, user: owner, overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      payload.find({ collection: 'registroActividad', user: periodista, overrideAccess: false }),
    ).rejects.toThrow()
  })
})
