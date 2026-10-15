import type { CollectionConfig } from 'payload'

import { accesoPorArea } from '@/base/permisos'

// docs/04-esquema.md (equipo)
export const Equipo: CollectionConfig = {
  slug: 'equipo',
  labels: { singular: 'Integrante', plural: 'Equipo' },
  admin: {
    group: 'Radio',
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'rol', 'grupo', 'orden'],
  },
  defaultSort: 'orden',
  access: accesoPorArea('radio', { lecturaPublica: true }),
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'rol',
      type: 'text',
      required: true,
      admin: { description: 'Ej. "Producción y conducción".' },
    },
    {
      name: 'grupo',
      type: 'select',
      required: true,
      options: [
        { label: 'Dirección', value: 'direccion' },
        { label: 'Producción general', value: 'produccion-general' },
        { label: 'Conducción', value: 'conduccion' },
        { label: 'Columnistas', value: 'columnistas' },
        { label: 'Técnico', value: 'tecnico' },
      ],
    },
    { name: 'foto', type: 'upload', relationTo: 'medios' },
    { name: 'bio', type: 'textarea' },
    {
      name: 'redes',
      type: 'array',
      fields: [
        {
          name: 'red',
          type: 'select',
          required: true,
          options: ['instagram', 'facebook', 'x', 'youtube', 'tiktok', 'linkedin', 'web'],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'orden',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Orden dentro del grupo.' },
    },
  ],
}
