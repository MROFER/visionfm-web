import config from '@payload-config'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { reenviarInvitacion, VIGENCIA_INVITACION_MS } from '@/base/usuarios/invitacion'
import type { Usuario } from '@/payload-types'

// Alta por invitación, política de contraseñas y bajas (docs/07, sección 2)
let payload: Payload
let owner: Usuario
let enviados: { to: string; subject: string; text: string }[] = []
const clave = 'Clave-de-prueba-123'

const tokenDelEmail = () => enviados.at(-1)?.text.match(/\/admin\/reset\/([a-f0-9]+)/)?.[1]

const invitar = (email: string, rol: Usuario['rol'] = 'periodista') =>
  payload.create({
    collection: 'usuarios',
    data: { nombre: 'Invitada', email, rol } as Usuario,
    user: owner,
    overrideAccess: false,
  })

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.delete({ collection: 'usuarios', where: { id: { exists: true } }, overrideAccess: true })
  owner = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Dueño', email: 'owner@prueba.uy', password: clave, rol: 'periodista' },
  })
  vi.spyOn(payload, 'sendEmail').mockImplementation(async (mensaje) => {
    enviados.push(mensaje as (typeof enviados)[number])
  })
})

beforeEach(() => {
  enviados = []
})

describe('invitaciones', () => {
  it('crear un usuario sin contraseña le manda la invitación con un link de 48 h', async () => {
    const antes = Date.now()
    const nueva = await invitar('invitada@prueba.uy')
    expect(enviados.map((m) => m.to)).toEqual(['invitada@prueba.uy'])
    expect(tokenDelEmail()).toBeTruthy()

    const guardado = await payload.db.findOne<{ id: number; resetPasswordExpiration: string }>({
      collection: 'usuarios',
      where: { id: { equals: nueva.id } },
    })
    const vence = new Date(guardado!.resetPasswordExpiration).getTime()
    expect(vence).toBeGreaterThanOrEqual(antes + VIGENCIA_INVITACION_MS - 1000)
  })

  it('con el link se elige la contraseña, con la política de largo', async () => {
    await invitar('acepta@prueba.uy')
    const token = tokenDelEmail()!
    await expect(
      payload.resetPassword({ collection: 'usuarios', data: { token, password: 'corta' }, overrideAccess: true }),
    ).rejects.toThrow(/12 caracteres/)
    await payload.resetPassword({
      collection: 'usuarios',
      data: { token, password: 'una-clave-larga-y-propia' },
      overrideAccess: true,
    })
    const { user } = await payload.login({
      collection: 'usuarios',
      data: { email: 'acepta@prueba.uy', password: 'una-clave-larga-y-propia' },
    })
    expect(user?.email).toBe('acepta@prueba.uy')
  })

  it('se puede reenviar la invitación; el link viejo deja de valer', async () => {
    const nueva = await invitar('reenvio@prueba.uy')
    const viejo = tokenDelEmail()!
    const respuesta = await reenviarInvitacion.handler({
      user: owner,
      payload,
      routeParams: { id: String(nueva.id) },
    } as unknown as PayloadRequest)
    expect(respuesta.status).toBe(200)
    expect(tokenDelEmail()).not.toBe(viejo)
    await expect(
      payload.resetPassword({ collection: 'usuarios', data: { token: viejo, password: 'otra-clave-bien-larga' }, overrideAccess: true }),
    ).rejects.toThrow()
  })

  it('un periodista no reenvía invitaciones', async () => {
    const nueva = await invitar('sinpermiso@prueba.uy')
    const respuesta = await reenviarInvitacion.handler({
      user: { ...nueva, rol: 'periodista' },
      payload,
      routeParams: { id: String(owner.id) },
    } as unknown as PayloadRequest)
    expect(respuesta.status).toBe(403)
  })

  it('una contraseña corta no se acepta al crear', async () => {
    await expect(
      payload.create({
        collection: 'usuarios',
        data: { nombre: 'X', email: 'corta@prueba.uy', password: 'corta', rol: 'periodista' },
        user: owner,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('bajas', () => {
  it('desactivar cierra sus sesiones y ya no puede entrar', async () => {
    const usuario = await payload.create({
      collection: 'usuarios',
      data: { nombre: 'Se va', email: 'sale@prueba.uy', password: clave, rol: 'periodista' },
      user: owner,
      overrideAccess: false,
    })
    await payload.login({ collection: 'usuarios', data: { email: 'sale@prueba.uy', password: clave } })
    const conSesion = await payload.db.findOne<{ id: number; sessions?: unknown[] }>({
      collection: 'usuarios',
      where: { id: { equals: usuario.id } },
    })
    expect(conSesion?.sessions?.length).toBeGreaterThan(0)

    await payload.update({ collection: 'usuarios', id: usuario.id, data: { activo: false }, user: owner, overrideAccess: false })
    const sinSesion = await payload.db.findOne<{ id: number; sessions?: unknown[] }>({
      collection: 'usuarios',
      where: { id: { equals: usuario.id } },
    })
    expect(sinSesion?.sessions ?? []).toHaveLength(0)
    await expect(
      payload.login({ collection: 'usuarios', data: { email: 'sale@prueba.uy', password: clave } }),
    ).rejects.toThrow(/desactivado/)
  })
})
