import type { GlobalConfig } from 'payload'

import { medidasExactas } from '@/base/fields/medidas'
import { accesoFichaPorArea } from '@/base/permisos'

// docs/04-esquema.md (cinevision)
export const Cinevision: GlobalConfig = {
  slug: 'cinevision',
  label: 'Cinevisión',
  admin: { group: 'Cinevisión' },
  access: accesoFichaPorArea('cinevision'),
  fields: [
    {
      name: 'carrusel',
      type: 'array',
      fields: [
        {
          name: 'imagenWeb',
          label: 'Imagen escritorio (2480×768)',
          type: 'upload',
          relationTo: 'medios',
          required: true,
          validate: medidasExactas(2480, 768),
        },
        {
          name: 'imagenMovil',
          label: 'Imagen celular (390×240)',
          type: 'upload',
          relationTo: 'medios',
          required: true,
          validate: medidasExactas(390, 240),
        },
        { name: 'alt', label: 'Texto alternativo', type: 'text', required: true },
        { name: 'link', type: 'text' },
        { name: 'orden', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'precios',
      type: 'array',
      fields: [
        { name: 'concepto', type: 'text', required: true },
        { name: 'precio', type: 'text', required: true },
      ],
    },
    {
      name: 'promociones',
      type: 'array',
      fields: [
        { name: 'titulo', label: 'Título', type: 'text', required: true },
        { name: 'detalle', type: 'textarea' },
      ],
    },
    { name: 'comoSeCompran', label: 'Cómo se compran las entradas', type: 'textarea' },
    {
      name: 'comoLlegar',
      label: 'Cómo llegar',
      type: 'group',
      fields: [
        { name: 'direccion', label: 'Dirección', type: 'text' },
        { name: 'mapaImagen', label: 'Imagen del mapa', type: 'upload', relationTo: 'medios' },
        { name: 'mapaLink', label: 'Link al mapa', type: 'text' },
        { name: 'telefono', label: 'Teléfono', type: 'text' },
      ],
    },
  ],
}
