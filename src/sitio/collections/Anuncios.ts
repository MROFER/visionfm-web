import type { CollectionConfig } from 'payload'

import { medidasExactas } from '@/base/fields/medidas'
import { accesoPorArea } from '@/base/permisos'
import { descargarMetricas, descargarReporte } from '../publicidad/tareas'
import { UBICACIONES } from '../publicidad/ubicaciones'

export { UBICACIONES }

// docs/04-esquema.md (anuncios) y docs/07-permisos-y-publicidad.md, sección 3.
// Los anuncios vigentes son públicos: el sitio los pide y rotan en el navegador.
export const Anuncios: CollectionConfig = {
  slug: 'anuncios',
  labels: { singular: 'Anuncio', plural: 'Anuncios' },
  admin: {
    group: 'Publicidad',
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'anunciante', 'desde', 'hasta', 'activo'],
  },
  access: {
    ...accesoPorArea('publicidad'),
    read: (args) => accesoPorArea('publicidad').read(args) || { activo: { equals: true } },
  },
  endpoints: [descargarReporte, descargarMetricas],
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      admin: { description: 'Interno, no se muestra.' },
    },
    { name: 'anunciante', type: 'text', required: true, index: true },
    {
      name: 'emailReporte',
      label: 'Email para el reporte',
      type: 'email',
      admin: { description: 'Si se completa, recibe el reporte mensual de impresiones y clics.' },
      access: { read: ({ req }) => Boolean(req.user) },
    },
    {
      name: 'imagenWeb',
      label: 'Imagen escritorio (970×90)',
      type: 'upload',
      relationTo: 'medios',
      required: true,
      validate: medidasExactas(970, 90),
    },
    {
      name: 'imagenMovil',
      label: 'Imagen celular (320×100)',
      type: 'upload',
      relationTo: 'medios',
      required: true,
      validate: medidasExactas(320, 100),
    },
    {
      name: 'imagenRectangulo',
      label: 'Imagen celular en el medio de la página (300×250)',
      type: 'upload',
      relationTo: 'medios',
      validate: medidasExactas(300, 250),
      admin: {
        description:
          'Para las ubicaciones que van entre secciones, como Cinevisión. Si falta, va la de 320×100.',
      },
    },
    { name: 'link', type: 'text' },
    { name: 'ubicaciones', type: 'select', hasMany: true, required: true, options: UBICACIONES },
    {
      name: 'secciones',
      type: 'relationship',
      relationTo: 'secciones',
      hasMany: true,
      admin: {
        description:
          'Limita "Noticias · Sección" y "Noticias · Nota" a estas secciones. Vacío = todas.',
      },
    },
    {
      name: 'desde',
      type: 'date',
      required: true,
      index: true,
      admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'hasta',
      type: 'date',
      required: true,
      index: true,
      admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
      validate: (valor: unknown, { siblingData }: { siblingData: { desde?: string } }) => {
        if (!valor) return 'Obligatorio.'
        return !siblingData.desde || new Date(String(valor)) >= new Date(siblingData.desde)
          ? true
          : 'La fecha de fin tiene que ser igual o posterior al inicio.'
      },
    },
    {
      name: 'peso',
      type: 'number',
      defaultValue: 1,
      min: 1,
      max: 10,
      admin: { position: 'sidebar', description: '1 = normal, 2 = sale el doble de veces.' },
    },
    { name: 'activo', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'impresiones',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'clics',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'descargarMetricas',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/sitio/admin/DescargarMetricas#DescargarMetricas' },
      },
    },
  ],
}
