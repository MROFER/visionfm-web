import type { MetadataRoute } from 'next'

import { urlDelSitio } from '@/sitio/lib/compartir'
import { sePuedeIndexar } from '@/sitio/seo/indexacion'

// Se arma en cada pedido: INDEXAR se lee al correr, no en el build de Docker
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!sePuedeIndexar()) return { rules: { userAgent: '*', disallow: '/' } }
  const origen = urlDelSitio().origin
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // El panel, la API y los links de salida de anuncios no son páginas
      disallow: ['/admin', '/cms-api', '/api/', '/a/'],
    },
    sitemap: `${origen}/sitemap.xml`,
  }
}
