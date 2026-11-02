import { describe, expect, it } from 'vitest'

import { esMes, mesEnMontevideo, nombreDelMes, rangoDelMes } from '@/sitio/lib/fecha'

// Filtro por mes de Entrevistas
describe('meses', () => {
  it('solo acepta "AAAA-MM"', () => {
    expect(esMes('2026-10')).toBe(true)
    expect(esMes('2026-13')).toBe(false)
    expect(esMes('2026-1')).toBe(false)
    expect(esMes('octubre')).toBe(false)
  })

  it('el mes de una fecha es el de Montevideo', () => {
    // 1 de noviembre a las 01:00 UTC todavía es 31 de octubre en Montevideo
    expect(mesEnMontevideo('2026-11-01T01:00:00.000Z')).toBe('2026-10')
    expect(mesEnMontevideo('2026-11-01T12:00:00.000Z')).toBe('2026-11')
  })

  it('el nombre va con mayúscula y el año', () => {
    expect(nombreDelMes('2026-10')).toBe('Octubre 2026')
    expect(nombreDelMes('2027-01')).toBe('Enero 2027')
  })

  it('el rango va de medianoche a medianoche en Montevideo, también en diciembre', () => {
    expect(rangoDelMes('2026-10')).toEqual({
      desde: '2026-10-01T03:00:00.000Z',
      hasta: '2026-11-01T03:00:00.000Z',
    })
    expect(rangoDelMes('2026-12').hasta).toBe('2027-01-01T03:00:00.000Z')
  })
})
