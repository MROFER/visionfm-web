import type { CollectionConfig } from 'payload'

import { campoSlug } from '@/base/fields/slug'
import {
  accesoPorArea,
  autorPorDefecto,
  lecturaPublicadoOArea,
  soloPublicaQuienPuede,
  anotarSiEsBorrador,
} from '@/base/permisos'

// docs/04-esquema.md (entrevistas)
export const Entrevistas: CollectionConfig = {
  slug: 'entrevistas',
  labels: { singular: 'Entrevista', plural: 'Entrevistas' },
  admin: {
    group: 'Radio',
    useAsTitle: 'entrevistado',
    defaultColumns: ['entrevistado', 'tema', 'fecha', '_status'],
  },
  defaultSort: '-fecha',
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    ...accesoPorArea('radio', { campoAutor: 'autor' }),
    read: lecturaPublicadoOArea('radio'),
  },
  hooks: {
    beforeOperation: [anotarSiEsBorrador],
    beforeChange: [autorPorDefecto(), soloPublicaQuienPuede('radio')],
  },
  fields: [
    { name: 'entrevistado', type: 'text', required: true },
    { name: 'tema', type: 'text', required: true },
    campoSlug('entrevistado', { unique: true }),
    {
      name: 'programa',
      type: 'relationship',
      relationTo: 'programas',
      required: true,
      index: true,
    },
    {
      name: 'fecha',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'audio',
      type: 'upload',
      relationTo: 'archivos',
      required: true,
      filterOptions: { mimeType: { in: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a'] } },
      admin: { description: 'MP3 o M4A, hasta 90 MB.' },
    },
    {
      name: 'duracion',
      label: 'Duración (segundos)',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'foto', type: 'upload', relationTo: 'medios' },
    { name: 'resumen', type: 'textarea', admin: { description: 'Para Google y el buscador.' } },
    { name: 'destacada', type: 'checkbox', admin: { position: 'sidebar' } },
    {
      name: 'autor',
      type: 'relationship',
      relationTo: 'usuarios',
      admin: { position: 'sidebar', readOnly: true, description: 'Quien la cargó.' },
    },
  ],
}
