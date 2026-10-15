import type { CollectionConfig } from 'payload'

import { tienePermiso, type UsuarioConPermisos } from '@/base/permisos'
import { UBICACIONES } from './Anuncios'

// docs/04-esquema.md (anuncios): impresiones y clics por anuncio, ubicación y día.
// Las escribe solo el servidor (ruta de métricas), nunca el panel ni la API.
export const AnunciosMetricas: CollectionConfig = {
  slug: 'anunciosMetricas',
  labels: { singular: 'Métrica', plural: 'Métricas de anuncios' },
  admin: {
    group: 'Publicidad',
    defaultColumns: ['anuncio', 'ubicacion', 'fecha', 'impresiones', 'clics'],
  },
  defaultSort: '-fecha',
  access: {
    read: ({ req }) => tienePermiso(req.user as unknown as UsuarioConPermisos, 'publicidad', 'ver'),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  indexes: [{ fields: ['anuncio', 'ubicacion', 'fecha'], unique: true }],
  fields: [
    { name: 'anuncio', type: 'relationship', relationTo: 'anuncios', required: true, index: true },
    { name: 'ubicacion', label: 'Ubicación', type: 'select', required: true, options: UBICACIONES },
    {
      name: 'fecha',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'impresiones', type: 'number', required: true, defaultValue: 0 },
    { name: 'clics', type: 'number', required: true, defaultValue: 0 },
  ],
}
