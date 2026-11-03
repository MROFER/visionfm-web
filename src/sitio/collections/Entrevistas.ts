import type { CollectionConfig } from 'payload'

import { campoSlug } from '@/base/fields/slug'
import { campoBusqueda } from '@/sitio/busqueda/campo'
import { transcribirAlSubirAudio } from '@/sitio/transcripcion/tarea'
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
    afterChange: [transcribirAlSubirAudio],
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
    {
      // Los asistentes de IA no escuchan audio: sin texto, para ellos la entrevista no existe
      name: 'transcripcion',
      label: 'Transcripción',
      type: 'textarea',
      admin: {
        rows: 12,
        description:
          'Lo que se dijo, en texto. Al subir el audio se completa sola con IA, si el servidor tiene la clave: revisá los nombres. Un párrafo por intervención, separados por una línea en blanco. Si un párrafo empieza con "Nombre:", el nombre sale en negrita.',
      },
    },
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
