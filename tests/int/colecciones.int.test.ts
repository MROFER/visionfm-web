import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Medio, Noticia, Seccione, Usuario } from '@/payload-types'

// Reglas de acceso de las colecciones de contenido, con la API local y overrideAccess: false
// (las mismas reglas que un pedido a /cms-api).
let payload: Payload
let owner: Usuario
let editor: Usuario
let periodista: Usuario
let otroPeriodista: Usuario
let colaborador: Usuario
let comercial: Usuario
let deportes: Seccione
let cultura: Seccione
let foto: Medio

const clave = 'Clave-de-prueba-123'
const bajada =
  'Una bajada de prueba con el largo suficiente para pasar la validación de ochenta caracteres.'
const cuerpo: Noticia['cuerpo'] = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: [
          {
            type: 'text',
            text: 'Texto de prueba.',
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
            version: 1,
          },
        ],
      },
    ],
  },
}

/** Falla por permisos (403, o 404 si el documento queda fuera de lo que puede ver), no por validación. */
const sinPermiso = (promesa: Promise<unknown>) =>
  expect(promesa).rejects.toSatisfy(
    (e: { status?: number }) => e.status === 403 || e.status === 404,
  )

/** Falla por validación, con el mensaje en el campo. */
const invalido = (promesa: Promise<unknown>, mensaje: RegExp) =>
  expect(promesa).rejects.toSatisfy(
    (e: { status?: number; data?: { errors?: { message: string }[] } }) =>
      e.status === 400 && (e.data?.errors ?? []).some((x) => mensaje.test(x.message)),
  )

const vaciar = (
  collection:
    | 'noticias'
    | 'programas'
    | 'peliculas'
    | 'funciones'
    | 'mensajes'
    | 'secciones'
    | 'usuarios'
    | 'medios'
    | 'equipo',
) => payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })

async function usuario(email: string, rol: Usuario['rol'], extra: Partial<Usuario> = {}) {
  return payload.create({
    collection: 'usuarios',
    data: { nombre: email, email, password: clave, rol, ...extra } as Usuario & {
      password: string
    },
    user: owner,
    overrideAccess: false,
  })
}

const nota = (titulo: string, seccion: Seccione, extra: Record<string, unknown> = {}) => ({
  titulo,
  slug: '',
  bajada,
  cuerpo,
  foto: foto.id,
  seccion: seccion.id,
  estadoEditorial: 'borrador' as const,
  ...extra,
})

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const c of [
    'funciones',
    'peliculas',
    'noticias',
    'programas',
    'mensajes',
    'equipo',
    'medios',
    'usuarios',
    'secciones',
  ] as const) {
    await vaciar(c)
  }
  owner = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Dueño', email: 'owner@prueba.uy', password: clave, rol: 'periodista' },
  })
  deportes = await payload.create({
    collection: 'secciones',
    data: { nombre: 'Deportes', slug: '', orden: 1 },
  })
  cultura = await payload.create({
    collection: 'secciones',
    data: { nombre: 'Cultura', slug: '', orden: 2 },
  })
  editor = await usuario('editor@prueba.uy', 'editor')
  periodista = await usuario('periodista@prueba.uy', 'periodista')
  otroPeriodista = await usuario('otro@prueba.uy', 'periodista')
  colaborador = await usuario('columnista@prueba.uy', 'colaborador', {
    seccionesPermitidas: [cultura.id],
  })
  comercial = await usuario('comercial@prueba.uy', 'comercial')

  const png = await sharp({ create: { width: 970, height: 90, channels: 3, background: '#0b6' } })
    .png()
    .toBuffer()
  foto = await payload.create({
    collection: 'medios',
    data: { alt: 'Prueba' },
    file: { data: png, mimetype: 'image/png', name: 'prueba.png', size: png.length },
  })
})

afterAll(async () => {
  await vaciar('noticias')
})

describe('noticias', () => {
  it('el periodista crea una nota y queda como autor', async () => {
    const creada = await payload.create({
      collection: 'noticias',
      data: nota('Obras en Cerro Norte', deportes),
      user: periodista,
      overrideAccess: false,
      draft: true,
    })
    const autor = typeof creada.autor === 'object' ? creada.autor?.id : creada.autor
    expect(autor).toBe(periodista.id)
    expect(creada.slug).toBe('obras-en-cerro-norte')
  })

  it('el periodista no puede publicar', async () => {
    await sinPermiso(
      payload.create({
        collection: 'noticias',
        data: { ...nota('Intento de publicar', deportes), _status: 'published' },
        user: periodista,
        overrideAccess: false,
      }),
    )
  })

  it('el periodista no edita notas de otros, el editor sí', async () => {
    const ajena = await payload.create({
      collection: 'noticias',
      data: nota('Nota de otro periodista', deportes),
      user: otroPeriodista,
      overrideAccess: false,
      draft: true,
    })
    await sinPermiso(
      payload.update({
        collection: 'noticias',
        id: ajena.id,
        data: { titulo: 'Cambiada' },
        user: periodista,
        overrideAccess: false,
        draft: true,
      }),
    )
    const editada = await payload.update({
      collection: 'noticias',
      id: ajena.id,
      data: { titulo: 'Corregida por el editor' },
      user: editor,
      overrideAccess: false,
      draft: true,
    })
    expect(editada.titulo).toBe('Corregida por el editor')
  })

  it('el colaborador solo carga en sus secciones', async () => {
    await sinPermiso(
      payload.create({
        collection: 'noticias',
        data: nota('Fuera de su sección', deportes),
        user: colaborador,
        overrideAccess: false,
        draft: true,
      }),
    )
    const enCultura = await payload.create({
      collection: 'noticias',
      data: nota('Columna de cultura', cultura),
      user: colaborador,
      overrideAccess: false,
      draft: true,
    })
    expect(enCultura.id).toBeDefined()
  })

  it('el público ve solo las publicadas', async () => {
    await payload.create({
      collection: 'noticias',
      data: {
        ...nota('Nota publicada', deportes, { estadoEditorial: 'publicada' }),
        _status: 'published',
      },
      user: editor,
      overrideAccess: false,
    })
    const { docs } = await payload.find({
      collection: 'noticias',
      overrideAccess: false,
      limit: 100,
    })
    expect(docs.map((d) => d.titulo)).toEqual(['Nota publicada'])
  })

  it('no permite el mismo slug dos veces en la misma sección', async () => {
    await expect(
      payload.create({
        collection: 'noticias',
        data: nota('Nota publicada', deportes),
        user: editor,
        overrideAccess: false,
        draft: true,
      }),
    ).rejects.toSatisfy((e: { status?: number }) => e.status === 400)
  })
})

