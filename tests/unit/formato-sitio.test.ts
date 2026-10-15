import { describe, expect, it } from 'vitest'

import { diasDeFunciones, fechaCorta, fechaLarga, hoyEnMontevideo } from '@/sitio/lib/fecha'
import { duracionAudio, duracionPelicula } from '@/sitio/lib/formato'

// 2026-10-16 es viernes
const f = (dia: string, hora = '20:00') => new Date(`2026-10-${dia}T${hora}:00-03:00`).toISOString()

describe('diasDeFunciones', () => {
  it('tres días seguidos o más van como rango', () => {
    expect(diasDeFunciones([f('16'), f('16', '22:00'), f('17'), f('18')])).toBe('Vie a Dom')
  })
  it('una semana que cruza el domingo también es un rango', () => {
    const semana = ['15', '16', '17', '18', '19', '20', '21'].map((d) => f(d))
    expect(diasDeFunciones(semana)).toBe('Jue a Mié')
  })
  it('dos días van con "y"', () => {
    expect(diasDeFunciones([f('17'), f('18')])).toBe('Sáb y Dom')
  })
  it('días salteados se enumeran', () => {
    expect(diasDeFunciones([f('19'), f('21'), f('23')])).toBe('Lun, Mié y Vie')
  })
  it('una función de madrugada cuenta en el día de Montevideo', () => {
    expect(diasDeFunciones([new Date('2026-10-19T02:00:00Z').toISOString()])).toBe('Dom')
  })
})

describe('fechas', () => {
  it('formatea en hora de Montevideo', () => {
    expect(fechaLarga(new Date('2026-10-13T02:00:00Z'))).toBe('Lunes 12 de octubre de 2026')
    expect(fechaCorta('2026-10-11T15:00:00Z')).toBe('11 oct')
    expect(hoyEnMontevideo(new Date('2026-10-13T02:00:00Z'))).toBe('2026-10-12')
  })
})

describe('duraciones', () => {
  it('películas en horas y minutos', () => {
    expect(duracionPelicula(105)).toBe('1 h 45 min')
    expect(duracionPelicula(120)).toBe('2 h')
    expect(duracionPelicula(50)).toBe('50 min')
  })
  it('audios en minutos', () => {
    expect(duracionAudio(1440)).toBe('24 min')
  })
})
