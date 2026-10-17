import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// Fuera de Next no hay caché de datos: la lectura va directo a la base
vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}))

import { GET as buscar } from '@/app/api/buscar/route'
import type { Noticia } from '@/payload-types'
import { silencioMp3 } from '@/seed/imagenes'
import { listarEntrevistas, listarNoticias } from '@/sitio/datos'

// Buscador de Noticias y Entrevistas con texto completo en Postgres (docs/02-trd.md, sección 4)
let payload: Payload

const parrafo = (text: string) => ({
  type: 'paragraph',
  version: 1,
  children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
})
const cuerpo = (...textos: string[]) =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: textos.map(parrafo),
    },
  }) as Noticia['cuerpo']

// Solo lo que crea este archivo: la base puede tener los datos de ejemplo
const vaciar = async () => {
  const todo = { overrideAccess: true } as const
  await payload.delete({
    collection: 'noticias',
    where: { 'seccion.slug': { like: 'busqueda-' } },
    ...todo,
  })
  await payload.delete({
    collection: 'entrevistas',
    where: { 'programa.slug': { like: 'busqueda-' } },
    ...todo,
  })
  await payload.delete({ collection: 'programas', where: { slug: { like: 'busqueda-' } }, ...todo })
  await payload.delete({ collection: 'secciones', where: { slug: { like: 'busqueda-' } }, ...todo })
  await payload.delete({
    collection: 'archivos',
    where: { filename: { like: 'busqueda' } },
    ...todo,
  })
  await payload.delete({ collection: 'medios', where: { filename: { like: 'busqueda' } }, ...todo })
}

const titulos = async (q: string, seccion?: string) =>
  (await listarNoticias({ pagina: 1, q, seccion })).notas.map((n) => n.titulo).sort()

beforeAll(async () => {
  payload = await getPayload({ config })
  await vaciar()
  const deportes = await payload.create({
    collection: 'secciones',
    data: { nombre: 'Deportes', slug: 'busqueda-deportes', orden: 91 },
  })
  const locales = await payload.create({
    collection: 'secciones',
    data: { nombre: 'Locales', slug: 'busqueda-locales', orden: 92 },
  })
  const png = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#000' } })
    .png()
    .toBuffer()
  const foto = await payload.create({
    collection: 'medios',
    data: { alt: 'Prueba' },
    file: { data: png, mimetype: 'image/png', name: 'busqueda.png', size: png.length },
  })
  const nota = (titulo: string, seccion: number, texto: string, publicada = true) =>
    payload.create({
      collection: 'noticias',
      data: {
        titulo,
        slug: '',
        seccion,
        foto: foto.id,
        bajada:
          'Una bajada de prueba con el largo suficiente para pasar la validación de ochenta caracteres.',
        cuerpo: cuerpo('Primer párrafo.', texto),
        estadoEditorial: 'borrador',
        ...(publicada ? { _status: 'published' as const } : {}),
      },
      draft: !publicada,
    })
  await nota('Laureles ganó el clásico', deportes.id, 'El estadio Parque Liebig estuvo lleno.')
  await nota('Obras en la rambla', locales.id, 'La intendencia anunció la reparación de veredas.')
  await nota('Nuevo semáforo', locales.id, 'Quedó instalado frente al estadio municipal.')
  await nota('Borrador sobre el estadio', deportes.id, 'Todavía no está publicado.', false)

  const programa = await payload.create({
    collection: 'programas',
    data: {
      nombre: 'Busqueda Mañana',
      slug: 'busqueda-manana',
      horarios: [{ dias: ['sab'], inicio: '03:00', fin: '04:00' }],
    },
  })
  const mp3 = silencioMp3()
  const audio = await payload.create({
    collection: 'archivos',
    data: {},
    file: { data: mp3, mimetype: 'audio/mpeg', name: 'busqueda.mp3', size: mp3.length },
  })
  await payload.create({
    collection: 'entrevistas',
    data: {
      entrevistado: 'Ana Rodríguez',
      tema: 'Turismo',
      slug: '',
      programa: programa.id,
      fecha: '2026-10-10T12:00:00.000Z',
      audio: audio.id,
      resumen: 'Habló de la temporada de cruceros en el puerto.',
      _status: 'published',
    },
  })
}, 60_000)

afterAll(() => vaciar(), 60_000)

describe('buscador de Noticias', () => {
  it('busca en el cuerpo, sin tildes y por comienzo de palabra', async () => {
    expect(await titulos('liebig')).toEqual(['Laureles ganó el clásico'])
    expect(await titulos('semaforo')).toEqual(['Nuevo semáforo'])
    expect(await titulos('laure')).toEqual(['Laureles ganó el clásico'])
  })

  it('entiende plurales y pide todas las palabras', async () => {
    expect(await titulos('vereda')).toEqual(['Obras en la rambla'])
    expect(await titulos('estadio municipal')).toEqual(['Nuevo semáforo'])
  })

  it('no muestra borradores y respeta la sección', async () => {
    expect(await titulos('estadio')).toEqual(['Laureles ganó el clásico', 'Nuevo semáforo'])
    expect(await titulos('estadio', 'busqueda-deportes')).toEqual(['Laureles ganó el clásico'])
  })

  it('sin coincidencias, o con solo signos, no trae nada', async () => {
    expect(await titulos('submarino')).toEqual([])
    expect((await listarNoticias({ pagina: 1, q: "' & | !" })).total).toBe(0)
  })
})

describe('buscador de Entrevistas', () => {
  it('busca en el nombre, el tema y el resumen', async () => {
    for (const q of ['rodriguez', 'turismo', 'cruceros']) {
      expect(
        (await listarEntrevistas({ pagina: 1, q })).entrevistas.map((e) => e.entrevistado),
      ).toEqual(['Ana Rodríguez'])
    }
  })
})

describe('/api/buscar', () => {
  const pedir = (consulta: string) => buscar(new Request(`http://localhost/api/buscar?${consulta}`))

  it('devuelve los resultados paginados', async () => {
    const r = await pedir('en=noticias&q=estadio')
    expect(r.headers.get('cache-control')).toContain('s-maxage=60')
    const datos = (await r.json()) as {
      resultados: { titulo: string }[]
      total: number
      paginas: number
    }
    expect(datos.total).toBe(2)
    expect(datos.paginas).toBe(1)
  })

  it('valida dónde busca, el largo y la página', async () => {
    expect((await pedir('en=peliculas&q=estadio')).status).toBe(400)
    expect((await pedir('en=noticias&q=a')).status).toBe(400)
    expect((await pedir('en=entrevistas&q=turismo&pagina=0')).status).toBe(400)
  })
})
