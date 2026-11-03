import { describe, expect, it } from 'vitest'

import type { PeliculaCompleta } from '@/sitio/datos/cinevision'
import {
  articulo,
  cine,
  emisiones,
  jsonLd,
  migas,
  pelicula,
  radioYSitio,
} from '@/sitio/seo/estructurados'

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

  it('la emisión dice la frecuencia y dónde escucharla, con el audio directo solo si es https', () => {
    const datos = { telefono: '', email: '', direccion: '', redes: [] }
    const emision = radioYSitio(ORIGEN, { ...datos, streamUrl: 'https://audio.prueba/vision' })[2]
    expect(emision).toMatchObject({
      '@type': 'BroadcastService',
      '@id': `${ORIGEN}/radio/en-vivo#emision`,
      broadcaster: { '@id': `${ORIGEN}/#radio` },
      broadcastFrequency: { broadcastFrequencyValue: 96.5, broadcastSignalModulation: 'FM' },
      potentialAction: {
        '@type': 'ListenAction',
        target: [`${ORIGEN}/radio/en-vivo`, 'https://audio.prueba/vision'],
      },
    })
    const sinAudio = radioYSitio(ORIGEN, { ...datos, streamUrl: 'http://audio.prueba' })[2]
    expect(sinAudio).toMatchObject({ potentialAction: { target: [`${ORIGEN}/radio/en-vivo`] } })
  })
})

describe('emisiones', () => {
  it('un BroadcastEvent por emisión, con hora de Montevideo y quienes conducen', () => {
    const [manana, noche] = emisiones(ORIGEN, [
      {
        programa: { nombre: 'Conectados', conduccion: 'Ana y Juan', descripcion: 'La mañana.' },
        fecha: '2026-11-03',
        inicio: '07:00',
        fin: '10:00',
      },
      {
        programa: { nombre: 'Trasnoche', conduccion: '' },
        fecha: '2026-11-03',
        inicio: '22:00',
        fin: '00:00',
      },
    ])
    expect(manana).toEqual({
      '@type': 'BroadcastEvent',
      name: 'Conectados',
      description: 'La mañana.',
      startDate: '2026-11-03T07:00:00-03:00',
      endDate: '2026-11-03T10:00:00-03:00',
      isLiveBroadcast: true,
      publishedOn: { '@id': `${ORIGEN}/radio/en-vivo#emision` },
      performer: [
        { '@type': 'Person', name: 'Ana' },
        { '@type': 'Person', name: 'Juan' },
      ],
      url: `${ORIGEN}/radio/programacion`,
    })
    // Lo que termina a medianoche termina al otro día, y sin conducción no hay performer
    expect(noche).toMatchObject({ endDate: '2026-11-04T00:00:00-03:00' })
    expect(noche).not.toHaveProperty('performer')
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

  it('con lo que trae la cartelera, sin ficha técnica, arma igual la película y sus funciones', () => {
    const { titulo, slug, genero, duracion, calificacion, sinopsis, afiche } = p
    const nodos = pelicula(
      ORIGEN,
      { titulo, slug, genero, duracion, calificacion, sinopsis, afiche },
      [{ fechaHora: '2026-10-17T23:30:00.000Z', idioma: 'doblada', formato: '3d' }],
    )
    expect(nodos).toHaveLength(2)
    expect(nodos[0]).not.toHaveProperty('director')
    expect(nodos[1]).toMatchObject({ '@type': 'ScreeningEvent', inLanguage: 'es' })
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

  it('lleva la lista de precios, con el número y la moneda cuando se pueden leer', () => {
    const nodo = cine(ORIGEN, { direccion: '', telefono: '', mapa: null, mapaLink: '' }, [
      { concepto: 'Entrada general', precio: '$ 300' },
      { concepto: 'Función especial', precio: '$ 1.200' },
      { concepto: 'Combo', precio: '$ 250,50' },
      { concepto: 'Abono', precio: 'U$S 20' },
      { concepto: 'Cumpleaños', precio: 'Consultar' },
    ])
    expect(nodo.makesOffer).toEqual([
      { '@type': 'Offer', name: 'Entrada general', price: '300', priceCurrency: 'UYU' },
      { '@type': 'Offer', name: 'Función especial', price: '1200', priceCurrency: 'UYU' },
      { '@type': 'Offer', name: 'Combo', price: '250.50', priceCurrency: 'UYU' },
      { '@type': 'Offer', name: 'Abono', price: '20', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Cumpleaños', description: 'Consultar' },
    ])
  })
})

describe('jsonLd', () => {
  it('no deja cerrar el <script> desde un título', () => {
    const texto = jsonLd([{ name: '</script><script>alert(1)</script>' }])
    expect(texto).not.toContain('</script>')
    expect(JSON.parse(texto)['@graph'][0].name).toBe('</script><script>alert(1)</script>')
  })
})
