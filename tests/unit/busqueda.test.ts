import { describe, expect, it } from 'vitest'

import { aConsulta } from '@/sitio/busqueda/consulta'
import { textoDeLexical } from '@/sitio/lib/texto'

describe('aConsulta', () => {
  it('pide todas las palabras, cada una también como comienzo', () => {
    expect(aConsulta('  Laure  Anglo ')).toBe('Laure:* & Anglo:*')
  })

  it('descarta signos que Postgres leería como operadores', () => {
    expect(aConsulta("fútbol' | !(partido)")).toBe('fútbol:* & partido:*')
    expect(aConsulta('& | ! :*')).toBeNull()
  })

  it('corta en ocho palabras', () => {
    expect(aConsulta('a b c d e f g h i j')?.split(' & ')).toHaveLength(8)
  })
})

describe('textoDeLexical', () => {
  it('separa párrafos e ítems y junta el texto con formato', () => {
    const texto = (text: string) => ({ type: 'text', text })
    expect(
      textoDeLexical({
        root: {
          children: [
            { type: 'heading', children: [texto('Título')] },
            {
              type: 'paragraph',
              children: [texto('Hola '), texto('mundo'), { type: 'linebreak' }, texto('chau')],
            },
            {
              type: 'list',
              children: [
                { type: 'listitem', children: [texto('uno')] },
                { type: 'listitem', children: [texto('dos')] },
              ],
            },
          ],
        },
      }),
    ).toBe('Título\nHola mundo\nchau\nuno\ndos')
  })

  it('sin cuerpo, vacío', () => {
    expect(textoDeLexical(null)).toBe('')
  })
})
