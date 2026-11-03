import type { DatosCinevision, PeliculaCompleta } from '../datos/cinevision'
import type { Imagen } from '../datos/formas'
import { nombreFormato, nombreIdioma } from '../lib/cine'
import { calificacion } from '../lib/formato'

// Datos estructurados de schema.org en JSON-LD (docs/01-prd.md y docs/06-revision.md): la radio, el sitio,
// la emisión en vivo, los programas de la semana, cada nota, cada película con sus funciones, el cine con
// sus precios y la ruta de cada página. Funciones puras.

type Nodo = Record<string, unknown>

const NOMBRE = 'Visión 96.5 FM'

const url = (origen: string, ruta: string) =>
  /^https?:\/\//.test(ruta) ? ruta : `${origen.replace(/\/$/, '')}${ruta}`

export const idRadio = (origen: string) => url(origen, '/#radio')
const idSitio = (origen: string) => url(origen, '/#sitio')
const idEmision = (origen: string) => url(origen, '/radio/en-vivo#emision')
const idCine = (origen: string) => url(origen, '/cinevision#cine')

const direccion = (calle: string) =>
  calle
    ? {
        '@type': 'PostalAddress',
        streetAddress: calle.replace(/,?\s*Fray Bentos\.?$/i, ''),
        addressLocality: 'Fray Bentos',
        addressRegion: 'Río Negro',
        addressCountry: 'UY',
      }
    : undefined

/** Saca los campos vacíos, así un dato que la radio no cargó no aparece como "" en el JSON-LD. */
function limpio<T extends Nodo>(nodo: T): T {
  return Object.fromEntries(
    Object.entries(nodo).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length),
    ),
  ) as T
}

const personas = (nombres: string) =>
  nombres
    .split(/,|\sy\s/)
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ '@type': 'Person', name }))

const imagenes = (origen: string, imagen: Imagen | null) =>
  imagen ? [url(origen, imagen.compartir ?? imagen.url)] : undefined

export function radioYSitio(
  origen: string,
  a: {
    telefono: string
    email: string
    direccion: string
    redes: { url: string }[]
    streamUrl?: string
  },
): Nodo[] {
  return [
    limpio({
      '@type': 'RadioStation',
      '@id': idRadio(origen),
      name: NOMBRE,
      url: url(origen, '/'),
      logo: url(origen, '/marca/icono-512.png'),
      image: url(origen, '/marca/compartir.png'),
      telephone: a.telefono,
      email: a.email,
      address: direccion(a.direccion),
      areaServed: 'Fray Bentos, Río Negro, Uruguay',
      sameAs: a.redes.map((r) => r.url).filter((u) => /^https?:\/\//.test(u)),
    }),
    {
      '@type': 'WebSite',
      '@id': idSitio(origen),
      name: NOMBRE,
      url: url(origen, '/'),
      inLanguage: 'es-UY',
      publisher: { '@id': idRadio(origen) },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: url(origen, '/noticias?q={search_term_string}'),
        },
        'query-input': 'required name=search_term_string',
      },
    },
    // La emisión en vivo: la 96.5 FM y dónde se escucha por internet (la página y el audio directo)
    limpio({
      '@type': 'BroadcastService',
      '@id': idEmision(origen),
      name: NOMBRE,
      url: url(origen, '/radio/en-vivo'),
      broadcaster: { '@id': idRadio(origen) },
      broadcastFrequency: {
        '@type': 'BroadcastFrequencySpecification',
        broadcastFrequencyValue: 96.5,
        broadcastSignalModulation: 'FM',
      },
      areaServed: 'Fray Bentos, Río Negro, Uruguay',
      inLanguage: 'es-UY',
      potentialAction: {
        '@type': 'ListenAction',
        target: [
          url(origen, '/radio/en-vivo'),
          ...(a.streamUrl?.startsWith('https://') ? [a.streamUrl] : []),
        ],
      },
    }),
  ]
}

const diaSiguiente = (fecha: string) =>
  new Date(Date.parse(`${fecha}T12:00:00Z`) + 24 * 60 * 60_000).toISOString().slice(0, 10)

/**
 * Lo que sale al aire en la semana, un BroadcastEvent por programa y horario, con los cambios de grilla
 * ya aplicados. Las horas van con el desfase de Montevideo (UTC-3 fijo).
 */
export function emisiones(
  origen: string,
  lista: {
    programa: { nombre: string; conduccion: string; descripcion?: string }
    fecha: string
    inicio: string
    fin: string
  }[],
): Nodo[] {
  return lista.map((e) =>
    limpio({
      '@type': 'BroadcastEvent',
      name: e.programa.nombre,
      description: e.programa.descripcion,
      startDate: `${e.fecha}T${e.inicio}:00-03:00`,
      endDate: `${e.fin === '00:00' ? diaSiguiente(e.fecha) : e.fecha}T${e.fin}:00-03:00`,
      isLiveBroadcast: true,
      publishedOn: { '@id': idEmision(origen) },
      performer: personas(e.programa.conduccion),
      url: url(origen, '/radio/programacion'),
    }),
  )
}

/** Inicio › … › la página actual. La última miga va sin link, como pide Google. */
export function migas(origen: string, pasos: { nombre: string; ruta?: string }[]): Nodo {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ nombre: 'Inicio', ruta: '/' }, ...pasos].map((p, i, todos) =>
      limpio({
        '@type': 'ListItem',
        position: i + 1,
        name: p.nombre,
        item: i < todos.length - 1 && p.ruta ? url(origen, p.ruta) : undefined,
      }),
    ),
  }
}

