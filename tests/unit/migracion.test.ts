import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import {
  bajadaDe,
  imagenOriginal,
  recortar,
  rutaDe,
  slugDe,
  textoPlano,
  tituloDe,
} from '@/migracion/contenido'
import { imagenesDe, prepararHtml, resolverImagenes, textoDelDocumento } from '@/migracion/lexical'
import { esRutaSpam, limpiarSpam, motivoSpam } from '@/migracion/spam'
import type { PostWp } from '@/migracion/wordpress'

const post = (cambios: Partial<PostWp> = {}): PostWp => ({
  id: 1,
  date_gmt: '2025-03-01T12:00:00',
  modified_gmt: '2025-03-01T12:00:00',
  slug: 'obras-en-la-rambla',
  link: 'https://visionfm.com.uy/obras-en-la-rambla/',
  status: 'publish',
  title: { rendered: 'Obras en la rambla' },
  excerpt: { rendered: '' },
  content: { rendered: '<p>La intendencia comenzó las obras.</p>' },
  categories: [1],
  tags: [],
  featured_media: 0,
  ...cambios,
})

const documento = (html: string) => new JSDOM(`<body>${html}</body>`).window.document

describe('filtro de spam', () => {
  it('deja pasar una nota de la radio', () => {
    expect(motivoSpam(post())).toBeNull()
  })

  it('marca las entradas de casinos por el título, el slug o la categoría', () => {
    expect(motivoSpam(post({ title: { rendered: '1win Plinko: juega y gana' } }))).toMatch(/título/)
    expect(motivoSpam(post({ slug: '1win-plinko-review-uruguay' }))).toMatch(/1win/i)
    expect(
      motivoSpam(
        post({
          _embedded: {
            'wp:term': [[{ id: 191, name: '1xbet apk', slug: '1xbet-apk', taxonomy: 'category' }]],
          },
        }),
      ),
    ).toMatch(/1xbet apk/)
    expect(motivoSpam(post({ title: { rendered: 'Лучшие казино онлайн' } }))).toMatch(/alfabeto/)
  })

  it('no marca una nota real que nombra un casino una vez', () => {
    const nota = post({
      title: { rendered: 'Reabre la sala de juegos del hotel' },
      content: { rendered: '<p>El casino del hotel vuelve a abrir el viernes.</p>' },
    })
    expect(motivoSpam(nota)).toBeNull()
  })

  it('saca los bloques ocultos y deja el texto de los enlaces a casinos', () => {
    const doc = documento(
      '<p>Texto real.</p>' +
        '<div style="display:none"><a href="https://casino.example">casino</a> <a href="https://x.example">bet</a></div>' +
        '<p style="position:absolute;left:-9999px">slots</p>' +
        '<p>Mirá <a href="https://1xbet.example/promo">esta promo</a> y <a href="https://intendencia.gub.uy">la intendencia</a>.</p>',
    )
    expect(limpiarSpam(doc)).toEqual({ enlaces: 3, bloques: 2 })
    expect(doc.body.innerHTML).toBe(
      '<p>Texto real.</p><p>Mirá esta promo y <a href="https://intendencia.gub.uy">la intendencia</a>.</p>',
    )
  })

  it('reconoce las categorías y etiquetas de casinos del sitemap', () => {
    expect(esRutaSpam('/category/1xbet-apk/')).toBe(true)
    expect(esRutaSpam('/tag/casino-en-ligne-fr/')).toBe(true)
    expect(esRutaSpam('/category/deportes/')).toBe(false)
  })
})

