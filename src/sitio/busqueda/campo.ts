import type { TextareaField } from 'payload'

import { textoDeLexical } from '../lib/texto'

/**
 * Texto plano de los campos que entran en la búsqueda, guardado aparte para el índice de texto completo
 * (docs/04-esquema.md). Se arma solo al guardar y no se ve en el panel.
 */
export function campoBusqueda(campos: string[]): TextareaField {
  return {
    name: 'textoBusqueda',
    type: 'textarea',
    admin: { hidden: true },
    hooks: {
      beforeChange: [
        ({ data, originalDoc }) => {
          const doc = { ...originalDoc, ...data } as Record<string, unknown>
          return campos
            .map((c) => {
              const valor = doc[c]
              if (typeof valor === 'string') return valor
              return valor && typeof valor === 'object' ? textoDeLexical(valor) : ''
            })
            .filter(Boolean)
            .join('\n')
        },
      ],
    },
  }
}
