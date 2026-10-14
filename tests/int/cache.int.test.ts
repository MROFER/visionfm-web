import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Noticia, Seccione, Usuario } from '@/payload-types'

// Revalidación y purga de Cloudflare al publicar (docs/02-trd.md, sección 5)
let payload: Payload
let editor: Usuario
let locales: Seccione
let deportes: Seccione
let base: Partial<Noticia>
const purgadas: string[][] = []
const clave = 'Clave-de-prueba-123'

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const c of ['noticias', 'medios', 'usuarios', 'secciones'] as const) {
    await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
  }
  editor = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Editora', email: 'editora@prueba.uy', password: clave, rol: 'periodista' },
  })
  locales = await payload.create({ collection: 'secciones', data: { nombre: 'Locales', slug: '', orden: 1 } })
  deportes = await payload.create({ collection: 'secciones', data: { nombre: 'Deportes', slug: '', orden: 2 } })
  const png = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#000' } }).png().toBuffer()
  const foto = await payload.create({
    collection: 'medios',
    data: { alt: 'Prueba' },
    file: { data: png, mimetype: 'image/png', name: 'cache.png', size: png.length },
  })
  base = {
    bajada: 'Una bajada de prueba con el largo suficiente para pasar la validación de ochenta caracteres.',
    cuerpo: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', text: 'Texto.', format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
          },
        ],
      },
    },
    foto: foto.id,
    estadoEditorial: 'borrador',
  }

  vi.stubEnv('CF_ZONE_ID', 'zona')
  vi.stubEnv('CF_API_TOKEN', 'token')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://visionfm-labs.fraybentos.uy')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/purge_cache')) purgadas.push(JSON.parse(String(init?.body)).files ?? ['*'])
      return new Response('{}')
    }),
  )
})

beforeEach(() => {
  purgadas.length = 0
})

afterAll(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await payload.delete({ collection: 'noticias', where: { id: { exists: true } }, overrideAccess: true })
})

const sitio = 'https://visionfm-labs.fraybentos.uy'

describe('caché al publicar', () => {
  it('un borrador no toca la caché', async () => {
    await payload.create({
      collection: 'noticias',
      data: { ...base, titulo: 'Borrador', slug: '', seccion: locales.id } as Noticia,
      draft: true,
    })
    expect(purgadas).toHaveLength(0)
  })

  it('publicar purga la nota, su sección, Noticias e Inicio', async () => {
    await payload.create({
      collection: 'noticias',
      data: { ...base, titulo: 'Obras en Cerro Norte', slug: '', seccion: locales.id, _status: 'published' } as Noticia,
      user: editor,
    })
    expect(purgadas.flat()).toEqual(
      expect.arrayContaining([
        `${sitio}/`,
        `${sitio}/noticias`,
        `${sitio}/noticias/locales`,
        `${sitio}/noticias/locales/obras-en-cerro-norte`,
      ]),
    )
  })

  it('mover una nota de sección purga también la URL vieja', async () => {
    const nota = await payload.create({
      collection: 'noticias',
      data: { ...base, titulo: 'Se muda', slug: '', seccion: locales.id, _status: 'published' } as Noticia,
    })
    purgadas.length = 0
    await payload.update({ collection: 'noticias', id: nota.id, data: { seccion: deportes.id, _status: 'published' } })
    expect(purgadas.flat()).toEqual(
      expect.arrayContaining([`${sitio}/noticias/locales/se-muda`, `${sitio}/noticias/deportes/se-muda`]),
    )
  })

  it('cambiar los ajustes generales purga todo', async () => {
    await payload.updateGlobal({
      slug: 'ajustes',
      data: { streamUrl: 'https://stream.example/vivo', telefono: '4562 0000', whatsapp: '099 000 000' },
    })
    expect(purgadas).toEqual([['*']])
  })
})
