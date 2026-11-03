import type { MetadataRoute } from 'next'

import { urlDelSitio } from '@/sitio/lib/compartir'
import { reglasDeRobots } from '@/sitio/seo/bots'
import { sePuedeIndexar } from '@/sitio/seo/indexacion'

// Se arma en cada pedido: INDEXAR se lee al correr, no en el build de Docker
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!sePuedeIndexar()) return { rules: { userAgent: '*', disallow: '/' } }
  const origen = urlDelSitio().origin
  return {
    rules: reglasDeRobots(),
    sitemap: `${origen}/sitemap.xml`,
  }
}
