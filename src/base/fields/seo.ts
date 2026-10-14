import type { GroupField } from 'payload'

/** Título, descripción e imagen para Google y redes. Si quedan vacíos, el sitio usa los del contenido. */
export const campoSeo: GroupField = {
  name: 'seo',
  label: 'SEO',
  type: 'group',
  admin: { position: 'sidebar' },
  fields: [
    { name: 'titulo', label: 'Título', type: 'text', maxLength: 70 },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 160 },
    { name: 'imagen', type: 'upload', relationTo: 'medios' },
  ],
}
