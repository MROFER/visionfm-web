import { describe, expect, it } from 'vitest'

import { diasConFunciones, horaDeFuncion, pestanaDeDia, versiones } from '@/sitio/lib/cine'

describe('pestanaDeDia', () => {
  it('da el día corto y el número', () => {
    expect(pestanaDeDia('2026-10-09')).toBe('Vie 09')
    expect(pestanaDeDia('2026-10-11')).toBe('Dom 11')
  })
})

describe('diasConFunciones', () => {
  it('agrupa por día de Montevideo, sin repetir y en orden', () => {
    expect(
      diasConFunciones([
        '2026-10-10T23:00:00.000Z', // sáb 10, 20:00
        '2026-10-10T01:30:00.000Z', // vie 09, 22:30 en Montevideo
        '2026-10-10T22:00:00.000Z',
      ]),
    ).toEqual(['2026-10-09', '2026-10-10'])
  })
})

describe('horaDeFuncion', () => {
  it('muestra la hora de Montevideo en 24 h', () => {
    expect(horaDeFuncion('2026-10-10T01:30:00.000Z')).toBe('22:30')
    expect(horaDeFuncion('2026-10-10T03:05:00.000Z')).toBe('00:05')
  })
})

describe('versiones', () => {
  it('une idiomas con la primera en mayúscula', () => {
    expect(versiones(['subtitulada', 'doblada'], 'idioma')).toBe('Subtitulada y doblada')
    expect(versiones(['doblada'], 'idioma')).toBe('Doblada')
  })
  it('une formatos', () => {
    expect(versiones(['2d', '3d'], 'formato')).toBe('2D y 3D')
    expect(versiones([], 'formato')).toBe('')
  })
})
