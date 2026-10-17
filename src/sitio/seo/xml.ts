// Armado de sitemaps y RSS (docs/05-plan.md, fase 5). Funciones puras: los datos llegan de src/sitio/datos/seo.ts.

export const NOMBRE_DEL_SITIO = 'Visión 96.5 FM'

export const escaparXml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Caracteres de control que rompen el XML (pueden venir pegados de Word en una bajada)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

/** Une el dominio con una ruta del sitio, o deja igual una URL que ya es absoluta (imágenes en R2). */
export const absoluta = (origen: string, ruta: string) =>
  /^https?:\/\//.test(ruta)
    ? ruta
    : `${origen.replace(/\/$/, '')}${ruta.startsWith('/') ? '' : '/'}${ruta}`

export type UrlDelSitemap = {
  ruta: string
  modificada?: string | null
  imagenes?: string[]
}

export function sitemap(origen: string, urls: UrlDelSitemap[]) {
  const conImagenes = urls.some((u) => u.imagenes?.length)
  const filas = urls.map((u) => {
    const partes = [`<loc>${escaparXml(absoluta(origen, u.ruta))}</loc>`]
    if (u.modificada) partes.push(`<lastmod>${new Date(u.modificada).toISOString()}</lastmod>`)
    for (const imagen of u.imagenes ?? []) {
      partes.push(
        `<image:image><image:loc>${escaparXml(absoluta(origen, imagen))}</image:loc></image:image>`,
      )
    }
    return `<url>${partes.join('')}</url>`
  })
  const espacios = conImagenes
    ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${espacios}>\n${filas.join('\n')}\n</urlset>\n`
}

export function indiceDeSitemaps(
  origen: string,
  partes: { ruta: string; modificada?: string | null }[],
) {
  const filas = partes.map((p) => {
    const lastmod = p.modificada ? `<lastmod>${new Date(p.modificada).toISOString()}</lastmod>` : ''
    return `<sitemap><loc>${escaparXml(absoluta(origen, p.ruta))}</loc>${lastmod}</sitemap>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filas.join('\n')}\n</sitemapindex>\n`
}

export type NotaParaNews = { ruta: string; titulo: string; fecha: string }

/** Google News solo mira las notas de las últimas 48 h y hasta 1000 por archivo. */
export const VENTANA_NEWS_MS = 48 * 3600_000
export const MAXIMO_NEWS = 1000

export function sitemapDeNoticias(origen: string, notas: NotaParaNews[], ahora = new Date()) {
  const desde = ahora.getTime() - VENTANA_NEWS_MS
  const filas = notas
    .filter((n) => new Date(n.fecha).getTime() >= desde)
    .slice(0, MAXIMO_NEWS)
    .map(
      (n) =>
        `<url><loc>${escaparXml(absoluta(origen, n.ruta))}</loc><news:news><news:publication><news:name>${escaparXml(NOMBRE_DEL_SITIO)}</news:name><news:language>es</news:language></news:publication><news:publication_date>${new Date(n.fecha).toISOString()}</news:publication_date><news:title>${escaparXml(n.titulo)}</news:title></news:news></url>`,
    )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${filas.join('\n')}\n</urlset>\n`
}

export type ItemRss = {
  ruta: string
  titulo: string
  bajada: string
  fecha: string
  seccion?: string | null
  imagen?: { url: string; ancho: number; alto: number } | null
}

export function rss(
  origen: string,
  canal: { titulo: string; descripcion: string; ruta: string },
  items: ItemRss[],
) {
  const propia = absoluta(origen, canal.ruta)
  const ultima = items[0]?.fecha
  const filas = items.map((i) => {
    const link = escaparXml(absoluta(origen, i.ruta))
    const partes = [
      `<title>${escaparXml(i.titulo)}</title>`,
      `<link>${link}</link>`,
      `<guid isPermaLink="true">${link}</guid>`,
      `<pubDate>${new Date(i.fecha).toUTCString()}</pubDate>`,
      `<description>${escaparXml(i.bajada)}</description>`,
    ]
    if (i.seccion) partes.push(`<category>${escaparXml(i.seccion)}</category>`)
    if (i.imagen) {
      const medidas = i.imagen.ancho ? ` width="${i.imagen.ancho}" height="${i.imagen.alto}"` : ''
      partes.push(
        `<media:content url="${escaparXml(absoluta(origen, i.imagen.url))}" medium="image"${medidas}/>`,
      )
    }
    return `<item>${partes.join('')}</item>`
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
    '<channel>',
    `<title>${escaparXml(canal.titulo)}</title>`,
    `<link>${escaparXml(absoluta(origen, '/'))}</link>`,
    `<description>${escaparXml(canal.descripcion)}</description>`,
    '<language>es-UY</language>',
    `<atom:link href="${escaparXml(propia)}" rel="self" type="application/rss+xml"/>`,
    ...(ultima ? [`<lastBuildDate>${new Date(ultima).toUTCString()}</lastBuildDate>`] : []),
    ...filas,
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}

/** La fecha más nueva de una lista (para el lastmod del índice), o null. */
export const masNueva = (fechas: (string | null | undefined)[]) =>
  fechas.reduce<string | null>((max, f) => (f && (!max || f > max) ? f : max), null)
