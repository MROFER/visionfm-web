// Lectura del WordPress viejo por su API REST pública, sin usuario (docs/05-plan.md, fase 4)

export interface TerminoWp {
  id: number
  name: string
  slug: string
  taxonomy: string
}

export interface MedioWp {
  id: number
  source_url: string
  alt_text?: string
  caption?: { rendered: string }
  title?: { rendered: string }
  mime_type?: string
}

export interface PostWp {
  id: number
  date_gmt: string
  modified_gmt: string
  slug: string
  link: string
  status: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  categories: number[]
  tags: number[]
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: (MedioWp | { code: string })[]
    'wp:term'?: TerminoWp[][]
  }
}

/** Un audio subido a la biblioteca de medios: así guarda hoy la radio sus entrevistas. */
export interface AudioWp {
  id: number
  date_gmt: string
  title: { rendered: string }
  source_url: string
  mime_type: string
  /** El post al que se subió (la nota de la entrevista), o 0. */
  post: number | null
  media_details?: { length?: number }
}

const POR_PAGINA = 100

export interface ClienteWp {
  /** Recorre todos los posts publicados, del más viejo al más nuevo. */
  posts(): AsyncGenerator<PostWp>
  /** Recorre todos los audios de la biblioteca de medios, del más viejo al más nuevo. */
  audios(): AsyncGenerator<AudioWp>
  /** Baja un archivo (imagen o audio) del sitio viejo. */
  archivo(url: string): Promise<{ data: Buffer; tipo: string } | null>
  /** Todas las URL de los sitemaps, para saber qué direcciones viejas tienen que responder. */
  sitemap(): Promise<string[]>
}

async function conReintentos(url: string, intentos = 4): Promise<Response> {
  let ultimo: unknown
  for (let i = 0; i < intentos; i++) {
    try {
      const respuesta = await fetch(url, {
        headers: { 'User-Agent': 'visionfm-migracion/1.0', Accept: '*/*' },
        redirect: 'follow',
      })
      // 4xx no se arregla reintentando
      if (respuesta.ok || (respuesta.status >= 400 && respuesta.status < 500)) return respuesta
      ultimo = new Error(`${respuesta.status} en ${url}`)
    } catch (error) {
      ultimo = error
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i))
  }
  throw ultimo
}

const ubicaciones = (xml: string) =>
  [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?\s*<\/loc>/g)].map((m) =>
    m[1].trim().replace(/&amp;/g, '&'),
  )

/** Recorre una colección de la API REST, página por página. */
async function* paginas<T>(base: string): AsyncGenerator<T> {
  for (let pagina = 1; ; pagina++) {
    const url = `${base}&per_page=${POR_PAGINA}&page=${pagina}`
    const respuesta = await conReintentos(url)
    // WordPress responde 400 cuando se pide una página después de la última
    if (respuesta.status === 400 && pagina > 1) return
    if (!respuesta.ok) throw new Error(`La API de WordPress respondió ${respuesta.status}: ${url}`)
    const items = (await respuesta.json()) as T[]
    for (const item of items) yield item
    const total = Number(respuesta.headers.get('x-wp-totalpages') ?? 0)
    if (items.length < POR_PAGINA || (total && pagina >= total)) return
  }
}

export function clienteWordpress(base: string): ClienteWp {
  const raiz = base.replace(/\/+$/, '')
  return {
    posts: () =>
      paginas<PostWp>(
        `${raiz}/wp-json/wp/v2/posts?status=publish&orderby=id&order=asc&_embed=wp:featuredmedia,wp:term`,
      ),

    audios: () =>
      paginas<AudioWp>(`${raiz}/wp-json/wp/v2/media?media_type=audio&orderby=id&order=asc`),

    async archivo(url) {
      const respuesta = await conReintentos(new URL(url, raiz).toString())
      if (!respuesta.ok) return null
      const tipo = respuesta.headers.get('content-type')?.split(';')[0].trim() ?? ''
      return { data: Buffer.from(await respuesta.arrayBuffer()), tipo }
    },

    async sitemap() {
      // WordPress trae su propio sitemap; Yoast lo reemplaza por sitemap_index.xml
      for (const indice of ['/sitemap_index.xml', '/wp-sitemap.xml', '/sitemap.xml']) {
        const respuesta = await conReintentos(raiz + indice)
        if (!respuesta.ok) continue
        const xml = await respuesta.text()
        if (!xml.includes('<loc>')) continue
        if (!xml.includes('<sitemapindex')) return ubicaciones(xml)
        const urls: string[] = []
        for (const hijo of ubicaciones(xml)) {
          const parte = await conReintentos(hijo)
          if (parte.ok) urls.push(...ubicaciones(await parte.text()))
        }
        return urls
      }
      return []
    },
  }
}

/** Categorías y etiquetas de un post, tal como vienen en `_embed`. */
export function terminosDe(post: PostWp): TerminoWp[] {
  return (post._embedded?.['wp:term'] ?? []).flat().filter(Boolean)
}

/** La imagen destacada, si el post tiene y es pública. */
export function imagenDestacada(post: PostWp): MedioWp | null {
  const medio = post._embedded?.['wp:featuredmedia']?.[0]
  return medio && 'source_url' in medio ? medio : null
}
