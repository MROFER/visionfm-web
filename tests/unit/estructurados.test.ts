import { describe, expect, it } from 'vitest'

import type { PeliculaCompleta } from '@/sitio/datos/cinevision'
import { articulo, cine, jsonLd, migas, pelicula, radioYSitio } from '@/sitio/seo/estructurados'

const ORIGEN = 'https://visionfm.prueba'

describe('radioYSitio', () => {
  it('describe la radio con su dirección y redes, sin los datos vacíos', () => {
    const [radio, sitio] = radioYSitio(ORIGEN, {
      telefono: '4562 0000',
      email: '',
      direccion: '18 de Julio 1000, Fray Bentos',
      redes: [{ url: 'https://facebook.com/visionfm' }, { url: 'facebook.com/sin-protocolo' }],
    })
    expect(radio).toMatchObject({
      '@type': 'RadioStation',
      '@id': `${ORIGEN}/#radio`,
      telephone: '4562 0000',
      address: {
        streetAddress: '18 de Julio 1000',
        addressLocality: 'Fray Bentos',
        addressCountry: 'UY',
      },
      sameAs: ['https://facebook.com/visionfm'],
    })
    expect(radio).not.toHaveProperty('email')
    expect(sitio).toMatchObject({ '@type': 'WebSite', publisher: { '@id': `${ORIGEN}/#radio` } })
  })
})

describe('migas', () => {
  it('empieza en Inicio y deja la última sin link', () => {
    expect(
      migas(ORIGEN, [{ nombre: 'Noticias', ruta: '/noticias' }, { nombre: 'Una nota' }]),
    ).toEqual({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${ORIGEN}/` },
        { '@type': 'ListItem', position: 2, name: 'Noticias', item: `${ORIGEN}/noticias` },
        { '@type': 'ListItem', position: 3, name: 'Una nota' },
      ],
    })
  })
})

describe('articulo', () => {
  const nota = {
    href: '/noticias/locales/una',
    titulo: 'x'.repeat(130),
    bajada: 'Bajada',
    fecha: '2026-10-17T09:00:00.000Z',
    actualizada: null,
    firma: 'Ana Pérez',
    seccion: { nombre: 'Locales' },
    foto: {
      url: '/foto.webp',
      alt: '',
      ancho: 1600,
      alto: 900,
      tamanos: [],
      compartir: '/foto-1200.jpg',
    },
  }

  it('arma la NewsArticle con autor, fechas, foto y speakable', () => {
    const a = articulo(ORIGEN, nota)
    expect(a).toMatchObject({
      '@type': 'NewsArticle',
      mainEntityOfPage: `${ORIGEN}/noticias/locales/una`,
      datePublished: nota.fecha,
      dateModified: nota.fecha,
      articleSection: 'Locales',
      image: [`${ORIGEN}/foto-1200.jpg`],
      author: { '@type': 'Person', name: 'Ana Pérez' },
      publisher: { '@id': `${ORIGEN}/#radio` },
      speakable: { '@type': 'SpeakableSpecification' },
    })
    expect((a.headline as string).length).toBe(110)
  })

  it('sin firma, el autor es la radio; con fecha de actualización, va en dateModified', () => {
    const a = articulo(ORIGEN, {
      ...nota,
      firma: 'Redacción Visión',
      actualizada: '2026-10-18T10:00:00.000Z',
    })
    expect(a.author).toMatchObject({ '@type': 'Organization' })
    expect(a.dateModified).toBe('2026-10-18T10:00:00.000Z')
  })
})

describe('pelicula', () => {
  const p = {
    id: 1,
    titulo: 'El faro del sur',
    slug: 'el-faro-del-sur',
    genero: 'Drama',
    duracion: 112,
    calificacion: '13',
    sinopsis: 'Sinopsis.',
    esEstreno: false,
    afiche: null,
    tituloOriginal: '',
    anio: 2026,
    idiomas: ['subtitulada'],
    formatos: ['2d'],
    trailer: '',
    fechaEstreno: null,
    creditos: {
      direccion: 'Ana Gómez',
      reparto: 'Uno, Dos y Tres',
      guion: '',
      pais: 'Uruguay',
      idiomaOriginal: '',
      distribuidora: '',
    },
    seo: { titulo: '', descripcion: '', imagen: null },
  } as unknown as PeliculaCompleta

  it('arma la Movie y una ScreeningEvent por función en Cinevisión', () => {
    const [obra, funcion] = pelicula(ORIGEN, p, [
      { fechaHora: '2026-10-17T23:30:00.000Z', idioma: 'subtitulada', formato: '2d' },
    ])
    expect(obra).toMatchObject({
      '@type': 'Movie',
      duration: 'PT112M',
      contentRating: '+13',
      dateCreated: '2026',
      director: [{ '@type': 'Person', name: 'Ana Gómez' }],
      actor: [{ name: 'Uno' }, { name: 'Dos' }, { name: 'Tres' }],
    })
    expect(funcion).toMatchObject({
      '@type': 'ScreeningEvent',
      name: 'El faro del sur (Subtitulada, 2D)',
      startDate: '2026-10-17T23:30:00.000Z',
      location: { '@id': `${ORIGEN}/cinevision#cine` },
      workPresented: { '@id': obra['@id'] },
    })
  })
})

describe('cine', () => {
  it('es un MovieTheater con la dirección que cargó la radio', () => {
    expect(
      cine(ORIGEN, { direccion: 'Rincón 1234', telefono: '', mapa: null, mapaLink: '' }),
    ).toMatchObject({
      '@type': 'MovieTheater',
      address: { streetAddress: 'Rincón 1234', addressLocality: 'Fray Bentos' },
    })
  })
})

describe('jsonLd', () => {
  it('no deja cerrar el <script> desde un título', () => {
    const texto = jsonLd([{ name: '</script><script>alert(1)</script>' }])
    expect(texto).not.toContain('</script>')
    expect(JSON.parse(texto)['@graph'][0].name).toBe('</script><script>alert(1)</script>')
  })
})
