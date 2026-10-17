import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { importarNotas } from '@/migracion/importar'
import type { ClienteWp, PostWp } from '@/migracion/wordpress'

// La migración de WordPress con un sitio viejo simulado: importa, filtra el spam y se puede repetir
let payload: Payload

const BASE = 'https://wp.prueba'
const IDS = [900001, 900002, 900003, 900004]
const ORIGENES = { like: `${BASE}/` }

const largo =
  'La intendencia de Río Negro comenzó las obras de la rambla de Fray Bentos, que van a durar seis meses.'

function postDe(id: number, cambios: Partial<PostWp> = {}): PostWp {
  return {
    id,
    date_gmt: '2025-03-01T12:00:00',
    modified_gmt: '2025-03-01T12:00:00',
    slug: `migracion-nota-${id}`,
    link: `${BASE}/migracion-nota-${id}/`,
    status: 'publish',
    title: { rendered: `Nota migrada ${id}` },
    excerpt: { rendered: `<p>${largo}</p>` },
    content: { rendered: `<p>${largo}</p>` },
    categories: [1],
    tags: [],
    featured_media: 0,
    ...cambios,
  }
}

let posts: PostWp[] = []
const bajadas: string[] = []

const cliente: ClienteWp = {
  async *posts() {
    yield* posts
  },
  async archivo(url) {
    bajadas.push(url)
    if (url.includes('rota')) return null
    const data = await sharp({
      create: { width: 40, height: 30, channels: 3, background: '#0f766e' },
    })
      .jpeg()
      .toBuffer()
    return { data, tipo: 'image/jpeg' }
  },
  async sitemap() {
    return [
      ...posts.map((p) => p.link),
      `${BASE}/category/1xbet-apk/`,
      `${BASE}/contacto/`,
      `${BASE}/`,
    ]
  },
}

const foto = (nombre: string) => ({
  id: 1,
  source_url: `${BASE}/wp-content/uploads/${nombre}`,
  alt_text: 'Las obras',
  caption: { rendered: '<p>Foto: Intendencia</p>' },
})

function sitioViejo() {
  posts = [
    postDe(900001, {
      featured_media: 1,
      _embedded: {
        'wp:featuredmedia': [foto('migracion-destacada.jpg')],
        'wp:term': [[{ id: 5, name: 'Deportes', slug: 'deportes', taxonomy: 'category' }]],
      },
      content: {
        rendered:
          `<p>${largo}</p>` +
          `<p><img src="${BASE}/wp-content/uploads/migracion-texto-300x200.jpg"></p>` +
          '<div style="display:none"><a href="https://casino.example">casino online</a></div>' +
          '<figure><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></figure>',
      },
    }),
    postDe(900002, {
      slug: '1win-plinko-uruguay',
      link: `${BASE}/1win-plinko-uruguay/`,
      title: { rendered: '1win Plinko: jugá y ganá' },
    }),
    // Sin foto destacada: usa la del texto, que ya se bajó para la 900001
    postDe(900003, {
      excerpt: { rendered: '<p>Corta</p>' },
      content: {
        rendered: `<p>${largo}</p><img src="${BASE}/wp-content/uploads/migracion-texto.jpg"><p><img src="${BASE}/rota.jpg"></p>`,
      },
    }),
    postDe(900004, {
      title: { rendered: `Un título larguísimo ${'que no termina nunca '.repeat(8)}` },
    }),
  ]
}

async function limpiar() {
  await payload.delete({ collection: 'noticias', where: { 'wordpress.idPost': { in: IDS } } })
  await payload.delete({
    collection: 'redirecciones',
    where: {
      or: [
        { desde: { contains: 'migracion-nota-' } },
        { desde: { in: ['/1win-plinko-uruguay/', '/category/1xbet-apk/'] } },
      ],
    },
  })
  await payload.delete({
    collection: 'medios',
    where: { or: [{ origen: ORIGENES }, { origen: { equals: 'visionfm:sin-foto' } }] },
  })
}

const importar = () => importarNotas(payload, { cliente, seccionPorDefecto: 'locales' })

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const nombre of ['Locales', 'Deportes']) {
    const slug = nombre.toLowerCase()
    const { totalDocs } = await payload.count({
      collection: 'secciones',
      where: { slug: { equals: slug } },
    })
    if (!totalDocs)
      await payload.create({ collection: 'secciones', data: { nombre, slug, orden: 90 } })
  }
  await limpiar()
  sitioViejo()
})

afterAll(async () => {
  await limpiar()
})

