import { absoluta, NOMBRE_DEL_SITIO } from './xml'

// /llms.txt (llmstxt.org): un resumen en Markdown del sitio para asistentes de IA, con links a lo principal.

export type DatosLlms = {
  telefono: string
  direccion: string
  email: string
  redes: { red: string; url: string }[]
  secciones: { nombre: string; slug: string }[]
  notas: { ruta: string; titulo: string; fecha: string }[]
  peliculas: { titulo: string; slug: string }[]
  programas: { nombre: string }[]
}

const REDES: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
}

const link = (origen: string, texto: string, ruta: string, detalle?: string) =>
  `- [${texto.replace(/[[\]]/g, '')}](${absoluta(origen, ruta)})${detalle ? `: ${detalle}` : ''}`

export function llmsTxt(origen: string, d: DatosLlms) {
  const contacto = [
    d.direccion && `Dirección: ${d.direccion}.`,
    d.telefono && `Teléfono: ${d.telefono}.`,
    d.email && `Email: ${d.email}.`,
  ].filter(Boolean)
  const lineas = [
    `# ${NOMBRE_DEL_SITIO}`,
    '',
    '> Radio FM de Fray Bentos, Río Negro, Uruguay. El sitio tiene la radio en vivo, la programación, entrevistas para escuchar de nuevo, noticias locales y nacionales, y la cartelera de Cinevisión, el cine de la ciudad.',
    '',
    ...(contacto.length ? [contacto.join(' '), ''] : []),
    '## Radio',
    '',
    link(origen, 'En vivo', '/radio/en-vivo', 'la transmisión de la 96.5 FM'),
    link(
      origen,
      'Programación',
      '/radio/programacion',
      d.programas.length
        ? `grilla semanal (${d.programas.map((p) => p.nombre).join(', ')})`
        : 'grilla semanal',
    ),
    link(origen, 'Entrevistas', '/radio/entrevistas', 'archivo de entrevistas para escuchar'),
    '',
    '## Noticias',
    '',
    link(origen, 'Últimas noticias', '/noticias'),
    ...d.secciones.map((s) => link(origen, s.nombre, `/noticias/${s.slug}`)),
    link(origen, 'RSS', '/rss.xml', 'las últimas notas'),
    '',
  ]
  if (d.notas.length) {
    lineas.push('### Notas recientes', '')
    for (const n of d.notas) lineas.push(link(origen, n.titulo, n.ruta, n.fecha.slice(0, 10)))
    lineas.push('')
  }
  lineas.push(
    '## Cinevisión',
    '',
    link(
      origen,
      'Cartelera',
      '/cinevision',
      'funciones de la semana, estrenos, entradas y cómo llegar',
    ),
  )
  for (const p of d.peliculas) lineas.push(link(origen, p.titulo, `/cinevision/${p.slug}`))
  lineas.push(
    '',
    '## Institucional',
    '',
    link(origen, 'Quiénes somos', '/institucional'),
    link(origen, 'Publicidad', '/institucional/publicidad', 'tarifas y kit comercial'),
    link(origen, 'Sumarse', '/institucional/sumarse'),
    link(origen, 'Contacto', '/institucional/contacto'),
    '',
    '## Optional',
    '',
    link(origen, 'Sitemap', '/sitemap.xml'),
    ...d.redes.map((r) => `- [${REDES[r.red] ?? r.red}](${r.url})`),
    '',
  )
  return lineas.join('\n')
}