/** Google corta el titular en 110 caracteres. */
const titular = (texto: string) =>
  texto.length > 110 ? `${texto.slice(0, 109).trimEnd()}…` : texto

export function articulo(
  origen: string,
  nota: {
    href: string
    titulo: string
    bajada: string
    fecha: string | null
    actualizada: string | null
    firma: string
    seccion: { nombre: string } | null
    foto: Imagen | null
  },
): Nodo {
  const firmaDeLaRadio = nota.firma === 'Redacción Visión'
  return limpio({
    '@type': 'NewsArticle',
    '@id': url(origen, `${nota.href}#nota`),
    mainEntityOfPage: url(origen, nota.href),
    headline: titular(nota.titulo),
    description: nota.bajada,
    image: imagenes(origen, nota.foto),
    datePublished: nota.fecha,
    dateModified: nota.actualizada ?? nota.fecha,
    articleSection: nota.seccion?.nombre,
    inLanguage: 'es-UY',
    author: firmaDeLaRadio
      ? { '@type': 'Organization', name: nota.firma, url: url(origen, '/') }
      : { '@type': 'Person', name: nota.firma },
    publisher: { '@id': idRadio(origen) },
    isPartOf: { '@id': idSitio(origen) },
    // Lo que un asistente de voz puede leer en voz alta: el título y la bajada
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article h1', 'article header > p'],
    },
  })
}

/** "$ 300" → 300 en pesos; "U$S 5" → 5 en dólares. Si no hay un número, solo va el texto. */
function oferta(concepto: string, precio: string): Nodo {
  const numero = precio.replace(/\.(?=\d{3}\b)/g, '').match(/\d+(?:,\d+)?/)?.[0]
  if (!numero) return { '@type': 'Offer', name: concepto, description: precio }
  return {
    '@type': 'Offer',
    name: concepto,
    price: numero.replace(',', '.'),
    priceCurrency: /u\$s|us\$|usd|d[óo]lar/i.test(precio) ? 'USD' : 'UYU',
  }
}

/** El cine, con la lista de precios que carga la radio: cada función lo nombra como su lugar. */
export function cine(
  origen: string,
  c: DatosCinevision['comoLlegar'],
  precios: DatosCinevision['precios'] = [],
): Nodo {
  return limpio({
    '@type': 'MovieTheater',
    '@id': idCine(origen),
    name: 'Cinevisión',
    url: url(origen, '/cinevision'),
    telephone: c.telefono,
    address: direccion(c.direccion),
    hasMap: c.mapaLink,
    parentOrganization: { '@id': idRadio(origen) },
    makesOffer: precios.map((p) => oferta(p.concepto, p.precio)),
  })
}

/** La película y una ScreeningEvent por función de la semana, en Cinevisión. */
export function pelicula(
  origen: string,
  // En la cartelera llega sin la ficha técnica
  p: Pick<
    PeliculaCompleta,
    'titulo' | 'slug' | 'afiche' | 'sinopsis' | 'genero' | 'duracion' | 'calificacion'
  > &
    Partial<Pick<PeliculaCompleta, 'tituloOriginal' | 'anio' | 'creditos'>>,
  funciones: { fechaHora: string; idioma: string; formato: string }[],
): Nodo[] {
  const ruta = `/cinevision/${p.slug}`
  const idPelicula = url(origen, `${ruta}#pelicula`)
  const obra = limpio({
    '@type': 'Movie',
    '@id': idPelicula,
    name: p.titulo,
    alternateName: p.tituloOriginal && p.tituloOriginal !== p.titulo ? p.tituloOriginal : undefined,
    url: url(origen, ruta),
    image: p.afiche ? url(origen, p.afiche.url) : undefined,
    description: p.sinopsis,
    genre: p.genero,
    duration: p.duracion ? `PT${p.duracion}M` : undefined,
    contentRating: calificacion(p.calificacion),
    dateCreated: p.anio ? String(p.anio) : undefined,
    director: personas(p.creditos?.direccion ?? ''),
    actor: personas(p.creditos?.reparto ?? ''),
    countryOfOrigin: p.creditos?.pais ? { '@type': 'Country', name: p.creditos.pais } : undefined,
  })
  const eventos = funciones.map((f) =>
    limpio({
      '@type': 'ScreeningEvent',
      name: `${p.titulo} (${nombreIdioma(f.idioma)}, ${nombreFormato(f.formato)})`,
      startDate: f.fechaHora,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@id': idCine(origen) },
      workPresented: { '@id': idPelicula },
      videoFormat: nombreFormato(f.formato),
      subtitleLanguage: f.idioma === 'subtitulada' ? 'es' : undefined,
      inLanguage: f.idioma === 'doblada' ? 'es' : undefined,
      url: url(origen, ruta),
    }),
  )
  return [obra, ...eventos]
}

/** El JSON-LD listo para un <script>: un grafo con todos los nodos de la página. */
export function jsonLd(nodos: Nodo[]) {
  return (
    JSON.stringify({ '@context': 'https://schema.org', '@graph': nodos })
      // Un "</script>" dentro de un título no puede cerrar la etiqueta
      .replace(/</g, '\\u003c')
  )
}
