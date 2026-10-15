import { describe, expect, it } from 'vitest'

import { funcionesACopiar, lunesDe, rangoSemana } from '@/sitio/cinevision/semana'

describe('semanas de la cartelera', () => {
  it('el lunes de la semana, también desde un domingo', () => {
    expect(lunesDe('2026-10-15')).toBe('2026-10-12') // jueves
    expect(lunesDe('2026-10-12')).toBe('2026-10-12')
    expect(lunesDe('2026-10-18')).toBe('2026-10-12') // domingo
    expect(lunesDe('2026-11-01')).toBe('2026-10-26') // cambio de mes
  })

  it('la semana va de lunes 00:00 a lunes 00:00 de Montevideo', () => {
    expect(rangoSemana('2026-10-12')).toEqual({
      desde: '2026-10-12T03:00:00.000Z',
      hasta: '2026-10-19T03:00:00.000Z',
    })
  })

  it('corre las funciones 7 días y saltea las que ya existen', () => {
    const f = (fechaHora: string, pelicula = 1) => ({
      pelicula,
      fechaHora,
      idioma: 'subtitulada',
      formato: '2d',
    })
    const anteriores = [f('2026-10-05T22:00:00.000Z'), f('2026-10-11T00:30:00.000Z', 2)]
    const existentes = [f('2026-10-12T22:00:00.000Z')]
    expect(funcionesACopiar(anteriores, existentes)).toEqual([f('2026-10-18T00:30:00.000Z', 2)])
  })
})
