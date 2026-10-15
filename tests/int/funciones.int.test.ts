import config from '@payload-config'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { endpointCopiarSemana } from '@/sitio/cinevision/copiarSemana'
import { rangoSemana } from '@/sitio/cinevision/semana'
import type { Pelicula, Usuario } from '@/payload-types'

// Grilla de funciones: "Copiar semana anterior" (docs/03-flujos.md, P4)
let payload: Payload
let cine: Usuario
let periodista: Usuario
let pelicula: Pelicula
const clave = 'Clave-de-prueba-123'
const LUNES = '2027-03-08'
const ANTERIOR = '2027-03-01'

const usuario = (email: string, rol: Usuario['rol']) =>
  payload.create({ collection: 'usuarios', data: { nombre: email, email, password: clave, rol } })

const funcion = (fechaHora: string, idioma: 'subtitulada' | 'doblada' = 'subtitulada') =>
  payload.create({
    collection: 'funciones',
    data: { pelicula: pelicula.id, fechaHora, idioma, formato: '2d' },
  })

const copiar = (user: Usuario, semana: unknown) =>
  endpointCopiarSemana.handler({
    user,
    payload,
    json: async () => ({ semana }),
  } as unknown as PayloadRequest)

const funcionesDe = async (lunes: string) => {
  const { desde, hasta } = rangoSemana(lunes)
  return (
    await payload.find({
      collection: 'funciones',
      where: {
        and: [{ fechaHora: { greater_than_equal: desde } }, { fechaHora: { less_than: hasta } }],
      },
      sort: 'fechaHora',
      depth: 0,
      limit: 0,
    })
  ).docs
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.delete({ collection: 'funciones', where: { id: { exists: true } } })
  await payload.delete({ collection: 'usuarios', where: { id: { exists: true } } })
  await usuario('owner-cine@prueba.uy', 'periodista')
  cine = await usuario('cine@prueba.uy', 'cinevision')
  periodista = await usuario('periodista-cine@prueba.uy', 'periodista')
  const png = await sharp({ create: { width: 60, height: 90, channels: 3, background: '#333' } })
    .png()
    .toBuffer()
  const afiche = await payload.create({
    collection: 'medios',
    data: { alt: 'Afiche' },
    file: { data: png, mimetype: 'image/png', name: 'afiche-prueba.png', size: png.length },
  })
  pelicula = await payload.create({
    collection: 'peliculas',
    data: {
      titulo: `Grilla de prueba ${Date.now()}`,
      slug: '',
      genero: 'Drama',
      duracion: 100,
      calificacion: 'atp',
      idiomas: ['subtitulada'],
      formatos: ['2d'],
      sinopsis: 'Prueba.',
      afiche: afiche.id,
      _status: 'published',
    },
  })
  // Semana anterior: lunes 19:00 y domingo 21:30 de Montevideo
  await funcion(`${ANTERIOR}T19:00:00-03:00`)
  await funcion(`2027-03-07T21:30:00-03:00`)
  // Una ya cargada en la semana destino
  await funcion(`${LUNES}T19:00:00-03:00`)
})

afterAll(async () => {
  await payload.delete({ collection: 'funciones', where: { pelicula: { equals: pelicula.id } } })
  await payload.delete({ collection: 'peliculas', id: pelicula.id })
})

describe('copiar semana anterior', () => {
  it('copia las funciones corridas 7 días y no duplica las que ya están', async () => {
    const respuesta = await copiar(cine, '2027-03-10') // cualquier día de la semana destino
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toMatchObject({ creadas: 1, omitidas: 1 })
    const semana = await funcionesDe(LUNES)
    expect(semana.map((f) => f.fechaHora)).toEqual([
      '2027-03-08T22:00:00.000Z',
      '2027-03-15T00:30:00.000Z',
    ])
  })

  it('copiar dos veces no duplica', async () => {
    const respuesta = await copiar(cine, LUNES)
    expect(await respuesta.json()).toMatchObject({ creadas: 0 })
    expect(await funcionesDe(LUNES)).toHaveLength(2)
  })

  it('sin permiso de Cinevisión no copia', async () => {
    expect((await copiar(periodista, LUNES)).status).toBe(403)
  })

  it('pide la semana como fecha', async () => {
    expect((await copiar(cine, 'marzo')).status).toBe(400)
  })
})
