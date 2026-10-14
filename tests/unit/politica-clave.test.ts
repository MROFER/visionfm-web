import { createHash } from 'crypto'
import { describe, expect, it } from 'vitest'

import { estaFiltrada, validarClave } from '@/base/usuarios/politica-clave'

const respuestaCon = (clave: string, veces: number) => {
  const hash = createHash('sha1').update(clave).digest('hex').toUpperCase()
  const cuerpo = `0000000000000000000000000000000000A:3\r\n${hash.slice(5)}:${veces}\r\n`
  return (async () => new Response(cuerpo)) as unknown as typeof fetch
}

describe('política de contraseñas', () => {
  it('exige 12 caracteres', async () => {
    expect(await validarClave('corta', respuestaCon('otra', 0))).toMatch(/12 caracteres/)
  })

  it('rechaza las filtradas', async () => {
    expect(await validarClave('contraseña123', respuestaCon('contraseña123', 52))).toMatch(/filtraciones/)
  })

  it('acepta una larga que no está filtrada', async () => {
    expect(await validarClave('caballo-bateria-grapa-correcta', respuestaCon('otra-cosa', 9))).toBeNull()
  })

  it('el relleno con 0 apariciones no cuenta', async () => {
    expect(await estaFiltrada('caballo-bateria-grapa', respuestaCon('caballo-bateria-grapa', 0))).toBe(false)
  })

  it('si el servicio no responde, no bloquea', async () => {
    const caido = (async () => {
      throw new Error('sin red')
    }) as unknown as typeof fetch
    expect(await estaFiltrada('lo-que-sea-largo', caido)).toBe(false)
  })
})
