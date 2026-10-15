import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { sincronizarAccess } from '@/base/acceso'
import type { Usuario } from '@/payload-types'

// La lista de Cloudflare Access sigue a los usuarios activos (docs/07, "Cómo se entra al panel")
let payload: Payload
let owner: Usuario
let pedidos: {
  url: string
  metodo: string
  cuerpo?: { include?: { email: { email: string } }[]; email?: string }
}[]
let fallar = false
const clave = 'Clave-de-prueba-123'

const emailsEnLista = () =>
  pedidos
    .filter((p) => p.metodo === 'PUT')
    .at(-1)
    ?.cuerpo?.include?.map((i) => i.email.email)
const revocados = () =>
  pedidos.filter((p) => p.url.endsWith('/revoke_user')).map((p) => p.cuerpo?.email)

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.delete({
    collection: 'usuarios',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
  owner = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Dueño', email: 'owner@prueba.uy', password: clave, rol: 'periodista' },
  })
  vi.stubEnv('CF_ACCOUNT_ID', 'cuenta')
  vi.stubEnv('CF_ACCESS_TOKEN', 'token')
  vi.stubEnv('CF_ACCESS_GROUP_ID', 'grupo')
  vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined)
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    pedidos.push({
      url: String(url),
      metodo: init?.method ?? 'GET',
      cuerpo: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    if (fallar)
      return new Response(JSON.stringify({ success: false, errors: [{ message: 'caído' }] }), {
        status: 500,
      })
    return Response.json({ success: true, result: { name: 'Panel Visión' } })
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

beforeEach(() => {
  pedidos = []
  fallar = false
})

const crear = (email: string) =>
  payload.create({
    collection: 'usuarios',
    data: { nombre: email, email, rol: 'periodista' } as Usuario,
    user: owner,
    overrideAccess: false,
  })

describe('Cloudflare Access', () => {
  it('un usuario nuevo entra a la lista', async () => {
    await crear('nueva@prueba.uy')
    expect(emailsEnLista()).toEqual(['nueva@prueba.uy', 'owner@prueba.uy'])
  })

  it('desactivarlo lo saca de la lista y cierra sus sesiones de Access', async () => {
    const usuario = await crear('baja@prueba.uy')
    pedidos = []
    await payload.update({
      collection: 'usuarios',
      id: usuario.id,
      data: { activo: false },
      user: owner,
      overrideAccess: false,
    })
    expect(emailsEnLista()).not.toContain('baja@prueba.uy')
    expect(revocados()).toEqual(['baja@prueba.uy'])
  })

  it('cambiar algo que no es el email ni el estado no llama a Cloudflare', async () => {
    const usuario = await crear('quieto@prueba.uy')
    pedidos = []
    await payload.update({
      collection: 'usuarios',
      id: usuario.id,
      data: { nombre: 'Otro nombre' },
      user: owner,
      overrideAccess: false,
    })
    expect(pedidos).toHaveLength(0)
  })

  it('si Cloudflare falla, el usuario se guarda igual y la tarea lo corrige después', async () => {
    fallar = true
    const usuario = await crear('tarde@prueba.uy')
    expect(usuario.id).toBeTruthy()
    fallar = false
    pedidos = []
    const { emails } = await sincronizarAccess(payload)
    expect(emailsEnLista()).toContain('tarde@prueba.uy')
    expect(emails).toBe(emailsEnLista()!.length)
  })
})
