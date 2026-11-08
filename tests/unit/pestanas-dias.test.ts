import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PestanasDias } from '@/sitio/componentes/cine/PestanasDias'

const pestanas = (dias: number) =>
  renderToStaticMarkup(
    createElement(PestanasDias, {
      opciones: Array.from({ length: dias }, (_, i) => ({ valor: `d${i}`, etiqueta: `Día ${i}` })),
      elegida: 'd0',
      onElegir: () => {},
      controla: 'funciones',
      repartidas: true,
    }),
  )

// En la página de la película, en web, con pocos días de función las pestañas van una al lado de la otra,
// como en el celular, y no repartidas a las dos puntas de la columna (8/11/2026)
describe('pestañas de los días de función', () => {
  it('con 2 a 4 días van juntas', () => {
    for (const dias of [2, 3, 4]) expect(pestanas(dias)).not.toContain('lg:justify-between')
  })

  it('con 5 días o más se reparten a lo ancho', () => {
    expect(pestanas(5)).toContain('lg:justify-between')
    expect(pestanas(7)).toContain('lg:justify-between')
  })
})
