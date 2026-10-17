import { afterEach, describe, expect, it } from 'vitest'

import { sePuedeIndexar } from '@/sitio/seo/indexacion'
import { llmsTxt } from '@/sitio/seo/llms'
import {
  absoluta,
  escaparXml,
  indiceDeSitemaps,
  masNueva,
  rss,
  sitemap,
  sitemapDeNoticias,
} from '@/sitio/seo/xml'

const ORIGEN = 'https://visionfm.prueba'

describe('escaparXml', () => {
  it('escapa los caracteres especiales y saca los de control', () => {
    expect(escaparXml(`Tom & "Jerry" <b>'s\u0007`)).toBe(
      'Tom &amp; &quot;Jerry&quot; &lt;b&gt;&apos;s',
    )
  })
})

describe('absoluta', () => {
  it('suma el dominio a una ruta y deja igual una URL completa', () => {
    expect(absoluta(ORIGEN, '/noticias')).toBe(`${ORIGEN}/noticias`)
    expect(absoluta(`${ORIGEN}/`, 'rss.xml')).toBe(`${ORIGEN}/rss.xml`)
    expect(absoluta(ORIGEN, 'https://r2.prueba/foto.webp')).toBe('https://r2.prueba/foto.webp')
  })
})

describe('sitemap', () => {
  it('lista cada URL con su fecha y sus imágenes', () => {
    const xml = sitemap(ORIGEN, [
      { ruta: '/', modificada: null },
      {
        ruta: '/radio/entrevistas?programa=a&b',
        modificada: '2026-10-01T12:00:00.000Z',
        imagenes: ['/foto.webp'],
      },
    ])
    expect(xml).toContain('xmlns:image=')
    expect(xml).toContain(`<url><loc>${ORIGEN}/</loc></url>`)
    expect(xml).toContain(
      `<loc>${ORIGEN}/radio/entrevistas?programa=a&amp;b</loc><lastmod>2026-10-01T12:00:00.000Z</lastmod><image:image><image:loc>${ORIGEN}/foto.webp</image:loc></image:image>`,
    )
  })

  it('sin imágenes no declara el espacio de nombres de imágenes', () => {
    expect(sitemap(ORIGEN, [{ ruta: '/' }])).not.toContain('xmlns:image')
  })

  it('el índice apunta a cada sitemap', () => {
    const xml = indiceDeSitemaps(ORIGEN, [
      { ruta: '/sitemaps/general.xml', modificada: '2026-10-01T00:00:00Z' },
    ])
    expect(xml).toContain(
      `<sitemap><loc>${ORIGEN}/sitemaps/general.xml</loc><lastmod>2026-10-01T00:00:00.000Z</lastmod></sitemap>`,
    )
  })
})

describe('sitemapDeNoticias', () => {
  it('incluye solo las notas de las últimas 48 h', () => {
    const ahora = new Date('2026-10-17T12:00:00Z')
    const xml = sitemapDeNoticias(
      ORIGEN,
      [
        { ruta: '/noticias/locales/nueva', titulo: 'Nueva & buena', fecha: '2026-10-17T09:00:00Z' },
        { ruta: '/noticias/locales/vieja', titulo: 'Vieja', fecha: '2026-10-15T11:59:00Z' },
      ],
      ahora,
    )
    expect(xml).toContain('/noticias/locales/nueva')
    expect(xml).toContain('<news:title>Nueva &amp; buena</news:title>')
    expect(xml).toContain('<news:name>Visión 96.5 FM</news:name><news:language>es</news:language>')
    expect(xml).not.toContain('/noticias/locales/vieja')
  })
})

describe('rss', () => {
  it('arma el canal con cada nota, su sección y su foto', () => {
    const xml = rss(ORIGEN, { titulo: 'Noticias', descripcion: 'Últimas', ruta: '/rss.xml' }, [
      {
        ruta: '/noticias/locales/una',
        titulo: 'Una <nota>',
        bajada: 'Bajada',
        fecha: '2026-10-17T09:00:00Z',
        seccion: 'Locales',
        imagen: { url: '/foto.webp', ancho: 1200, alto: 800 },
      },
    ])
    expect(xml).toContain(
      `<atom:link href="${ORIGEN}/rss.xml" rel="self" type="application/rss+xml"/>`,
    )
    expect(xml).toContain('<lastBuildDate>Sat, 17 Oct 2026 09:00:00 GMT</lastBuildDate>')
    expect(xml).toContain('<title>Una &lt;nota&gt;</title>')
    expect(xml).toContain(`<guid isPermaLink="true">${ORIGEN}/noticias/locales/una</guid>`)
    expect(xml).toContain('<category>Locales</category>')
    expect(xml).toContain(
      `<media:content url="${ORIGEN}/foto.webp" medium="image" width="1200" height="800"/>`,
    )
  })
})

describe('masNueva', () => {
  it('devuelve la fecha más reciente o null', () => {
    expect(masNueva(['2026-10-01T00:00:00Z', null, '2026-10-03T00:00:00Z'])).toBe(
      '2026-10-03T00:00:00Z',
    )
    expect(masNueva([])).toBeNull()
  })
})

describe('llmsTxt', () => {
  it('resume el sitio con links absolutos', () => {
    const texto = llmsTxt(ORIGEN, {
      telefono: '4562 0000',
      direccion: '18 de Julio 1234, Fray Bentos',
      email: '',
      redes: [{ red: 'facebook', url: 'https://facebook.com/visionfm' }],
      secciones: [{ nombre: 'Locales', slug: 'locales' }],
      notas: [
        { ruta: '/noticias/locales/una', titulo: 'Una [nota]', fecha: '2026-10-17T09:00:00Z' },
      ],
      peliculas: [{ titulo: 'Película', slug: 'pelicula' }],
      programas: [{ nombre: 'La mañana' }],
    })
    expect(texto.startsWith('# Visión 96.5 FM\n\n> ')).toBe(true)
    expect(texto).toContain('Dirección: 18 de Julio 1234, Fray Bentos. Teléfono: 4562 0000.')
    expect(texto).not.toContain('Email:')
    expect(texto).toContain(`- [Locales](${ORIGEN}/noticias/locales)`)
    expect(texto).toContain(`- [Una nota](${ORIGEN}/noticias/locales/una): 2026-10-17`)
    expect(texto).toContain(`- [Película](${ORIGEN}/cinevision/pelicula)`)
    expect(texto).toContain('grilla semanal (La mañana)')
    expect(texto).toContain('- [Facebook](https://facebook.com/visionfm)')
  })
})

describe('sePuedeIndexar', () => {
  const antes = process.env.INDEXAR
  afterEach(() => {
    if (antes === undefined) delete process.env.INDEXAR
    else process.env.INDEXAR = antes
  })

  it('solo con INDEXAR=si', () => {
    delete process.env.INDEXAR
    expect(sePuedeIndexar()).toBe(false)
    process.env.INDEXAR = 'true'
    expect(sePuedeIndexar()).toBe(false)
    process.env.INDEXAR = 'si'
    expect(sePuedeIndexar()).toBe(true)
  })
})
