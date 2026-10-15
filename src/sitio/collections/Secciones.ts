import type { CollectionConfig } from 'payload'

import { slugify } from '@/base/lib/slug'
import { accesoPorArea } from '@/base/permisos'

// docs/04-esquema.md (secciones)
export const Secciones: CollectionConfig = {
  slug: 'secciones',
  labels: { singular: 'Sección', plural: 'Secciones' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'slug', 'orden'],
    group: 'Noticias',
  },
  defaultSort: 'orden',
  access: {
    ...accesoPorArea('noticias', { lecturaPublica: true }),
    create: accesoPorArea('noticias').update,
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Se completa solo a partir del nombre.' },
      hooks: {
        beforeValidate: [({ value, data }) => slugify(String(value || data?.nombre || ''))],
      },
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      admin: { description: 'Para Google (meta description).' },
    },
    { name: 'orden', type: 'number', required: true, defaultValue: 0 },
  ],
}
