import config from '@payload-config'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { sembrar } from '@/seed'

// `pnpm seed` deja el sitio navegable y se puede correr más de una vez
let payload: Payload

const COLECCIONES: CollectionSlug[] = [
  'anunciosMetricas',
  'anuncios',
  'funciones',
  'peliculas',
  'entrevistas',
  'noticias',
  'excepcionesGrilla',
  'programas',
  'equipo',
  'mensajes',
  'secciones',
  'archivos',
  'medios',
]

async function vaciar() {
  // Los globales apuntan a notas, películas e imágenes: primero se sueltan
  await payload.updateGlobal({
    slug: 'portada',
    data: { notaDestacada: null, peliculaDestacada: null },
  })
  await payload.updateGlobal({
    slug: 'cinevision',
    data: { carrusel: [], precios: [], comoLlegar: { mapaImagen: null } },
  })
  await payload.updateGlobal({
    slug: 'ajustes',
    data: { avisoPropio: { imagenWeb: null, imagenMovil: null } },
  })
  await payload.updateGlobal({ slug: 'institucional', data: { hitos: [], kitComercial: null } })
  for (const collection of COLECCIONES) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await vaciar()
}, 60_000)

afterAll(async () => {
  await vaciar()
}, 60_000)

describe('datos de ejemplo', () => {
  it('carga notas, grilla, cine y publicidad', async () => {
    const { creados } = await sembrar(payload)
    expect(creados).toBeGreaterThan(50)

    const notas = await payload.find({
      collection: 'noticias',
      where: { _status: { equals: 'published' } },
    })
    expect(notas.totalDocs).toBe(8)
    expect((await payload.count({ collection: 'programas' })).totalDocs).toBe(6)
    expect((await payload.count({ collection: 'funciones' })).totalDocs).toBe(21)
    const portada = await payload.findGlobal({ slug: 'portada', depth: 0 })
    expect(portada.notaDestacada).toBeTruthy()
  }, 120_000)

  it('la segunda vez no duplica nada', async () => {
    const antes = (await payload.count({ collection: 'medios' })).totalDocs
    const { creados } = await sembrar(payload)
    expect(creados).toBe(0)
    expect((await payload.count({ collection: 'medios' })).totalDocs).toBe(antes)
  }, 120_000)
})
