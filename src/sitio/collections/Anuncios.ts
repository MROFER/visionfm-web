import type { CollectionConfig, PayloadRequest } from 'payload'

import { medidasExactas } from '@/base/fields/medidas'
import { accesoPorArea } from '@/base/permisos'
import { descargarMetricas, descargarReporte } from '../publicidad/tareas'
import type { FormatoFinalNota } from '../publicidad/rotacion'
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
      label: 'Imagen cuadrada (300×250)',
      type: 'upload',
      relationTo: 'medios',
      validate: (
        valor: unknown,
        argumentos: { req: PayloadRequest; required?: boolean; siblingData: { ubicaciones?: string[] } },
      ) => {
        // El costado de la nota solo tiene lugar para el cuadrado
        const { ubicaciones } = argumentos.siblingData
        if (!valor && ubicaciones?.includes('noticias-nota-costado')) {
          return 'Para el costado de la nota hace falta la imagen de 300×250.'
        }
        return medidasExactas(300, 250)(valor, argumentos)
      },
      admin: {
        description:
          'Para Cinevisión en el celular, donde si falta va la de 320×100, para el medio de la nota, donde si falta va la tira, para el formato cuadrado del final de la nota y para el costado de la nota, donde es obligatoria.',
      },
    },
    { name: 'link', type: 'text' },
    { name: 'ubicaciones', type: 'select', hasMany: true, required: true, options: UBICACIONES },
    {
      name: 'formatoFinalNota',
      label: 'Formato al final de la nota',
      type: 'radio',
      defaultValue: 'tira',
      options: [
        { label: 'Tira: 728×90 en web y 320×100 en el celular', value: 'tira' },
        { label: 'Cuadrado: 300×250; en web, al lado de otros anuncios cuadrados', value: 'cuadrado' },
        { label: 'Ancho: 970×250 en web y 320×100 en el celular', value: 'ancho' },
      ] satisfies { label: string; value: FormatoFinalNota }[],
      admin: {
        condition: (datos) => Boolean(datos?.ubicaciones?.includes('noticias-nota-abajo')),
        description: 'Cuántos cuadrados van juntos en web se elige en Ajustes.',
      },
      validate: (
        valor: unknown,
        { siblingData }: { siblingData: { imagenRectangulo?: unknown; imagenAncha?: unknown } },
      ) => {
        if (valor === 'cuadrado' && !siblingData.imagenRectangulo) {
          return 'Para el cuadrado hace falta la imagen de 300×250.'
        }
        if (valor === 'ancho' && !siblingData.imagenAncha) {
          return 'Para el ancho hace falta la imagen de 970×250.'
        }
        return true
      },
    },
    {
      name: 'imagenAncha',
      label: 'Imagen ancha (970×250)',
      type: 'upload',
      relationTo: 'medios',
      validate: medidasExactas(970, 250),
      admin: {
        condition: (_, hermanos) => hermanos?.formatoFinalNota === 'ancho',
        description: 'Solo en web, al final de la nota.',
      },
    },
    {
      name: 'secciones',
      type: 'relationship',
      relationTo: 'secciones',
      hasMany: true,
      admin: {
        description:
          'Limita las ubicaciones de "Noticias · Sección" y "Noticias · Nota" (arriba, en el medio, al costado y abajo) a estas secciones. Vacío = todas.',
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
