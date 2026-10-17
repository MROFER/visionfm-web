import {
  convertHTMLToLexical,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'

import type { Noticia } from '@/payload-types'
import { idDeYouTube } from '@/sitio/lib/youtube'
import { imagenOriginal } from './contenido'

type Nodo = { type: string; children?: Nodo[]; [clave: string]: unknown }
export type EstadoLexical = Noticia['cuerpo']

const QUITAR = 'script, style, noscript, form, input, button, select, textarea, svg, link, meta'

/** La imagen más grande que ofrece un `<img>` de WordPress (srcset o el original sin `-1024x683`). */
function mejorFuente(img: Element): string | null {
  const opciones = (img.getAttribute('srcset') ?? '')
    .split(',')
    .map((o) => o.trim().split(/\s+/))
    .filter(([url, ancho]) => url && /^\d+w$/.test(ancho ?? ''))
    .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))
  const src =
    img.getAttribute('data-src') ?? img.getAttribute('data-lazy-src') ?? img.getAttribute('src')
  if (src && !src.startsWith('data:')) return imagenOriginal(src)
  return opciones[0]?.[0] ?? null
}

const parrafoConEnlace = (documento: Document, href: string, texto: string) => {
  const p = documento.createElement('p')
  const a = documento.createElement('a')
  a.setAttribute('href', href)
  a.textContent = texto
  p.append(a)
  return p
}

/**
 * Deja el HTML de una nota en lo que el editor del sitio nuevo sabe mostrar: sin scripts ni estilos,
 * los videos y otros embebidos como un enlace, las imágenes en su tamaño original y las citas sin
 * párrafos adentro.
 */
export function prepararHtml(
  documento: Document,
  opciones: {
    /** Adónde lleva un audio del sitio viejo (la entrevista migrada), o `null` para sacarlo. */
    enlaceDeAudio?: (src: string) => { href: string; texto: string } | null
  } = {},
) {
  for (const e of [...documento.querySelectorAll(QUITAR)]) e.remove()

  // Las entrevistas eran un reproductor de WordPress con el MP3 subido a la nota: queda un enlace a la
  // entrevista en el sitio nuevo
  const audios = [...documento.querySelectorAll('audio')]
  const enlacesMp3 = [...documento.querySelectorAll('a[href]')].filter((a) =>
    /\.(mp3|m4a)(\?|$)/i.test(a.getAttribute('href') ?? ''),
  )
  for (const elemento of [...audios, ...enlacesMp3]) {
    if (!elemento.isConnected) continue
    const src = (
      elemento.getAttribute('src') ??
      elemento.querySelector('source')?.getAttribute('src') ??
      elemento.querySelector('a')?.getAttribute('href') ??
      elemento.getAttribute('href') ??
      ''
    ).split('?')[0]
    const destino = src ? opciones.enlaceDeAudio?.(src) : null
    if (elemento.tagName === 'A') {
      // Un enlace al MP3 dentro del texto pasa a llevar a la entrevista; sin ella queda el texto solo
      if (destino) elemento.setAttribute('href', destino.href)
      else elemento.replaceWith(documento.createTextNode(elemento.textContent ?? ''))
      continue
    }
    const contenedor = elemento.closest('figure, .wp-block-audio') ?? elemento
    if (destino) contenedor.replaceWith(parrafoConEnlace(documento, destino.href, destino.texto))
    else contenedor.remove()
  }

  for (const iframe of [...documento.querySelectorAll('iframe, embed, object, video')]) {
    const crudo = iframe.getAttribute('src') ?? iframe.getAttribute('data') ?? ''
    const src = crudo.startsWith('//') ? `https:${crudo}` : crudo
    const contenedor = iframe.closest('figure') ?? iframe
    const youtube = idDeYouTube(src)
    let host = ''
    try {
      host = new URL(src, 'https://visionfm.com.uy').hostname.replace(/^www\./, '')
    } catch {
      // src vacío o roto: el embebido se descarta
    }
    if (youtube) {
      contenedor.replaceWith(
        parrafoConEnlace(
          documento,
          `https://www.youtube.com/watch?v=${youtube}`,
          'Ver el video en YouTube',
        ),
      )
    } else if (src && host && !host.endsWith('visionfm.com.uy')) {
      contenedor.replaceWith(parrafoConEnlace(documento, src, `Ver en ${host}`))
    } else {
      contenedor.remove()
    }
  }

  for (const img of [...documento.querySelectorAll('img')]) {
    const fuente = mejorFuente(img)
    if (!fuente) {
      img.remove()
      continue
    }
    img.setAttribute('src', fuente)
    // Una imagen dentro de un enlace a sí misma (lightbox) queda sola
    const a = img.closest('a')
    if (a && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(a.getAttribute('href') ?? ''))
      a.replaceWith(img)
  }

  for (const cita of [...documento.querySelectorAll('blockquote')]) {
    const parrafos = [...cita.querySelectorAll('p')]
    parrafos.forEach((p, i) => {
      const fragmento = documento.createDocumentFragment()
      fragmento.append(...p.childNodes)
      if (i < parrafos.length - 1) fragmento.append(documento.createElement('br'))
      p.replaceWith(fragmento)
    })
  }

  // Párrafos vacíos que Elementor y el editor clásico dejan como espaciado
  for (const p of [...documento.querySelectorAll('p')]) {
    if (!p.querySelector('img') && !(p.textContent ?? '').replace(/[\s ]/g, '')) p.remove()
  }
}

