// Menú principal y pie (design/LEEME.md, sección 5) con las rutas del sitio (docs/02-trd.md y la página
// de arquitectura). Los links que el diseño dejaba apuntando a anclas del Inicio van a las páginas reales.

export type Enlace = { etiqueta: string; href: string }
export type GrupoMenu = { clave: 'radio' | 'noticias' | 'cinevision' | 'institucional'; etiqueta: string; enlaces: Enlace[] }

export type SeccionMenu = { nombre: string; slug: string }

export function menuPrincipal(secciones: SeccionMenu[]): GrupoMenu[] {
  return [
    {
      clave: 'radio',
      etiqueta: 'Radio',
      enlaces: [
        { etiqueta: 'En vivo', href: '/radio/en-vivo' },
        { etiqueta: 'Programación', href: '/radio/programacion' },
        { etiqueta: 'Entrevistas', href: '/radio/entrevistas' },
        { etiqueta: 'Conductores', href: '/radio/programacion#conductores' },
      ],
    },
    {
      clave: 'noticias',
      etiqueta: 'Noticias',
      enlaces: [
        { etiqueta: 'Últimas noticias', href: '/noticias' },
        ...secciones.map((s) => ({ etiqueta: s.nombre, href: `/noticias/${s.slug}` })),
      ],
    },
    {
      clave: 'cinevision',
      etiqueta: 'Cinevisión',
      enlaces: [
        { etiqueta: 'Cartelera', href: '/cinevision#cartelera' },
        { etiqueta: 'Estrenos', href: '/cinevision#estrenos' },
        { etiqueta: 'Entradas y precios', href: '/cinevision#entradas' },
        { etiqueta: 'Cómo llegar', href: '/cinevision#como-llegar' },
      ],
    },
    {
      clave: 'institucional',
      etiqueta: 'Institucional',
      enlaces: [
        { etiqueta: 'Quiénes somos', href: '/institucional#nosotros' },
        { etiqueta: 'Equipo', href: '/institucional#equipo' },
        { etiqueta: 'Ser parte', href: '/institucional/sumarse' },
        { etiqueta: 'Publicidad', href: '/institucional/publicidad' },
        { etiqueta: 'Contacto', href: '/institucional/contacto' },
      ],
    },
  ]
}

/** El grupo del menú que va subrayado: sale del primer tramo de la URL. */
export function grupoActual(ruta: string): GrupoMenu['clave'] | null {
  const tramo = ruta.split('/')[1]
  if (tramo === 'radio' || tramo === 'noticias' || tramo === 'cinevision' || tramo === 'institucional')
    return tramo
  return null
}

export const LEGALES: Enlace[] = [
  { etiqueta: 'Aviso legal', href: '/legal/aviso-legal' },
  { etiqueta: 'Privacidad', href: '/legal/privacidad' },
  { etiqueta: 'Cookies', href: '/legal/cookies' },
  { etiqueta: 'Condiciones de uso', href: '/legal/condiciones-de-uso' },
]

export const LABS_FRAY_BENTOS = 'https://fraybentos.uy'

/** "099 318 578" → "099318578", para links tel: */
export const telefonoParaLink = (telefono: string) => telefono.replace(/[^\d+]/g, '')

/** "099 318 578" → "https://wa.me/59899318578": wa.me pide el número internacional sin el 0 inicial. */
export function linkWhatsapp(numero: string) {
  let digitos = numero.replace(/\D/g, '')
  if (!digitos.startsWith('598')) digitos = `598${digitos.replace(/^0/, '')}`
  return `https://wa.me/${digitos}`
}
