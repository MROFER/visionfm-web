import type { GlobalConfig } from 'payload'

import { accesoFichaPorArea } from '@/base/permisos'

// docs/04-esquema.md (institucional)
export const Institucional: GlobalConfig = {
  slug: 'institucional',
  admin: { group: 'Institucional' },
  access: accesoFichaPorArea('institucional'),
  fields: [
    { name: 'quienesSomos', label: 'Quiénes somos', type: 'richText' },
    {
      name: 'hitos',
      label: 'Historia',
      type: 'array',
      fields: [
        { name: 'anio', label: 'Año', type: 'number', required: true },
        { name: 'titulo', label: 'Título', type: 'text', required: true },
        { name: 'texto', type: 'textarea' },
      ],
    },
    { name: 'serParte', label: 'Ser parte', type: 'richText' },
    { name: 'publicidad', type: 'richText' },
    {
      name: 'kitComercial',
      label: 'Kit comercial (PDF)',
      type: 'upload',
      relationTo: 'archivos',
      filterOptions: { mimeType: { equals: 'application/pdf' } },
    },
  ],
}
