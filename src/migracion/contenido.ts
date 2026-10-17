import { JSDOM } from 'jsdom'

import { slugify } from '@/base/lib/slug'

// Límites de los campos de noticias (src/sitio/collections/Noticias.ts)
export const TITULO_MAXIMO = 120
export const BAJADA_MINIMA = 80
export const BAJADA_MAXIMA = 280
export const SLUG_MAXIMO = 90

/** Fecha de WordPress en UTC (`date_gmt` viene sin zona) a ISO. */
export const fechaWp = (gmt: string) => new Date(`${gmt.replace(/Z?$/, '')}Z`).toISOString()

/** Texto plano de un fragmento HTML de WordPress, con las entidades (&#8220;, &amp;…) resueltas. */
export function textoPlano(html: string): string {
  const { document } = new JSDOM(`<body>${html}</body>`).window
  for (const b of document.querySelectorAll('br, p, div, li, h1, h2, h3, h4, h5, h6')) {
    b.append(document.createTextNode(' '))
  }
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Corta en el último espacio antes del límite y agrega "…". */
export function recortar(texto: string, maximo: number): string {
  if (texto.length <= maximo) return texto
  const corte = texto.slice(0, maximo - 1)
  const espacio = corte.lastIndexOf(' ')
  return `${(espacio > maximo / 2 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.–—-]+$/, '')}…`
}

export function tituloDe(tituloHtml: string): string {
  return recortar(textoPlano(tituloHtml), TITULO_MAXIMO)
}

// WordPress cierra los resúmenes automáticos con "[…]" o "Leer más"
const COLA_DEL_RESUMEN = /\s*(\[(…|&hellip;|\.\.\.)\]|leer m[aá]s.*|continuar leyendo.*)$/i

/**
 * La bajada sale del resumen del post. Si es corta para el sitio nuevo, del comienzo del texto, y si la
 * nota entera es más corta que eso, del título más el texto. `null` si ni así llega al mínimo.
 */
export function bajadaDe(resumenHtml: string, tituloCompleto: string, cuerpo: string) {
  const resumen = textoPlano(resumenHtml).replace(COLA_DEL_RESUMEN, '').trim()
  const candidatas = [resumen, cuerpo, `${tituloCompleto}. ${cuerpo}`.trim()]
  const bajada = candidatas.find((c) => c.length >= BAJADA_MINIMA)
  return bajada ? recortar(bajada, BAJADA_MAXIMA) : null
}

/** El slug viejo, sin tildes y más corto si hace falta (cortado en un guion). */
export function slugDe(slugWp: string, titulo: string): string {
  let decodificado = slugWp
  try {
    decodificado = decodeURIComponent(slugWp)
  } catch {
    // un % suelto: se usa tal cual
  }
  const slug = slugify(decodificado) || slugify(titulo)
  if (slug.length <= SLUG_MAXIMO) return slug
  const corte = slug.slice(0, SLUG_MAXIMO + 1)
  return corte.slice(0, corte.lastIndexOf('-') > 40 ? corte.lastIndexOf('-') : SLUG_MAXIMO)
}

/** Ruta de una URL del sitio viejo, como la guarda Redirecciones (`/mi-nota/`). */
export function rutaDe(url: string): string {
  const { pathname } = new URL(url)
  try {
    return decodeURI(pathname)
  } catch {
    return pathname
  }
}

/** La versión más grande de una imagen de WordPress: sin el sufijo de tamaño `-1024x683`. */
export function imagenOriginal(url: string): string {
  return url.replace(/-\d+x\d+(?=\.(jpe?g|png|webp|gif|avif)(\?|$))/i, '')
}
