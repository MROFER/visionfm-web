import type { Metadata } from 'next'

import type { Imagen } from '../datos/formas'

type OpenGraph = NonNullable<Metadata['openGraph']>

/** La dirección pública del sitio: las imágenes de la vista previa tienen que ir con dominio. */
export const urlDelSitio = () =>
  new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

const IMAGEN_DEL_SITIO = {
  url: '/marca/compartir.png',
  width: 1200,
  height: 630,
  alt: 'Visión 96.5 FM',
}

/** Lo que va en cada vista previa. Next no suma el openGraph del layout al de la página: lo reemplaza. */
export const OPEN_GRAPH: OpenGraph = {
  siteName: 'Visión 96.5 FM',
  locale: 'es_UY',
  type: 'website',
  images: [IMAGEN_DEL_SITIO],
}

/**
 * La imagen para WhatsApp, Facebook y X: el recorte de 1200×630 si la foto lo tiene; si no, la original
 * si no es enorme, o la versión más grande que no pase de 1600 px. Un afiche va entero: recortado a lo
 * ancho perdería casi todo.
 */
export function imagenParaCompartir(imagen: Imagen | null, { recortar = true } = {}) {
  if (!imagen) return [IMAGEN_DEL_SITIO]
  if (recortar && imagen.compartir)
    return [{ url: imagen.compartir, width: 1200, height: 630, alt: imagen.alt }]
  if (imagen.ancho <= 2000) {
    return [{ url: imagen.url, width: imagen.ancho, height: imagen.alto, alt: imagen.alt }]
  }
  const version = imagen.tamanos.filter((t) => t.ancho <= 1600).at(-1)
  if (!version)
    return [{ url: imagen.url, width: imagen.ancho, height: imagen.alto, alt: imagen.alt }]
  const alto = Math.round((imagen.alto * version.ancho) / imagen.ancho)
  return [{ url: version.url, width: version.ancho, height: alto, alt: imagen.alt }]
}
