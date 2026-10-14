import type { CollectionConfig } from 'payload'

// En la fase 1 los archivos pasan a R2 y se generan los tamaños WebP/AVIF (docs/04-esquema.md)
export const Medios: CollectionConfig = {
  slug: 'medios',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
      maxLength: 160,
    },
    {
      name: 'credito',
      label: 'Crédito',
      type: 'text',
    },
  ],
}