describe('migración de WordPress', () => {
  it('importa las notas, deja afuera el spam y arma las redirecciones', async () => {
    const { resumen, filas, sinRedireccion } = await importar()
    expect(resumen).toMatchObject({ creada: 3, spam: 1, error: 0 })
    expect(filas.find((f) => f.id === 900001)).toMatchObject({
      seccion: 'deportes',
      ruta: '/noticias/deportes/migracion-nota-900001',
      enlacesSpam: 1,
    })
    expect(sinRedireccion).toEqual([`${BASE}/contacto/`])

    const { docs } = await payload.find({
      collection: 'noticias',
      where: { 'wordpress.idPost': { in: IDS } },
      sort: 'wordpress.idPost',
      depth: 1,
    })
    expect(docs.map((d) => d.wordpress?.idPost)).toEqual([900001, 900003, 900004])
    const [conFoto, sinDestacada, tituloLargo] = docs
    expect(conFoto._status).toBe('published')
    expect(conFoto.estadoEditorial).toBe('publicada')
    expect(conFoto.fechaPublicacion).toBe('2025-03-01T12:00:00.000Z')
    expect(conFoto.epigrafe).toBe('Foto: Intendencia')
    expect(typeof conFoto.foto === 'object' && conFoto.foto?.alt).toBe('Las obras')
    const tipos = conFoto.cuerpo.root.children.map((n) => n.type)
    expect(tipos).toEqual(['paragraph', 'upload', 'paragraph'])
    expect(JSON.stringify(conFoto.cuerpo)).not.toContain('casino')
    expect(JSON.stringify(conFoto.cuerpo)).toContain('youtube.com/watch?v=dQw4w9WgXcQ')

    // La foto del texto de la 900003 es la misma imagen que la de la 900001: se baja una sola vez
    const textoId = conFoto.cuerpo.root.children.find((n) => n.type === 'upload') as unknown as {
      value: { id: number }
    }
    expect(typeof sinDestacada.foto === 'object' && sinDestacada.foto?.id).toBe(textoId.value.id)
    expect(sinDestacada.bajada).toBe(largo)
    expect(tituloLargo.titulo.length).toBeLessThanOrEqual(120)
    expect(tituloLargo.titulo.endsWith('…')).toBe(true)

    const { docs: redirecciones } = await payload.find({
      collection: 'redirecciones',
      where: {
        desde: {
          in: ['/migracion-nota-900001/', '/1win-plinko-uruguay/', '/category/1xbet-apk/'],
        },
      },
      sort: 'desde',
    })
    expect(redirecciones.map((r) => [r.desde, r.tipo, r.hacia ?? null])).toEqual([
      ['/1win-plinko-uruguay/', '410', null],
      ['/category/1xbet-apk/', '410', null],
      ['/migracion-nota-900001/', '301', '/noticias/deportes/migracion-nota-900001'],
    ])
  })

  it('una segunda corrida no duplica nada ni vuelve a bajar imágenes', async () => {
    const antes = {
      medios: (await payload.count({ collection: 'medios', where: { origen: ORIGENES } }))
        .totalDocs,
      redirecciones: (await payload.count({ collection: 'redirecciones' })).totalDocs,
      bajadas: bajadas.length,
    }
    const { resumen } = await importar()
    expect(resumen).toMatchObject({ 'sin-cambios': 3, spam: 1, creada: 0, actualizada: 0 })
    expect(
      (await payload.count({ collection: 'medios', where: { origen: ORIGENES } })).totalDocs,
    ).toBe(antes.medios)
    expect((await payload.count({ collection: 'redirecciones' })).totalDocs).toBe(
      antes.redirecciones,
    )
    expect(bajadas.length).toBe(antes.bajadas + 0)
    expect(
      (await payload.count({ collection: 'noticias', where: { 'wordpress.idPost': { in: IDS } } }))
        .totalDocs,
    ).toBe(3)
  })

  it('trae lo que cambió allá y no pisa lo que se editó en el panel', async () => {
    const { docs } = await payload.find({
      collection: 'noticias',
      where: { 'wordpress.idPost': { equals: 900004 } },
    })
    // Se edita en el panel un rato después de importada
    await payload.update({
      collection: 'noticias',
      id: docs[0].id,
      data: {
        titulo: 'Editada en el panel',
        wordpress: { ...docs[0].wordpress, importada: '2025-01-01T00:00:00.000Z' },
      },
    })

    posts = posts.map((p) =>
      p.id === 900001 || p.id === 900004
        ? { ...p, modified_gmt: '2025-03-05T09:00:00', title: { rendered: `Corregida ${p.id}` } }
        : p,
    )
    const { resumen, filas } = await importar()
    expect(resumen).toMatchObject({ actualizada: 1, 'editada-en-el-panel': 1, 'sin-cambios': 1 })
    expect(filas.find((f) => f.id === 900004)?.resultado).toBe('editada-en-el-panel')
    const {
      docs: [editada],
    } = await payload.find({
      collection: 'noticias',
      where: { 'wordpress.idPost': { equals: 900004 } },
    })
    expect(editada.titulo).toBe('Editada en el panel')

    const {
      docs: [corregida],
    } = await payload.find({
      collection: 'noticias',
      where: { 'wordpress.idPost': { equals: 900001 } },
    })
    expect(corregida.titulo).toBe('Corregida 900001')
    expect(corregida.fechaActualizacion).toBe('2025-03-05T09:00:00.000Z')
    // El slug no cambia aunque cambie el título: la URL nueva sigue siendo la misma
    expect(corregida.slug).toBe('migracion-nota-900001')
  })
})
