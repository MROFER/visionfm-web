import type { GlobalConfig } from 'payload'

import { tienePermiso, type UsuarioConPermisos } from '@/base/permisos'

// docs/04-esquema.md (portada): elegir la destacada es publicar en la portada
export const Portada: GlobalConfig = {
  slug: 'portada',
  admin: { group: 'Noticias' },
  access: {
    read: () => true,
    update: ({ req }) =>
      tienePermiso(req.user as unknown as UsuarioConPermisos, 'noticias', 'publicar'),
  },
  fields: [
    {
      name: 'notaDestacada',
      label: 'Nota destacada',
      type: 'relationship',
      relationTo: 'noticias',
    },
    {
      name: 'peliculaDestacada',
      label: 'Película destacada',
      type: 'relationship',
      relationTo: 'peliculas',
    },
  ],
}
