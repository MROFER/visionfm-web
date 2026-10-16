import { unstable_cache } from 'next/cache'

import { payload } from './index'

// Páginas legales (docs/04-esquema.md, paginas): aviso legal, privacidad, cookies y condiciones de uso.

/** Una página publicada por su slug, o null. Los cambios refrescan la etiqueta `pagina:{slug}`. */
export const obtenerPagina = (slug: string) =>
  unstable_cache(
    async () => {
      const p = await payload()
      const { docs } = await p.find({
        collection: 'paginas',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
      })
      const d = docs[0]
      if (!d) return null
      return {
        titulo: d.titulo,
        cuerpo: d.cuerpo,
        actualizada: d.updatedAt,
        seo: { titulo: d.seo?.titulo || d.titulo, descripcion: d.seo?.descripcion || '' },
      }
    },
    ['pagina', slug],
    { tags: [`pagina:${slug}`] },
  )()
