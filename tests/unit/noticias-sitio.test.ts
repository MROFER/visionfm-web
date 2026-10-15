import { describe, expect, it } from 'vitest'

import { paginasVisibles } from '@/sitio/componentes/ui/Paginacion'
import { fechaCompleta } from '@/sitio/lib/fecha'
import { minutosDeLectura, palabrasDeLexical } from '@/sitio/lib/texto'

describe('paginasVisibles', () => {
  it('en la primera de muchas: 1, 2, salto y la última', () => {
    expect(paginasVisibles(1, 12)).toEqual([1, 2, '…', 12])
  })
  it('en el medio: vecinas de la actual con saltos a los dos lados', () => {
    expect(paginasVisibles(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12])
  })
  it('sin salto cuando las páginas son consecutivas', () => {
    expect(paginasVisibles(2, 3)).toEqual([1, 2, 3])
    expect(paginasVisibles(3, 4)).toEqual([1, 2, 3, 4])
  })
  it('una sola página', () => {
    expect(paginasVisibles(1, 1)).toEqual([1])
  })
})

describe('lectura', () => {
  const cuerpo = {
    root: {
      children: [
        { children: [{ text: 'Uno dos  tres' }] },
        { children: [{ text: 'cuatro' }, { children: [{ text: ' cinco ' }] }] },
      ],
    },
  }
  it('cuenta las palabras de todos los nodos', () => {
    expect(palabrasDeLexical(cuerpo)).toBe(5)
    expect(palabrasDeLexical(null)).toBe(0)
  })
  it('redondea a 200 palabras por minuto y nunca baja de 1', () => {
    expect(minutosDeLectura(0)).toBe(1)
    expect(minutosDeLectura(650)).toBe(3)
  })
})

describe('fechaCompleta', () => {
  it('día, mes y año en hora de Montevideo', () => {
    expect(fechaCompleta('2026-10-12T02:00:00Z')).toBe('11 de octubre de 2026')
  })
})
