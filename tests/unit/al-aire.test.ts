import { describe, expect, it } from 'vitest'

import {
  aContinuacion,
  alAire,
  momentoMontevideo,
  type ExcepcionEnGrilla,
  programacionDelDia,
  proximaSemana,
  type ProgramaEnGrilla,
} from '@/sitio/lib/grilla'

const SEMANA = ['lun', 'mar', 'mie', 'jue', 'vie'] as const
const grilla: ProgramaEnGrilla[] = [
  { id: 1, nombre: 'Mañana', horarios: [{ dias: [...SEMANA], inicio: '07:00', fin: '10:00' }] },
  { nombre: 'Media mañana', horarios: [{ dias: [...SEMANA], inicio: '10:00', fin: '13:00' }] },
  { nombre: 'Trasnoche', horarios: [{ dias: ['vie'], inicio: '22:00', fin: '00:00' }] },
  { nombre: 'Domingo', horarios: [{ dias: ['dom'], inicio: '09:00', fin: '13:00' }] },
]

// 2026-10-12 es lunes. Montevideo es UTC-3: las 10:00 locales son las 13:00 UTC.
const mvd = (iso: string) => new Date(`${iso}-03:00`)

describe('momentoMontevideo', () => {
  it('usa la hora de Uruguay aunque en UTC ya sea otro día', () => {
    expect(momentoMontevideo(new Date('2026-10-13T02:30:00Z'))).toEqual({
      dia: 'lun',
      minutos: 23 * 60 + 30,
    })
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

describe('programacionDelDia', () => {
  it('ordena por hora de inicio los programas de ese día', () => {
    expect(
      programacionDelDia(grilla, '2026-10-16').map((e) => [e.programa.nombre, e.inicio]),
    ).toEqual([
      ['Mañana', '07:00'],
      ['Media mañana', '10:00'],
      ['Trasnoche', '22:00'],
    ])
  })
  it('un día sin programas queda vacío', () => {
    expect(programacionDelDia(grilla, '2026-10-17')).toEqual([])
  })
})

describe('excepciones de grilla', () => {
  const partido: ExcepcionEnGrilla = {
    id: 7,
    fecha: '2026-10-12',
    inicio: '09:00',
    fin: '11:00',
    programa: null,
    titulo: 'Fútbol: Laureles vs. Anglo',
    conduccion: 'Equipo de deportes',
  }

  it('en su horario reemplaza a lo que estaba al aire', () => {
    const ahora = alAire(grilla, mvd('2026-10-12T09:30'), [partido])
    expect(ahora).toMatchObject({ inicio: '09:00', fin: '11:00', especial: true })
    expect(ahora?.programa).toMatchObject({
      nombre: 'Fútbol: Laureles vs. Anglo',
      conduccion: 'Equipo de deportes',
    })
  })

  it('los programas pisados quedan recortados, no borrados', () => {
    expect(alAire(grilla, mvd('2026-10-12T08:30'), [partido])).toMatchObject({
      inicio: '07:00',
      fin: '09:00',
    })
    expect(alAire(grilla, mvd('2026-10-12T11:00'), [partido])?.programa.nombre).toBe('Media mañana')
    expect(
      programacionDelDia(grilla, '2026-10-12', [partido]).map((e) => [
        e.programa.nombre,
        e.inicio,
        e.fin,
      ]),
    ).toEqual([
      ['Mañana', '07:00', '09:00'],
      ['Fútbol: Laureles vs. Anglo', '09:00', '11:00'],
      ['Media mañana', '11:00', '13:00'],
    ])
  })

  it('solo vale en su fecha: la semana siguiente vuelve la grilla de siempre', () => {
    expect(alAire(grilla, mvd('2026-10-19T09:30'), [partido])?.programa.nombre).toBe('Mañana')
  })

  it('aparece en "A continuación" y respeta el programa de la grilla que elige', () => {
    const feriado: ExcepcionEnGrilla = {
      ...partido,
      inicio: '07:00',
      fin: '13:00',
      programa: 1,
      titulo: '',
      conduccion: '',
    }
    const siguientes = aContinuacion(grilla, mvd('2026-10-12T06:00'), 2, [feriado])
    expect(siguientes.map((e) => [e.programa.nombre, e.fecha, e.inicio, e.especial])).toEqual([
      ['Mañana', '2026-10-12', '07:00', true],
      ['Mañana', '2026-10-13', '07:00', false],
    ])
  })

  it('una excepción en un hueco de la grilla también sale al aire', () => {
    const cobertura = { ...partido, inicio: '15:00', fin: '17:00' }
    expect(alAire(grilla, mvd('2026-10-12T16:00'), [cobertura])?.programa.nombre).toBe(
      'Fútbol: Laureles vs. Anglo',
    )
  })
})

describe('proximaSemana', () => {
  it('cada pestaña es la fecha de hoy o de los seis días que siguen', () => {
    expect(proximaSemana(mvd('2026-10-14T23:30'))).toEqual({
      mie: '2026-10-14',
      jue: '2026-10-15',
      vie: '2026-10-16',
      sab: '2026-10-17',
      dom: '2026-10-18',
      lun: '2026-10-19',
      mar: '2026-10-20',
    })
  })
})