export function aLexical(html: string, editorConfig: SanitizedServerEditorConfig): EstadoLexical {
  return convertHTMLToLexical({ editorConfig, html, JSDOM }) as unknown as EstadoLexical
}

const esImagen = (n: Nodo) => n.type === 'upload'
const fuenteDe = (n: Nodo) => (n.pending as { src?: string } | undefined)?.src

/** Las direcciones de las imágenes que quedaron en el texto, en orden. */
export function imagenesDe(estado: EstadoLexical): string[] {
  const urls: string[] = []
  const recorrer = (nodos: Nodo[]) => {
    for (const n of nodos) {
      const src = esImagen(n) && fuenteDe(n)
      if (src) urls.push(src)
      if (n.children) recorrer(n.children)
    }
  }
  recorrer(estado.root.children as Nodo[])
  return urls
}

/**
 * Cambia cada imagen del texto por la que se subió al sitio nuevo (o la saca si no se pudo bajar) y
 * la deja como bloque propio: el conversor de HTML las pone dentro de un párrafo.
 */
export function resolverImagenes(
  estado: EstadoLexical,
  idDe: (src: string) => number | null | undefined,
): EstadoLexical {
  const resolver = (n: Nodo): Nodo | null => {
    const id = idDe(fuenteDe(n) ?? '')
    if (!id) return null
    return {
      type: 'upload',
      version: 3,
      format: '',
      id: String(n.id ?? id),
      fields: null,
      relationTo: 'medios',
      value: id,
    }
  }
  const limpiar = (nodos: Nodo[]): Nodo[] =>
    nodos.flatMap((n) => {
      if (esImagen(n)) return [resolver(n)].filter((x): x is Nodo => x !== null)
      if (!n.children) return [n]
      const hijos = limpiar(n.children)
      // En el primer nivel, las imágenes salen del párrafo que las contiene
      return [{ ...n, children: hijos }]
    })
  const raiz = limpiar(estado.root.children as Nodo[]).flatMap((n) => {
    // Un párrafo que solo tenía una imagen que no se pudo bajar
    if (n.type === 'paragraph' && !n.children?.length) return []
    if (n.type !== 'paragraph' || !n.children?.some(esImagen)) return [n]
    const imagenes = n.children.filter(esImagen)
    const resto = n.children.filter((h) => !esImagen(h))
    const conTexto = resto.some(
      (h) => h.type !== 'linebreak' && (h.type !== 'text' || String(h.text).trim()),
    )
    return conTexto ? [{ ...n, children: resto }, ...imagenes] : imagenes
  })
  return {
    ...estado,
    root: { ...estado.root, children: raiz as EstadoLexical['root']['children'] },
  }
}

/** El texto plano del cuerpo, para la bajada cuando el resumen es corto. */
export function textoDelDocumento(documento: Document): string {
  const copia = documento.body.cloneNode(true) as HTMLElement
  for (const b of copia.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, figcaption')) {
    b.append(documento.createTextNode(' '))
  }
  for (const br of copia.querySelectorAll('br')) br.replaceWith(documento.createTextNode(' '))
  return (copia.textContent ?? '').replace(/\s+/g, ' ').trim()
}
