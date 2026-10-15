import type { CollectionConfig } from 'payload'

import { limitarTamano, MB } from '../lib/limiteSubida'
import { puedeBorrarArchivos, puedeSubir } from '../permisos'

// docs/04-esquema.md (medios). En la fase 1, con R2, los tamaños se sirven desde Cloudflare.
export const Medios: CollectionConfig = {
  slug: 'medios',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  admin: { group: 'Archivos', useAsTitle: 'alt' },
  access: {
    read: () => true,
    create: puedeSubir,
    update: puedeSubir,
    delete: puedeBorrarArchivos,
  },
  hooks: {
    beforeOperation: [limitarTamano([{ prefijo: 'image/', maximo: 10 * MB }])],
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    // El original se guarda en WebP y con 2560 px de ancho como máximo: el resto se sirve de los tamaños
    resizeOptions: { width: 2560, withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [320, 640, 960, 1280, 1920].map((ancho) => ({
      name: `w${ancho}`,
      width: ancho,
      withoutEnlargement: true,
      formatOptions: { format: 'webp' as const, options: { quality: 80 } },
    })),
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'Texto alternativo', type: 'text', required: true, maxLength: 160 },
    { name: 'credito', label: 'Crédito', type: 'text' },
  ],
}
