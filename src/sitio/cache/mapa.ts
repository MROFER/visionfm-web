import type { MapaDeCache } from '@/base/cache'

/**
 * Qué etiquetas y URL refresca cada cambio (docs/02-trd.md, sección 5, y el mapa del sitio en docs/03-flujos.md).
 * Inicio muestra noticias, entrevistas, grilla, cartelera y anuncios, así que casi todo lo refresca.
 */
export const mapaDeCache: MapaDeCache = {
  colecciones: {
    noticias: async (doc, buscarSlug) => {
      const seccion = await buscarSlug('secciones', doc.seccion)
      const rutas = ['/', '/noticias', '/rss.xml']
      if (seccion) rutas.push(`/noticias/${seccion}`, `/noticias/${seccion}/${doc.slug}`)
      const etiquetas = ['noticias', `nota:${doc.id}`]
      if (seccion) etiquetas.push(`seccion:${seccion}`)
      return { etiquetas, rutas }
    },
    secciones: (doc) => ({
      etiquetas: ['noticias', `seccion:${doc.slug}`],
      rutas: ['/', '/noticias', `/noticias/${doc.slug}`],
    }),
    entrevistas: () => ({ etiquetas: ['entrevistas'], rutas: ['/', '/radio/entrevistas'] }),
    programas: () => ({
      etiquetas: ['grilla', 'programas'],
      rutas: ['/', '/radio/en-vivo', '/radio/programacion', '/api/grilla'],
    }),
    excepcionesGrilla: () => ({
      etiquetas: ['grilla'],
      rutas: ['/', '/radio/en-vivo', '/radio/programacion', '/api/grilla'],
    }),
    equipo: () => ({
      etiquetas: ['programas', 'institucional'],
      rutas: ['/radio/programacion', '/institucional'],
    }),
    peliculas: (doc) => ({
      etiquetas: ['cartelera', `pelicula:${doc.id}`],
      rutas: ['/', '/cinevision', `/cinevision/${doc.slug}`],
    }),
    funciones: async (doc, buscarSlug) => {
      const pelicula = await buscarSlug('peliculas', doc.pelicula)
      const idPelicula =
        doc.pelicula && typeof doc.pelicula === 'object'
          ? (doc.pelicula as { id: unknown }).id
          : doc.pelicula
      return {
        etiquetas: ['cartelera', `pelicula:${idPelicula}`],
        rutas: ['/', '/cinevision', ...(pelicula ? [`/cinevision/${pelicula}`] : [])],
      }
    },
    anuncios: () => ({ etiquetas: ['anuncios'], rutas: ['/api/anuncios'] }),
    paginas: (doc) => ({ etiquetas: [`pagina:${doc.slug}`], rutas: [`/legal/${doc.slug}`] }),
    redirecciones: (doc) => ({
      etiquetas: ['redirecciones'],
      rutas: doc.desde ? [String(doc.desde)] : [],
    }),
  },
  fichas: {
    // Teléfono, stream y redes salen en el encabezado y el pie de todas las páginas
    ajustes: { etiquetas: ['ajustes'], rutas: [], todo: true },
    portada: { etiquetas: ['portada'], rutas: ['/', '/noticias'] },
    cinevision: { etiquetas: ['cinevision'], rutas: ['/cinevision'] },
    institucional: {
      etiquetas: ['institucional'],
      rutas: [
        '/institucional',
        '/institucional/sumarse',
        '/institucional/publicidad',
        '/institucional/contacto',
      ],
    },
  },
}
