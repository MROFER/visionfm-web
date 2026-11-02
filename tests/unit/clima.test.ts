import { describe, expect, it } from 'vitest'

import { estadoDelCielo, obtenerClima } from '@/sitio/datos/clima'

const responder = (cuerpo: unknown, ok = true) =>
  (async () => ({ ok, json: async () => cuerpo })) as unknown as typeof fetch

describe('clima de la cinta', () => {
  it('traduce los códigos de Open-Meteo', () => {
    expect(estadoDelCielo(0)).toBe('Despejado')
    expect(estadoDelCielo(2)).toBe('Parcialmente nublado')
    expect(estadoDelCielo(63)).toBe('Lluvia')
    expect(estadoDelCielo(95)).toBe('Tormenta')
  })

  it('redondea la temperatura', async () => {
    const clima = await obtenerClima(
      responder({ current: { temperature_2m: 23.6, weather_code: 3 } }),
    )
    expect(clima).toEqual({ temperatura: 24, estado: 'Nublado' })
  })

  it('sin respuesta válida, la cinta sigue sin clima', async () => {
    expect(await obtenerClima(responder({}, false))).toBeNull()
    expect(await obtenerClima(responder({ current: {} }))).toBeNull()
    const falla = (async () => {
      throw new Error('sin red')
    }) as unknown as typeof fetch
    expect(await obtenerClima(falla)).toBeNull()
  })
})