describe('programas', () => {
  it('rechaza un programa que se superpone con otro activo', async () => {
    await payload.create({
      collection: 'programas',
      data: {
        nombre: 'La mañana',
        slug: '',
        horarios: [{ dias: ['lun', 'mar'], inicio: '06:00', fin: '09:00' }],
      },
      user: editor,
      overrideAccess: false,
    })
    await invalido(
      payload.create({
        collection: 'programas',
        data: {
          nombre: 'Choca',
          slug: '',
          horarios: [{ dias: ['mar'], inicio: '08:00', fin: '10:00' }],
        },
        user: editor,
        overrideAccess: false,
      }),
      /Se superpone con: La mañana/,
    )
    const siguiente = await payload.create({
      collection: 'programas',
      data: {
        nombre: 'Media mañana',
        slug: '',
        horarios: [{ dias: ['mar'], inicio: '09:00', fin: '12:00' }],
      },
      user: editor,
      overrideAccess: false,
    })
    expect(siguiente.id).toBeDefined()
  })

  it('un periodista no edita la grilla', async () => {
    const { docs } = await payload.find({ collection: 'programas', limit: 1 })
    await sinPermiso(
      payload.update({
        collection: 'programas',
        id: docs[0].id,
        data: { nombre: 'X' },
        user: periodista,
        overrideAccess: false,
      }),
    )
  })
})

describe('funciones', () => {
  it('el idioma tiene que ser uno de los de la película', async () => {
    const pelicula = await payload.create({
      collection: 'peliculas',
      data: {
        titulo: 'Película de prueba',
        slug: '',
        genero: 'Drama',
        duracion: 100,
        calificacion: 'atp',
        idiomas: ['subtitulada'],
        formatos: ['2d'],
        sinopsis: 'Sinopsis.',
        afiche: foto.id,
        trailer: 'https://youtu.be/dQw4w9WgXcQ',
      },
    })
    expect(pelicula.trailer).toBe('dQw4w9WgXcQ')
    await invalido(
      payload.create({
        collection: 'funciones',
        data: {
          pelicula: pelicula.id,
          fechaHora: new Date().toISOString(),
          idioma: 'doblada',
          formato: '2d',
        },
      }),
      /no está cargada en ese idioma/,
    )
    const ok = await payload.create({
      collection: 'funciones',
      data: {
        pelicula: pelicula.id,
        fechaHora: new Date().toISOString(),
        idioma: 'subtitulada',
        formato: '2d',
      },
    })
    expect(ok.id).toBeDefined()
  })
})

describe('mensajes', () => {
  it('nadie los crea desde el panel o la API', async () => {
    await sinPermiso(
      payload.create({
        collection: 'mensajes',
        data: {
          tipo: 'contacto',
          nombre: 'X',
          email: 'x@x.uy',
          estado: 'nuevo',
          consentimiento: { aceptado: true, fecha: new Date().toISOString() },
        },
        user: owner,
        overrideAccess: false,
      }),
    )
  })

  it('comercial ve solo los de tarifas; el editor, contacto y sumarse', async () => {
    const consentimiento = { aceptado: true, fecha: new Date().toISOString() }
    for (const tipo of ['contacto', 'sumarse', 'tarifas'] as const) {
      await payload.create({
        collection: 'mensajes',
        data: { tipo, nombre: tipo, email: 'a@b.uy', estado: 'nuevo', consentimiento },
      })
    }
    const deComercial = await payload.find({
      collection: 'mensajes',
      user: comercial,
      overrideAccess: false,
    })
    expect(deComercial.docs.map((m) => m.tipo)).toEqual(['tarifas'])
    const deEditor = await payload.find({
      collection: 'mensajes',
      user: editor,
      overrideAccess: false,
      sort: 'tipo',
    })
    expect(deEditor.docs.map((m) => m.tipo)).toEqual(['contacto', 'sumarse'])
    const sinAcceso = await payload
      .find({ collection: 'mensajes', user: periodista, overrideAccess: false })
      .catch(() => null)
    expect(sinAcceso?.docs ?? []).toHaveLength(0)
  })
})
