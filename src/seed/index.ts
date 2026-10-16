import type { CollectionSlug, Payload, Where } from 'payload'

import { slugify } from '@/base/lib/slug'
import type { Noticia } from '@/payload-types'
import { diaEnMontevideo, mediodiaUTC, sumarDias } from '@/sitio/publicidad/fechas'
import {
  AJUSTES,
  ANUNCIANTES,
  EQUIPO,
  HITOS,
  HORARIOS_FUNCIONES,
  NOTICIAS,
  PELICULAS,
  PROGRAMAS,
  SECCIONES,
} from './datos'
import { imagenDeEjemplo, silencioMp3 } from './imagenes'

const COLORES = ['#0f766e', '#7c3aed', '#be123c', '#0369a1', '#4d7c0f', '#b45309']

/** Lexical: un párrafo por texto. */
const LEGALES_EJEMPLO = [
  { titulo: 'Aviso legal', slug: 'aviso-legal' },
  { titulo: 'Política de privacidad', slug: 'privacidad' },
  { titulo: 'Política de cookies', slug: 'cookies' },
  { titulo: 'Condiciones de uso', slug: 'condiciones-de-uso' },
]

export function parrafos(textos: string[]): Noticia['cuerpo'] {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: textos.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  }
}

/** Hora de Montevideo (UTC-3) de un día, en ISO. */
const enMontevideo = (dia: string, hora: string) =>
  new Date(`${dia}T${hora}:00.000-03:00`).toISOString()

/**
 * Carga datos de ejemplo. Es idempotente: lo que ya existe (por nombre, título o slug) no se toca,
 * así que correrlo dos veces no duplica nada ni pisa lo que se haya editado a mano.
 * No crea usuarios: la primera cuenta del panel es la del Owner y la crea el cliente.
 */
