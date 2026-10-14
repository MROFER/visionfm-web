import type { CollectionConfig } from 'payload'

import { campoSeo } from '../fields/seo'
import { campoSlug } from '../fields/slug'
import { accesoPorArea, lecturaPublicadoOArea } from '../permisos'

// docs/04-esquema.md (paginas): textos legales en /legal/[slug]
export const Paginas: CollectionConfig = {
  slug: 'paginas',
  labels: { singular: 'Página', plural: 'Páginas' },
  admin: {
    group: 'Institucional',
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'slug', '_status'],
  },
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    ...accesoPorArea('institucional'),
    read: lecturaPublicadoOArea('institucional'),
  },
  fields: [
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    campoSlug('titulo', { unique: true }),
    { name: 'cuerpo', type: 'richText', required: true },
    campoSeo,
  ],
}
