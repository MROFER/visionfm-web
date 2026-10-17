import type { CollectionConfig } from 'payload'

import { campoSlug } from '@/base/fields/slug'
import { campoBusqueda } from '@/sitio/busqueda/campo'
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
    {
      // Entrevistas traídas del WordPress viejo, donde eran audios subidos a una nota
      name: 'wordpress',
      label: 'WordPress',
      type: 'group',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.wordpress?.idMedio),
      },
      fields: [
        { name: 'idMedio', label: 'Id del audio', type: 'number', unique: true, index: true },
        { name: 'idPost', label: 'Id de la nota', type: 'number' },
      ],
    },
    campoBusqueda(['entrevistado', 'tema', 'resumen']),
  ],
}
