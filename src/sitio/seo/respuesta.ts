/** Sitemaps, RSS y llms.txt: Cloudflare los guarda una hora y se purgan al publicar (src/sitio/cache/mapa.ts). */
export const respuesta = (cuerpo: string, tipo: string) =>
  new Response(cuerpo, {
    headers: {
      'Content-Type': `${tipo}; charset=utf-8`,
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  })