describe('textos de la nota', () => {
  it('resuelve las entidades de WordPress', () => {
    expect(textoPlano('&#8220;Hola&#8221; &amp; chau&#8230;')).toBe('“Hola” & chau…')
  })

  it('recorta en una palabra y agrega puntos suspensivos', () => {
    expect(recortar('uno dos tres cuatro', 12)).toBe('uno dos…')
    expect(recortar('corto', 12)).toBe('corto')
    expect(tituloDe('palabra '.repeat(30)).length).toBeLessThanOrEqual(120)
  })

  it('arma la bajada con el resumen, el texto o el título', () => {
    const largo =
      'La intendencia de Río Negro comenzó las obras de la rambla, que van a durar seis meses.'
    expect(bajadaDe(`<p>${largo} [&hellip;]</p>`, 'Obras', '')).toBe(largo)
    expect(bajadaDe('<p>Corto</p>', 'Obras', largo)).toBe(largo)
    expect(
      bajadaDe(
        '',
        'Obras en la rambla de Fray Bentos',
        'Empiezan el lunes y van a durar unos seis meses.',
      ),
    ).toBe('Obras en la rambla de Fray Bentos. Empiezan el lunes y van a durar unos seis meses.')
    expect(bajadaDe('', 'Breve', 'Muy corta.')).toBeNull()
    expect(bajadaDe(`<p>${largo.repeat(5)}</p>`, 'x', '')!.length).toBeLessThanOrEqual(280)
  })

  it('limpia el slug viejo y lo acorta en un guion', () => {
    expect(slugDe('a%c3%b1o-nuevo-en-fray-bentos', 'x')).toBe('ano-nuevo-en-fray-bentos')
    const largo = slugDe(
      'pago-despues-es-una-aplicacion-financiera-uruguaya-que-permite-comprar-en-cuotas-y-acceder-a-prestamos',
      'x',
    )
    expect(largo.length).toBeLessThanOrEqual(90)
    expect(largo.endsWith('-')).toBe(false)
  })

  it('guarda la ruta vieja y pide la imagen original', () => {
    expect(rutaDe('https://visionfm.com.uy/a%C3%B1o-nuevo/')).toBe('/año-nuevo/')
    expect(
      imagenOriginal('https://visionfm.com.uy/wp-content/uploads/2025/03/foto-1024x683.jpg'),
    ).toBe('https://visionfm.com.uy/wp-content/uploads/2025/03/foto.jpg')
  })
})

describe('HTML a Lexical', () => {
  it('cambia los videos por un enlace y saca scripts y párrafos vacíos', () => {
    const doc = documento(
      '<script>alert(1)</script><p>&nbsp;</p>' +
        '<figure class="wp-block-embed"><iframe src="//www.youtube.com/embed/dQw4w9WgXcQ"></iframe></figure>' +
        '<iframe src="https://www.facebook.com/plugins/video.php?v=1"></iframe>',
    )
    prepararHtml(doc)
    expect(doc.body.innerHTML).toBe(
      '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Ver el video en YouTube</a></p>' +
        '<p><a href="https://www.facebook.com/plugins/video.php?v=1">Ver en facebook.com</a></p>',
    )
  })

  it('usa la imagen original y saca el enlace al lightbox', () => {
    const doc = documento(
      '<a href="https://visionfm.com.uy/wp-content/uploads/a.jpg"><img src="https://visionfm.com.uy/wp-content/uploads/a-300x200.jpg"></a>',
    )
    prepararHtml(doc)
    expect(doc.body.innerHTML).toBe('<img src="https://visionfm.com.uy/wp-content/uploads/a.jpg">')
  })

  it('deja las citas sin párrafos adentro', () => {
    const doc = documento('<blockquote><p>uno</p><p>dos</p></blockquote>')
    prepararHtml(doc)
    expect(doc.body.innerHTML).toBe('<blockquote>uno<br>dos</blockquote>')
  })

  it('saca el texto del cuerpo sin tocar el documento', () => {
    const doc = documento('<p>uno</p><p>dos<br>tres</p>')
    expect(textoDelDocumento(doc)).toBe('uno dos tres')
    expect(doc.body.innerHTML).toBe('<p>uno</p><p>dos<br>tres</p>')
  })

  it('cambia las imágenes por las subidas y las saca del párrafo', () => {
    const texto = { type: 'text', text: 'Hola', version: 1 }
    const imagen = (src: string) => ({ type: 'upload', version: 3, pending: { src }, id: 'x' })
    const estado = {
      root: {
        type: 'root',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        children: [
          { type: 'paragraph', version: 1, children: [imagen('a.jpg')] },
          { type: 'paragraph', version: 1, children: [texto, imagen('b.jpg')] },
          { type: 'paragraph', version: 1, children: [imagen('rota.jpg')] },
        ],
      },
    } as never
    expect(imagenesDe(estado)).toEqual(['a.jpg', 'b.jpg', 'rota.jpg'])
    const ids: Record<string, number> = { 'a.jpg': 1, 'b.jpg': 2 }
    const { root } = resolverImagenes(estado, (src) => ids[src])
    expect(root.children.map((n) => [n.type, (n as { value?: number }).value])).toEqual([
      ['upload', 1],
      ['paragraph', undefined],
      ['upload', 2],
    ])
  })
})
