import { describe, expect, it } from 'vitest'

import { aContinuacion, alAire, momentoMontevideo, type ProgramaEnGrilla } from '@/sitio/lib/grilla'

const SEMANA = ['lun', 'mar', 'mie', 'jue', 'vie'] as const
const grilla: ProgramaEnGrilla[] = [
  { nombre: 'Mañana', horarios: [{ dias: [...SEMANA], inicio: '07:00', fin: '10:00' }] },
  { nombre: 'Media mañana', horarios: [{ dias: [...SEMANA], inicio: '10:00', fin: '13:00' }] },
  { nombre: 'Trasnoche', horarios: [{ dias: ['vie'], inicio: '22:00', fin: '00:00' }] },
  { nombre: 'Domingo', horarios: [{ dias: ['dom'], inicio: '09:00', fin: '13:00' }] },
]

// 2026-10-12 es lunes. Montevideo es UTC-3: las 10:00 locales son las 13:00 UTC.
const mvd = (iso: string) => new Date(`${iso}-03:00`)

describe('momentoMontevideo', () => {
  it('usa la hora de Uruguay aunque en UTC ya sea otro día', () => {
    expect(momentoMontevideo(new Date('2026-10-13T02:30:00Z'))).toEqual({ dia: 'lun', minutos: 23 * 60 + 30 })
  })
})

describe('alAire', () => {
  it('encuentra el programa de la franja actual', () => {
    expect(alAire(grilla, mvd('2026-10-12T08:15'))?.programa.nombre).toBe('Mañana')
  })

  it('el programa que empieza a esa hora ya está al aire y el anterior no', () => {
    expect(alAire(grilla, mvd('2026-10-12T10:00'))?.programa.nombre).toBe('Media mañana')
  })

  it('un programa que termina a medianoche sigue al aire a las 23:59', () => {
    expect(alAire(grilla, mvd('2026-10-16T23:59'))?.programa.nombre).toBe('Trasnoche')
    expect(alAire(grilla, mvd('2026-10-17T00:00'))).toBeNull()
  })

  it('sin programa cargado a esa hora devuelve null', () => {
    expect(alAire(grilla, mvd('2026-10-12T15:00'))).toBeNull()
  })
})

describe('aContinuacion', () => {
  it('trae los siguientes en orden', () => {
    const siguientes = aContinuacion(grilla, mvd('2026-10-12T08:00'), 3)
    expect(siguientes.map((e) => [e.programa.nombre, e.dia])).toEqual([
      ['Media mañana', 'lun'],
      ['Mañana', 'mar'],
      ['Media mañana', 'mar'],
    ])
  })

  it('el fin de semana da la vuelta hasta el lunes', () => {
    const siguientes = aContinuacion(grilla, mvd('2026-10-18T14:00'), 2)
    expect(siguientes.map((e) => [e.programa.nombre, e.dia])).toEqual([
      ['Mañana', 'lun'],
      ['Media mañana', 'lun'],
    ])
  })

  it('no repite el que está al aire', () => {
    const siguientes = aContinuacion(grilla, mvd('2026-10-12T07:00'), 1)
    expect(siguientes[0].programa.nombre).toBe('Media mañana')
  })
})
