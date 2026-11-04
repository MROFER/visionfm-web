import { describe, expect, it } from 'vitest'

import {
  diasDelMes,
  esDia,
  esMes,
  nombreDelRango,
  rangoCorto,
  rangoDeDias,
} from '@/sitio/lib/fecha'

// Filtro por fechas de Entrevistas
describe('rango de fechas', () => {
  it('solo acepta días que existen, como "AAAA-MM-DD"', () => {
    expect(esDia('2026-10-15')).toBe(true)
    expect(esDia('2028-02-29')).toBe(true)
    expect(esDia('2026-02-30')).toBe(false)
    expect(esDia('2026-13-01')).toBe(false)
    expect(esDia('15/10/2026')).toBe(false)
  })

  it('los dos días cuentan enteros, en hora de Montevideo', () => {
    expect(rangoDeDias('2026-10-08', '2026-10-28')).toEqual({
      desde: '2026-10-08T03:00:00.000Z',
      hasta: '2026-10-29T03:00:00.000Z',
    })
    expect(rangoDeDias('2026-12-31', '2026-12-31').hasta).toBe('2027-01-01T03:00:00.000Z')
  })

  it('las direcciones viejas por mes pasan a su primer y último día', () => {
    expect(esMes('2026-10')).toBe(true)
    expect(esMes('2026-13')).toBe(false)
    expect(diasDelMes('2026-10')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' })
    expect(diasDelMes('2028-02')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' })
  })

  it('el título dice el rango, con el año solo si hace falta', () => {
    const hoy = '2026-11-04'
    expect(nombreDelRango('2026-08-01', '2026-10-15', hoy)).toBe('del 1 de agosto al 15 de octubre')
    expect(nombreDelRango('2026-10-08', '2026-10-28', hoy)).toBe('del 8 al 28 de octubre')
    expect(nombreDelRango('2026-10-08', '2026-10-08', hoy)).toBe('el 8 de octubre')
    expect(nombreDelRango('2025-12-20', '2026-01-10', hoy)).toBe(
      'del 20 de diciembre de 2025 al 10 de enero de 2026',
    )
    expect(nombreDelRango('2025-03-01', '2025-03-31', hoy)).toBe('del 1 al 31 de marzo de 2025')
  })

  it('el botón muestra el rango corto', () => {
    expect(rangoCorto('2026-10-08', '2026-10-28')).toBe('8 oct – 28 oct')
    expect(rangoCorto('2026-10-08', '2026-10-08')).toBe('8 oct')
  })
})
