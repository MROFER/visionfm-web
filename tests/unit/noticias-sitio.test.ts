import { describe, expect, it } from 'vitest'

import { paginasVisibles } from '@/sitio/componentes/ui/Paginacion'
import { fechaCompleta } from '@/sitio/lib/fecha'
import { minutosDeLectura, palabrasDeLexical, partirEnLaMitad } from '@/sitio/lib/texto'

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

describe('partirEnLaMitad', () => {
  const parrafo = (texto: string) => ({ type: 'paragraph', children: texto ? [{ type: 'text', text: texto }] : [] })
  const cuerpo = (...hijos: object[]) => ({ root: { type: 'root', children: hijos } })
  const textos = (c: ReturnType<typeof cuerpo>) =>
    c.root.children.map((n) => (n as { children: { text?: string }[] }).children[0]?.text ?? '')

  it('con menos de 6 párrafos no se parte', () => {
    expect(partirEnLaMitad(cuerpo(...['a', 'b', 'c', 'd', 'e'].map(parrafo)))).toBeNull()
  })
  it('con 6 corta después del tercero, y con 7, después del cuarto', () => {
    const [a, b] = partirEnLaMitad(cuerpo(...['1', '2', '3', '4', '5', '6'].map(parrafo)))!
    expect([textos(a), textos(b)]).toEqual([['1', '2', '3'], ['4', '5', '6']])
    const [c] = partirEnLaMitad(cuerpo(...['1', '2', '3', '4', '5', '6', '7'].map(parrafo)))!
    expect(textos(c)).toEqual(['1', '2', '3', '4'])
  })
  it('no cuenta los párrafos vacíos ni los títulos, que quedan donde estaban', () => {
    const titulo = { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'T' }] }
    const c = cuerpo(parrafo('1'), parrafo(''), titulo, parrafo('2'), parrafo('3'), parrafo('4'), parrafo('5'))
    expect(partirEnLaMitad(c)).toBeNull()
    const [a, b] = partirEnLaMitad(cuerpo(...c.root.children, parrafo('6')))!
    expect([textos(a), textos(b)]).toEqual([['1', '', 'T', '2', '3'], ['4', '5', '6']])
  })
  it('las dos partes conservan el resto del cuerpo', () => {
    const c = { ...cuerpo(...['1', '2', '3', '4', '5', '6'].map(parrafo)), extra: 1 }
    const [a] = partirEnLaMitad(c)!
    expect(a.extra).toBe(1)
    expect(a.root.type).toBe('root')
  })
})

describe('fechaCompleta', () => {
  it('día, mes y año en hora de Montevideo', () => {
    expect(fechaCompleta('2026-10-12T02:00:00Z')).toBe('11 de octubre de 2026')
  })
})
