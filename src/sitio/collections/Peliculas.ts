import type { CollectionConfig } from 'payload'

import { campoSeo } from '@/base/fields/seo'
import { campoSlug } from '@/base/fields/slug'
import {
  accesoPorArea,
  lecturaPublicadoOArea,
  soloPublicaQuienPuede,
  anotarSiEsBorrador,
} from '@/base/permisos'
import { idDeYouTube } from '../lib/youtube'

export const IDIOMAS = [
  { label: 'Subtitulada', value: 'subtitulada' },
  { label: 'Doblada', value: 'doblada' },
]
export const FORMATOS = [
  { label: '2D', value: '2d' },
  { label: '3D', value: '3d' },
]

// docs/04-esquema.md (peliculas)
export const Peliculas: CollectionConfig = {
  slug: 'peliculas',
  labels: { singular: 'Película', plural: 'Películas' },
  admin: {
    group: 'Cinevisión',
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'esEstreno', 'fechaEstreno', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    ...accesoPorArea('cinevision'),
    read: lecturaPublicadoOArea('cinevision'),
  },
  hooks: {
    beforeOperation: [anotarSiEsBorrador],
    beforeChange: [soloPublicaQuienPuede('cinevision')],
  },
  fields: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    campoSlug('titulo', { unique: true }),
    { name: 'tituloOriginal', label: 'Título original', type: 'text' },
    { name: 'anio', label: 'Año', type: 'number', min: 1890, max: 2100 },
    { name: 'genero', label: 'Género', type: 'text', required: true },
    { name: 'duracion', label: 'Duración (minutos)', type: 'number', required: true, min: 1 },
    {
      name: 'calificacion',
      label: 'Calificación',
      type: 'select',
      required: true,
      options: [
        { label: 'ATP', value: 'atp' },
        { label: '+7', value: '7' },
        { label: '+13', value: '13' },
        { label: '+16', value: '16' },
        { label: '+18', value: '18' },
      ],
    },
    { name: 'idiomas', type: 'select', hasMany: true, required: true, options: IDIOMAS },
    { name: 'formatos', type: 'select', hasMany: true, required: true, options: FORMATOS },
    { name: 'sinopsis', type: 'textarea', required: true },
    {
      name: 'afiche',
      type: 'upload',
      relationTo: 'medios',
      required: true,
      admin: { description: 'Proporción 2:3.' },
    },
    {
      name: 'trailer',
      label: 'Tráiler',
      type: 'text',
      admin: { description: 'Link de YouTube; se guarda solo el ID del video.' },
      hooks: { beforeValidate: [({ value }) => (value ? (idDeYouTube(value) ?? value) : value)] },
      validate: (valor: unknown) =>
        !valor || idDeYouTube(String(valor)) ? true : 'No es un link de YouTube.',
    },
    {
      name: 'creditos',
      label: 'Créditos',
      type: 'group',
      fields: [
        { name: 'direccion', label: 'Dirección', type: 'text' },
        { name: 'reparto', type: 'text' },
        { name: 'guion', label: 'Guion', type: 'text' },
        { name: 'pais', label: 'País', type: 'text' },
        { name: 'idiomaOriginal', label: 'Idioma original', type: 'text' },
        { name: 'distribuidora', type: 'text' },
      ],
    },
    { name: 'esEstreno', label: 'Estreno', type: 'checkbox', admin: { position: 'sidebar' } },
    {
      name: 'fechaEstreno',
      label: 'Fecha de estreno',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Si es futura, va a "Próximos estrenos".',
      },
    },
    campoSeo,
  ],
}
