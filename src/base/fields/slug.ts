import type { TextField } from 'payload'

import { slugify } from '../lib/slug'

/** Slug que se completa solo a partir de otro campo (por defecto, `titulo`) si queda vacío. */
export function campoSlug(desde = 'titulo', opciones: Partial<TextField> = {}): TextField {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    index: true,
    ...opciones,
    admin: {
      position: 'sidebar',
      description: 'Se completa solo; cambiarlo cambia la URL.',
      ...opciones.admin,
    },
    hooks: {
      beforeValidate: [({ value, data }) => slugify(String(value || data?.[desde] || ''))],
    },
  } as TextField
}
