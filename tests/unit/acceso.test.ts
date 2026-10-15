import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet } from 'jose'
import { describe, expect, it, vi } from 'vitest'

import {
  configAccess,
  configJwt,
  normalizarEmails,
  reemplazarEmails,
  revocarSesiones,
  verificarJwt,
} from '@/base/acceso'

const cfg = { cuenta: 'cuenta', token: 'token', grupo: 'grupo' }

/** Un `fetch` falso que anota los pedidos y responde lo que se le pide. */
function falso(respuestas: unknown[] = []) {
  const pedidos: { url: string; metodo?: string; cuerpo?: unknown }[] = []
  const buscar = vi.fn(async (url: string, init?: RequestInit) => {
    pedidos.push({
      url,
      metodo: init?.method,
      cuerpo: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    const r = respuestas.shift() ?? { success: true, result: { name: 'Panel' } }
    return new Response(JSON.stringify(r), {
      status: (r as { success?: boolean }).success ? 200 : 400,
    })
  })
  return { buscar: buscar as unknown as typeof fetch, pedidos }
}

describe('lista de Cloudflare Access', () => {
  it('sin las tres variables no hay configuración', () => {
    expect(configAccess({ CF_ACCOUNT_ID: 'a', CF_ACCESS_TOKEN: 'b' })).toBeNull()
    expect(
      configAccess({ CF_ACCOUNT_ID: 'a', CF_ACCESS_TOKEN: 'b', CF_ACCESS_GROUP_ID: 'c' }),
    ).toEqual({
      cuenta: 'a',
      token: 'b',
      grupo: 'c',
    })
  })

  it('normaliza los emails', () => {
    expect(normalizarEmails(['B@x.uy', ' a@x.uy', 'b@x.uy', ''])).toEqual(['a@x.uy', 'b@x.uy'])
  })

  it('reemplaza el grupo conservando su nombre', async () => {
    const { buscar, pedidos } = falso()
    expect(await reemplazarEmails(cfg, ['Ana@x.uy', 'beto@x.uy'], buscar)).toBe(2)
    expect(pedidos[0]).toMatchObject({
      metodo: 'GET',
      url: expect.stringContaining('/accounts/cuenta/access/groups/grupo'),
    })
    expect(pedidos[1]).toMatchObject({
      metodo: 'PUT',
      cuerpo: {
        name: 'Panel',
        include: [{ email: { email: 'ana@x.uy' } }, { email: { email: 'beto@x.uy' } }],
      },
    })
  })

  it('no deja la lista vacía', async () => {
    const { buscar, pedidos } = falso()
    await expect(reemplazarEmails(cfg, [], buscar)).rejects.toThrow(/no hay usuarios activos/)
    expect(pedidos.filter((p) => p.metodo === 'PUT')).toHaveLength(0)
  })

  it('un error de Cloudflare se informa con su mensaje', async () => {
    const { buscar } = falso([{ success: false, errors: [{ message: 'token inválido' }] }])
    await expect(revocarSesiones(cfg, 'a@x.uy', buscar)).rejects.toThrow(/token inválido/)
  })
})

describe('JWT de Access', () => {
  const equipo = 'visionfm.cloudflareaccess.com'
  const aud = 'aud-del-panel'

  async function preparar() {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }
    const llaves = createLocalJWKSet({ keys: [jwk] })
    const firmar = (datos: { aud?: string; iss?: string; exp?: string } = {}) =>
      new SignJWT({ email: 'ana@x.uy' })
        .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
        .setIssuer(datos.iss ?? `https://${equipo}`)
        .setAudience(datos.aud ?? aud)
        .setIssuedAt()
        .setExpirationTime(datos.exp ?? '1h')
        .sign(privateKey)
    return { llaves, firmar }
  }

  it('sin las variables no se exige', () => {
    expect(configJwt({ CF_ACCESS_AUD: 'x' })).toBeNull()
    expect(
      configJwt({ CF_ACCESS_AUD: 'x', CF_ACCESS_TEAM_DOMAIN: 'https://e.cloudflareaccess.com/' }),
    ).toEqual({
      equipo: 'e.cloudflareaccess.com',
      aud: 'x',
    })
  })

  it('acepta un JWT de esta aplicación y devuelve el email', async () => {
    const { llaves, firmar } = await preparar()
    expect(await verificarJwt(await firmar(), { equipo, aud }, llaves)).toBe('ana@x.uy')
  })

  it('rechaza otra aplicación, otro equipo, vencido o ausente', async () => {
    const { llaves, firmar } = await preparar()
    expect(await verificarJwt(await firmar({ aud: 'otra' }), { equipo, aud }, llaves)).toBeNull()
    expect(
      await verificarJwt(
        await firmar({ iss: 'https://otro.cloudflareaccess.com' }),
        { equipo, aud },
        llaves,
      ),
    ).toBeNull()
    expect(await verificarJwt(await firmar({ exp: '1s ago' }), { equipo, aud }, llaves)).toBeNull()
    expect(await verificarJwt(null, { equipo, aud }, llaves)).toBeNull()
    expect(await verificarJwt('basura', { equipo, aud }, llaves)).toBeNull()
  })
})
