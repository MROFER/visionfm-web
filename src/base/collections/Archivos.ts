import type { CollectionConfig } from 'payload'

import { leerArchivos, puedeBorrarArchivos, puedeSubir } from '../permisos'

// docs/04-esquema.md (archivos): audios, PDF y adjuntos, sin tamaños de imagen
export const Archivos: CollectionConfig = {
  slug: 'archivos',
  labels: { singular: 'Archivo', plural: 'Archivos' },
  admin: { group: 'Archivos', useAsTitle: 'filename' },
  access: {
    read: leerArchivos,
    create: puedeSubir,
    update: puedeSubir,
    delete: puedeBorrarArchivos,
  },
  upload: {
    mimeTypes: [
      'audio/mpeg',
      'audio/mp4',
      'audio/x-m4a',
      'video/mp4',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  fields: [
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    {
      name: 'privado',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Adjuntos de formularios: no se publican.' },
    },
  ],
}
