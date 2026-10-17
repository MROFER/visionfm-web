// Las páginas fijas del sitio (docs/03-flujos.md, mapa del sitio). Las de cada nota, sección, película y
// página legal salen de la base; Entrevistas va en su propio sitemap.
export const PAGINAS_FIJAS = [
  '/',
  '/noticias',
  '/radio/en-vivo',
  '/radio/programacion',
  '/cinevision',
  '/institucional',
  '/institucional/sumarse',
  '/institucional/publicidad',
  '/institucional/contacto',
] as const

/** Los sitemaps que lista /sitemap.xml, en /sitemaps/{nombre}.xml. */
export const SITEMAPS = ['general', 'noticias', 'google-news', 'entrevistas', 'peliculas'] as const
export type NombreDeSitemap = (typeof SITEMAPS)[number]
