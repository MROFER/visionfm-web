import config from '@payload-config'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { sembrar } from '@/seed'
import { cargarGrilla } from '@/seed/grilla'
import { borrarNoticiasDePrueba, cargarNoticiasDePrueba } from '@/seed/noticias-de-prueba'

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
  // En una base nueva los Ajustes todavía no pasan la validación: solo se tocan si tienen imágenes
  const { avisoPropio } = await payload.findGlobal({ slug: 'ajustes', depth: 0 })
  if (avisoPropio?.imagenWeb || avisoPropio?.imagenMovil || avisoPropio?.imagenRectangulo) {
    await payload.updateGlobal({
      slug: 'ajustes',
      data: { avisoPropio: { imagenWeb: null, imagenMovil: null, imagenRectangulo: null } },
    })
  }
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
    expect((await payload.count({ collection: 'programas' })).totalDocs).toBe(22)
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

  it('cambiar la programación no toca lo demás y las entrevistas siguen con programa', async () => {
    // Una demo con la grilla vieja: un programa que ya no está, con una entrevista
    await payload.delete({ collection: 'programas', where: { id: { exists: true } } })
    const viejo = await payload.create({
      collection: 'programas',
      data: {
        nombre: 'Tarde Deportiva',
        slug: '',
        horarios: [{ dias: ['lun'], inicio: '18:00', fin: '20:00' }],
      },
    })
    const { docs } = await payload.find({
      collection: 'entrevistas',
      where: { tema: { equals: 'La previa del clásico' } },
    })
    await payload.update({
      collection: 'entrevistas',
      id: docs[0].id,
      data: { programa: viejo.id },
    })
    const cuantos = async () => ({
      noticias: (await payload.count({ collection: 'noticias' })).totalDocs,
      peliculas: (await payload.count({ collection: 'peliculas' })).totalDocs,
      funciones: (await payload.count({ collection: 'funciones' })).totalDocs,
      entrevistas: (await payload.count({ collection: 'entrevistas' })).totalDocs,
    })
    const antes = await cuantos()

    const resultado = await cargarGrilla(payload)

    expect(resultado).toEqual({ borrados: 1, creados: 22, sinPrograma: 0 })
    expect(await cuantos()).toEqual(antes)
    const entrevista = await payload.findByID({ collection: 'entrevistas', id: docs[0].id })
    expect(entrevista.programa).toMatchObject({ nombre: 'Conectados' })
  }, 120_000)

  it('las noticias de prueba se cargan una sola vez y se sacan sin tocar las de ejemplo', async () => {
    const publicadas = async () =>
      (await payload.count({ collection: 'noticias', where: { _status: { equals: 'published' } } }))
        .totalDocs
    const medios = (await payload.count({ collection: 'medios' })).totalDocs

    expect(await cargarNoticiasDePrueba(payload)).toEqual({ creadas: 84, existentes: 0 })
    expect(await publicadas()).toBe(8 + 84)
    expect(await cargarNoticiasDePrueba(payload)).toEqual({ creadas: 0, existentes: 84 })

    expect(await borrarNoticiasDePrueba(payload)).toBe(84)
    expect(await publicadas()).toBe(8)
    expect((await payload.count({ collection: 'medios' })).totalDocs).toBe(medios)
  }, 300_000)
})
