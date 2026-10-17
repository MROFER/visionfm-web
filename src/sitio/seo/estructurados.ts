import type { DatosCinevision, PeliculaCompleta } from '../datos/cinevision'
import type { Imagen } from '../datos/formas'
import { nombreFormato, nombreIdioma } from '../lib/cine'
import { calificacion } from '../lib/formato'

// Datos estructurados de schema.org en JSON-LD (docs/01-prd.md y docs/06-revision.md): la radio, el sitio,
// cada nota, cada película con sus funciones, el cine y la ruta de cada página. Funciones puras.

type Nodo = Record<string, unknown>

const NOMBRE = 'Visión 96.5 FM'

const url = (origen: string, ruta: string) =>
  /^https?:\/\//.test(ruta) ? ruta : `${origen.replace(/\/$/, '')}${ruta}`

export const idRadio = (origen: string) => url(origen, '/#radio')
const idSitio = (origen: string) => url(origen, '/#sitio')
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

const imagenes = (origen: string, imagen: Imagen | null) =>
  imagen ? [url(origen, imagen.compartir ?? imagen.url)] : undefined

export function radioYSitio(
  origen: string,
  a: { telefono: string; email: string; direccion: string; redes: { url: string }[] },
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
  ]
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

export function cine(origen: string, c: DatosCinevision['comoLlegar']): Nodo {
  return limpio({
    '@type': 'MovieTheater',
    '@id': idCine(origen),
    name: 'Cinevisión',
    url: url(origen, '/cinevision'),
    telephone: c.telefono,
    address: direccion(c.direccion),
    hasMap: c.mapaLink,
    parentOrganization: { '@id': idRadio(origen) },
  })
}

const personas = (nombres: string) =>
  nombres
    .split(/,|\sy\s/)
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ '@type': 'Person', name }))

/** La película y una ScreeningEvent por función de la semana, en Cinevisión. */
export function pelicula(
  origen: string,
  p: PeliculaCompleta,
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
    director: personas(p.creditos.direccion),
    actor: personas(p.creditos.reparto),
    countryOfOrigin: p.creditos.pais ? { '@type': 'Country', name: p.creditos.pais } : undefined,
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
