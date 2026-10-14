import type { CollectionConfig } from 'payload'

// Roles, permisos por área y secciones permitidas llegan en la fase 1 (docs/07-permisos-y-publicidad.md)
export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'email'],
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
  ],
}
