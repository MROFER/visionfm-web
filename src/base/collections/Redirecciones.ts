import type { CollectionConfig } from 'payload'

import { accesoPorArea } from '../permisos'

// docs/04-esquema.md (redirecciones): 301 de notas viejas, 410 para spam
export const Redirecciones: CollectionConfig = {
  slug: 'redirecciones',
  labels: { singular: 'Redirección', plural: 'Redirecciones' },
  admin: { group: 'Sistema', useAsTitle: 'desde', defaultColumns: ['desde', 'hacia', 'tipo'] },
  access: { ...accesoPorArea('sistema'), read: () => true },
  fields: [
    {
      name: 'desde',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Ruta vieja, empezando con /. Ej.: /2024/05/obras-cerro-norte/' },
      validate: (valor: string | null | undefined) =>
        valor?.startsWith('/') ? true : 'Tiene que empezar con /.',
    },
    {
      name: 'hacia',
      type: 'text',
      admin: {
        description: 'Ruta nueva. Vacío si el tipo es 410.',
        condition: (_, s) => s?.tipo !== '410',
      },
    },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 · movida para siempre', value: '301' },
        { label: '302 · movida por un tiempo', value: '302' },
        { label: '410 · eliminada (spam)', value: '410' },
      ],
    },
  ],
}