export async function sembrar(payload: Payload, hoy = new Date()) {
  const cuenta = { creados: 0, existentes: 0 }
  const dia = diaEnMontevideo(hoy)

  async function buscarOCrear<T>(
    collection: CollectionSlug,
    where: Where,
    crear: () => Promise<T>,
  ): Promise<T> {
    const { docs } = await payload.find({ collection, where, limit: 1, depth: 0, draft: true })
    if (docs[0]) {
      cuenta.existentes++
      return docs[0] as T
    }
    cuenta.creados++
    return crear()
  }

  const imagen = (alt: string, ancho: number, alto: number, titulo: string, color: string) =>
    buscarOCrear<{ id: number }>('medios', { alt: { equals: alt } }, async () => {
      const data = await imagenDeEjemplo(ancho, alto, titulo, color)
      return payload.create({
        collection: 'medios',
        data: { alt, credito: 'Imagen de ejemplo' },
        file: { data, mimetype: 'image/jpeg', name: `${slugify(alt)}.jpg`, size: data.length },
      })
    })

  // Secciones
  const secciones = new Map<string, number>()
  for (const [i, s] of SECCIONES.entries()) {
    const doc = await buscarOCrear<{ id: number }>(
      'secciones',
      { slug: { equals: slugify(s.nombre) } },
      () => payload.create({ collection: 'secciones', data: { ...s, slug: '', orden: i + 1 } }),
    )
    secciones.set(s.nombre, doc.id)
  }

  // Equipo y programas
  const equipo = new Map<string, number>()
  for (const [i, p] of EQUIPO.entries()) {
    const doc = await buscarOCrear<{ id: number }>(
      'equipo',
      { nombre: { equals: p.nombre } },
      async () =>
        payload.create({
          collection: 'equipo',
          data: {
            ...p,
            foto: (
              await imagen(`Foto de ${p.nombre}`, 600, 600, p.nombre, COLORES[i % COLORES.length])
            ).id,
          },
        }),
    )
    equipo.set(p.nombre, doc.id)
  }

  const programas = new Map<string, number>()
  for (const [i, p] of PROGRAMAS.entries()) {
    // Si ya hay programas cargados a mano en ese horario, la grilla no admite el de ejemplo
    const doc = await buscarOCrear<{ id: number }>(
      'programas',
      { nombre: { equals: p.nombre } },
      async () =>
        payload.create({
          collection: 'programas',
          data: {
            nombre: p.nombre,
            slug: '',
            descripcion: p.descripcion,
            conductores: p.conductores.map((n) => equipo.get(n)!).filter(Boolean),
            horarios: p.horarios,
            foto: (
              await imagen(`Programa ${p.nombre}`, 1280, 720, p.nombre, COLORES[i % COLORES.length])
            ).id,
          },
        }),
    ).catch((err: Error) => {
      cuenta.creados--
      payload.logger.warn(`Programa de ejemplo "${p.nombre}" salteado: ${err.message}`)
      return null
    })
    if (doc) programas.set(p.nombre, doc.id)
  }

  // Un partido el próximo sábado reemplaza la grilla de 15 a 17
  const diaSemana = new Date(`${dia}T12:00:00Z`).getUTCDay()
  const sabado = sumarDias(dia, (6 - diaSemana + 7) % 7 || 7)
  await buscarOCrear('excepcionesGrilla', { fecha: { equals: mediodiaUTC(sabado) } }, () =>
    payload.create({
      collection: 'excepcionesGrilla',
      data: {
        fecha: mediodiaUTC(sabado),
        inicio: '15:00',
        fin: '17:00',
        titulo: 'Fútbol: Laureles vs. Anglo',
        conduccion: 'Diego Olivera',
      },
    }),
  )

  // Noticias publicadas
  const notas: { id: number }[] = []
  for (const [i, n] of NOTICIAS.entries()) {
    const seccion = secciones.get(n.seccion)!
    const doc = await buscarOCrear<{ id: number }>(
      'noticias',
      { and: [{ slug: { equals: slugify(n.titulo) } }, { seccion: { equals: seccion } }] },
      async () =>
        payload.create({
          collection: 'noticias',
          data: {
            titulo: n.titulo,
            slug: '',
            bajada: n.bajada,
            cuerpo: parrafos(n.parrafos),
            seccion,
            foto: (await imagen(n.titulo, 1600, 900, n.seccion, COLORES[i % COLORES.length])).id,
            epigrafe: 'Imagen de ejemplo.',
            destacada: n.destacada ?? false,
            estadoEditorial: 'publicada',
            fechaPublicacion: enMontevideo(sumarDias(dia, -n.diasAtras), '08:30'),
            _status: 'published',
          },
        }),
    )
    notas.push(doc)
  }

  // Una nota en revisión, para ver el flujo editorial en el panel
  await buscarOCrear('noticias', { slug: { equals: 'nota-en-revision-de-ejemplo' } }, async () =>
    payload.create({
      collection: 'noticias',
      draft: true,
      data: {
        titulo: 'Nota en revisión de ejemplo',
        slug: 'nota-en-revision-de-ejemplo',
        bajada:
          'Esta nota está esperando que un editor la apruebe o la devuelva; sirve para probar el flujo editorial.',
        cuerpo: parrafos(['Texto de la nota en revisión.']),
        seccion: secciones.get('Locales')!,
        foto: (await imagen('Nota en revisión', 1600, 900, 'En revisión', '#475569')).id,
        estadoEditorial: 'en-revision',
        _status: 'draft',
      },
    }),
  )

  // Entrevistas, con un audio de silencio
  const audio = await buscarOCrear<{ id: number }>(
    'archivos',
    { filename: { equals: 'entrevista-de-ejemplo.mp3' } },
    () => {
      const data = silencioMp3()
      return payload.create({
        collection: 'archivos',
        data: {},
        file: {
          data,
          mimetype: 'audio/mpeg',
          name: 'entrevista-de-ejemplo.mp3',
          size: data.length,
        },
      })
    },
  )
  const entrevistas = [
    {
      entrevistado: 'Directora del Centro Cultural',
      tema: 'Los talleres de verano',
      programa: 'La Mañana de Visión',
      diasAtras: 1,
    },
    {
      entrevistado: 'Técnico de Laureles',
      tema: 'La previa del clásico',
      programa: 'Tarde Deportiva',
      diasAtras: 2,
    },
    {
      entrevistado: 'Organizadores de la Feria del Libro',
      tema: 'Qué trae la edición de este año',
      programa: 'Agenda Cultural',
      diasAtras: 5,
    },
  ]
  for (const e of entrevistas) {
    if (!programas.has(e.programa)) continue
    await buscarOCrear('entrevistas', { tema: { equals: e.tema } }, () =>
      payload.create({
        collection: 'entrevistas',
        data: {
          entrevistado: e.entrevistado,
          tema: e.tema,
          slug: '',
          programa: programas.get(e.programa)!,
          fecha: mediodiaUTC(sumarDias(dia, -e.diasAtras)),
          audio: audio.id,
          resumen: `${e.entrevistado} habló sobre ${e.tema.toLowerCase()}.`,
          _status: 'published',
        },
      }),
    )
  }

  // Películas y funciones de esta semana
  const peliculas: { id: number }[] = []
  for (const [i, p] of PELICULAS.entries()) {
    const doc = await buscarOCrear<{ id: number }>(
      'peliculas',
      { slug: { equals: slugify(p.titulo) } },
      async () =>
        payload.create({
          collection: 'peliculas',
          data: {
            titulo: p.titulo,
            slug: '',
            genero: p.genero,
            duracion: p.duracion,
            calificacion: p.calificacion,
            idiomas: p.idiomas,
            formatos: p.formatos,
            sinopsis: p.sinopsis,
            anio: p.anio,
            creditos: { direccion: p.direccion, pais: p.pais },
            afiche: (
              await imagen(
                `Afiche de ${p.titulo}`,
                600,
                900,
                p.titulo,
                COLORES[(i + 2) % COLORES.length],
              )
            ).id,
            esEstreno: p.estreno > -7,
            fechaEstreno: mediodiaUTC(sumarDias(dia, p.estreno)),
            _status: 'published',
          },
        }),
    )
    if (p.estreno <= 0) {
      for (let d = 0; d < 7; d++) {
        const hora = HORARIOS_FUNCIONES[(i + d) % HORARIOS_FUNCIONES.length]
        const fechaHora = enMontevideo(sumarDias(dia, d), hora)
        await buscarOCrear(
          'funciones',
          { and: [{ pelicula: { equals: doc.id } }, { fechaHora: { equals: fechaHora } }] },
          () =>
            payload.create({
              collection: 'funciones',
              data: {
                pelicula: doc.id,
                fechaHora,
                idioma: p.idiomas[d % p.idiomas.length],
                formato: p.formatos[d % p.formatos.length],
              },
            }),
        )
      }
    }
    peliculas.push(doc)
  }

  // Anuncios: uno vence en 7 días (dispara el aviso) y hay métricas del mes pasado (reporte)
  for (const [i, a] of ANUNCIANTES.entries()) {
    const anuncio = await buscarOCrear<{ id: number }>(
      'anuncios',
      { nombre: { equals: `${a.anunciante} · banner` } },
      async () =>
        payload.create({
          collection: 'anuncios',
          data: {
            nombre: `${a.anunciante} · banner`,
            anunciante: a.anunciante,
            emailReporte: `${slugify(a.anunciante)}@example.com`,
            imagenWeb: (await imagen(`${a.anunciante} 970×90`, 970, 90, a.anunciante, a.color)).id,
            imagenMovil: (await imagen(`${a.anunciante} 320×100`, 320, 100, a.anunciante, a.color))
              .id,
            imagenRectangulo: (
              await imagen(`${a.anunciante} 300×250`, 300, 250, a.anunciante, a.color)
            ).id,
            ubicaciones: i === 0 ? ['inicio', 'noticias-nota'] : ['inicio', 'radio-en-vivo', 'cinevision'],
            desde: mediodiaUTC(sumarDias(dia, -60)),
            hasta: mediodiaUTC(sumarDias(dia, i === 0 ? 7 : 90)),
            peso: i === 0 ? 2 : 1,
          },
        }),
    )
    for (let d = 1; d <= 30; d++) {
      const fecha = mediodiaUTC(sumarDias(dia, -d))
      const impresiones = 400 + ((d * 37 + i * 91) % 300)
      await buscarOCrear(
        'anunciosMetricas',
        {
          and: [
            { anuncio: { equals: anuncio.id } },
            { fecha: { equals: fecha } },
            { ubicacion: { equals: 'inicio' } },
          ],
        },
        () =>
          payload.create({
            collection: 'anunciosMetricas',
            data: {
              anuncio: anuncio.id,
              ubicacion: 'inicio',
              fecha,
              impresiones,
              clics: Math.round(impresiones / 120),
            },
          }),
      )
    }
  }

  // Mensajes de los formularios
  for (const m of [
    {
      tipo: 'contacto',
      nombre: 'Ana Rodríguez',
      email: 'ana@example.com',
      mensaje: '¿Pueden pasar el horario del ómnibus a Mercedes?',
    },
    {
      tipo: 'tarifas',
      nombre: 'Comercio de ejemplo',
      email: 'ventas@example.com',
      mensaje: 'Quisiera saber las tarifas para un banner en la web.',
    },
  ] as const) {
    await buscarOCrear('mensajes', { email: { equals: m.email } }, () =>
      payload.create({
        collection: 'mensajes',
        data: {
          ...m,
          estado: 'nuevo',
          consentimiento: { aceptado: true, fecha: hoy.toISOString() },
        },
      }),
    )
  }

  // Textos legales de ejemplo: los reales los aporta la radio (docs/06-revision.md)
  for (const legal of LEGALES_EJEMPLO) {
    await buscarOCrear('paginas', { slug: { equals: legal.slug } }, () =>
      payload.create({
        collection: 'paginas',
        data: {
          ...legal,
          cuerpo: parrafos([
            'Texto de ejemplo. La radio carga el texto definitivo en Institucional › Páginas.',
            'Para consultas sobre este tema, escribinos desde la página de contacto.',
          ]),
          _status: 'published',
        },
      }),
    )
  }

  // Globales: solo si están vacíos
  const ajustes = await payload.findGlobal({ slug: 'ajustes', depth: 0 })
  if (!ajustes.streamUrl) {
    await payload.updateGlobal({ slug: 'ajustes', data: AJUSTES as never })
    cuenta.creados++
  }
  const institucional = await payload.findGlobal({ slug: 'institucional', depth: 0 })
  if (!institucional.hitos?.length) {
    await payload.updateGlobal({
      slug: 'institucional',
      data: {
        quienesSomos: parrafos(['Texto de ejemplo: acá va la historia de la radio.']),
        hitos: HITOS,
      },
    })
    cuenta.creados++
  }
  const cinevision = await payload.findGlobal({ slug: 'cinevision', depth: 0 })
  if (!cinevision.precios?.length) {
    await payload.updateGlobal({
      slug: 'cinevision',
      data: {
        carrusel: [
          {
            imagenWeb: (
              await imagen('Carrusel Cinevisión 1440×640', 1440, 640, 'Cinevisión', '#7c3aed')
            ).id,
            imagenMovil: (
              await imagen('Carrusel Cinevisión 390×240', 390, 240, 'Cinevisión', '#7c3aed')
            ).id,
            alt: 'Cinevisión, el cine de Fray Bentos',
            orden: 1,
          },
        ],
        precios: [
          { concepto: 'Entrada general', precio: '$ 300' },
          { concepto: '2D los miércoles', precio: '$ 200' },
          { concepto: 'Suplemento 3D', precio: '$ 80' },
        ],
        promociones: [
          { titulo: 'Miércoles a mitad de precio', detalle: 'En todas las funciones 2D.' },
        ],
        comoSeCompran: 'En la boletería de la sala, desde una hora antes de cada función.',
        comoLlegar: { direccion: '18 de Julio 1000, Fray Bentos', telefono: '4562 0000' },
      },
    })
    cuenta.creados++
  }
  const portada = await payload.findGlobal({ slug: 'portada', depth: 0 })
  if (!portada.notaDestacada) {
    await payload.updateGlobal({
      slug: 'portada',
      data: { notaDestacada: notas[0]?.id, peliculaDestacada: peliculas[0]?.id },
    })
    cuenta.creados++
  }

  return cuenta
}
