import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// Fuera de Next no hay caché de datos: la lectura va directo a la base
vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}))

import { GET as grilla } from '@/app/api/grilla/route'
import type { ExcepcionEnGrilla } from '@/sitio/lib/grilla'
import { mediodiaUTC, sumarDias } from '@/sitio/publicidad/fechas'
import { hoyEnMontevideo } from '@/sitio/lib/fecha'

// /api/grilla con las excepciones de los próximos 7 días (docs/04-esquema.md, excepcionesGrilla)
let payload: Payload
const hoy = hoyEnMontevideo()

const limpiar = async () => {
  await payload.delete({
    collection: 'excepcionesGrilla',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'programas',
    where: { slug: { like: 'grilla-api-' } },
    overrideAccess: true,
  })
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await limpiar()
})

afterAll(() => limpiar())

describe('/api/grilla', () => {
  it('trae la grilla y las excepciones de hoy a siete días, con el nombre del programa', async () => {
    const programa = await payload.create({
      collection: 'programas',
      data: {
        nombre: 'Deportes Visión',
        slug: 'grilla-api-deportes',
        horarios: [{ dias: ['dom'], inicio: '03:00', fin: '04:00' }],
      },
    })
    const excepcion = (dias: number, datos: { titulo?: string; programa?: number }) =>
      payload.create({
        collection: 'excepcionesGrilla',
        data: { fecha: mediodiaUTC(sumarDias(hoy, dias)), inicio: '15:00', fin: '17:00', ...datos },
      })
    await excepcion(-1, { titulo: 'Ayer' })
    const partido = await excepcion(0, { titulo: 'Fútbol: Laureles vs. Anglo' })
    const conPrograma = await excepcion(7, { programa: programa.id })
    await excepcion(8, { titulo: 'Muy lejos' })

    const r = await grilla()
    expect(r.headers.get('cache-control')).toContain('s-maxage')
    const datos = (await r.json()) as {
      programas: { slug: string }[]
      excepciones: ExcepcionEnGrilla[]
    }
    expect(datos.programas.map((p) => p.slug)).toContain('grilla-api-deportes')
    expect(datos.excepciones).toEqual([
      {
        id: partido.id,
        fecha: hoy,
        inicio: '15:00',
        fin: '17:00',
        programa: null,
        titulo: 'Fútbol: Laureles vs. Anglo',
        conduccion: '',
      },
      {
        id: conPrograma.id,
        fecha: sumarDias(hoy, 7),
        inicio: '15:00',
        fin: '17:00',
        programa: programa.id,
        titulo: 'Deportes Visión',
        conduccion: '',
      },
    ])
  })
})
