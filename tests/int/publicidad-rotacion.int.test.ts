import config from '@payload-config'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Fuera de Next no hay caché de datos: la lectura va directo a la base
vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}))

import { GET as clic } from '@/app/a/[id]/route'
import { POST as impresiones } from '@/app/api/anuncios/impresiones/route'
import { GET as anuncios } from '@/app/api/anuncios/route'
import { hoyEnMontevideo } from '@/sitio/lib/fecha'
import { mediodiaUTC, sumarDias } from '@/sitio/publicidad/fechas'
import { reiniciarLimiteImpresiones } from '@/sitio/publicidad/limite'
import { descargarMetricas } from '@/sitio/publicidad/tareas'
import type { Anuncio, Usuario } from '@/payload-types'

// Rotación de anuncios por ubicación, impresiones, clics y exportación (docs/07, sección 3)
let payload: Payload
let imagenes: Pick<Anuncio, 'imagenWeb' | 'imagenMovil'>
let deportes: number
const hoy = hoyEnMontevideo()
const NAVEGADOR = 'Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile'

const imagen = async (width: number, height: number) => {
  const png = await sharp({ create: { width, height, channels: 3, background: '#06b' } })
    .png()
    .toBuffer()
  return payload.create({
    collection: 'medios',
    data: { alt: 'Anuncio' },
    file: { data: png, mimetype: 'image/png', name: `rotacion-${width}.png`, size: png.length },
  })
}

const anuncio = (datos: Partial<Anuncio> & Pick<Anuncio, 'nombre'>) =>
  payload.create({
    collection: 'anuncios',
    data: {
      anunciante: 'Comercio de prueba',
      ubicaciones: ['inicio'],
      desde: mediodiaUTC(sumarDias(hoy, -5)),
      hasta: mediodiaUTC(sumarDias(hoy, 5)),
      link: 'https://comercio.example/promo',
      ...imagenes,
      ...datos,
    },
  })

const listar = async (consulta: string) => {
  const r = await anuncios(new Request(`http://localhost/api/anuncios?${consulta}`))
  return { estado: r.status, ids: r.ok ? ((await r.json()) as { anuncios: { id: number }[] }).anuncios.map((a) => a.id).sort() : [] }
}

const ver = (ubicacion: string, ids: number[], ip = '10.0.0.1') =>
  impresiones(
    new Request('http://localhost/api/anuncios/impresiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'user-agent': NAVEGADOR, 'cf-connecting-ip': ip },
      body: JSON.stringify({ ubicacion, ids }),
    }),
  )

const tocar = (id: number, ubicacion: string, agente = NAVEGADOR) =>
  clic(new Request(`http://localhost/a/${id}?u=${ubicacion}`, { headers: { 'user-agent': agente } }), {
    params: Promise.resolve({ id: String(id) }),
  })

const metricas = async (id: number) => {
  const { docs } = await payload.find({ collection: 'anunciosMetricas', where: { anuncio: { equals: id } }, depth: 0 })
  return docs.map((m) => ({ ubicacion: m.ubicacion, impresiones: m.impresiones, clics: m.clics }))
}

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const c of ['anunciosMetricas', 'anuncios', 'medios'] as const) {
    await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
  }
  await payload.delete({ collection: 'secciones', where: { slug: { like: 'rotacion-' } }, overrideAccess: true })
  imagenes = { imagenWeb: (await imagen(970, 90)).id, imagenMovil: (await imagen(320, 100)).id }
  deportes = (await payload.create({ collection: 'secciones', data: { nombre: 'Deportes', slug: 'rotacion-deportes', orden: 90 } })).id
  await payload.create({ collection: 'secciones', data: { nombre: 'Política', slug: 'rotacion-politica', orden: 91 } })
})

beforeEach(async () => {
  reiniciarLimiteImpresiones()
  for (const c of ['anunciosMetricas', 'anuncios'] as const) {
    await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
  }
})

describe('anuncios que rotan', () => {
  it('lista solo los activos y en fecha de esa ubicación', async () => {
    const vigente = await anuncio({ nombre: 'Vigente' })
    await anuncio({ nombre: 'Vencido', desde: mediodiaUTC(sumarDias(hoy, -20)), hasta: mediodiaUTC(sumarDias(hoy, -1)) })
    await anuncio({ nombre: 'Futuro', desde: mediodiaUTC(sumarDias(hoy, 1)) })
    await anuncio({ nombre: 'Apagado', activo: false })
    const cine = await anuncio({ nombre: 'Cine', ubicaciones: ['cinevision'] })
    const ambos = await anuncio({ nombre: 'Ambos', ubicaciones: ['inicio', 'cinevision'], peso: 3 })

    expect((await listar('ubicacion=inicio')).ids).toEqual([vigente.id, ambos.id].sort())
    expect((await listar('ubicacion=cinevision')).ids).toEqual([cine.id, ambos.id].sort())
    expect((await listar('ubicacion=institucional')).ids).toEqual([])
  })

  it('en Sección y Nota respeta las secciones elegidas', async () => {
    const soloDeportes = await anuncio({ nombre: 'Deportes', ubicaciones: ['noticias-nota'], secciones: [deportes] })
    const todas = await anuncio({ nombre: 'Todas', ubicaciones: ['noticias-nota'] })

    expect((await listar('ubicacion=noticias-nota&seccion=rotacion-deportes')).ids).toEqual(
      [soloDeportes.id, todas.id].sort(),
    )
    expect((await listar('ubicacion=noticias-nota&seccion=rotacion-politica')).ids).toEqual([todas.id])
  })

  it('rechaza ubicaciones que no existen', async () => {
    expect((await listar('ubicacion=portada')).estado).toBe(400)
    expect((await listar('ubicacion=inicio&seccion=../x')).estado).toBe(400)
  })
})

describe('impresiones', () => {
  it('suma solo los anuncios que rotan en esa ubicación', async () => {
    const enInicio = await anuncio({ nombre: 'Inicio' })
    const enCine = await anuncio({ nombre: 'Cine', ubicaciones: ['cinevision'] })

    expect((await ver('inicio', [enInicio.id, enCine.id, 999999])).status).toBe(204)
    await ver('inicio', [enInicio.id])

    expect(await metricas(enInicio.id)).toEqual([{ ubicacion: 'inicio', impresiones: 2, clics: 0 }])
    expect(await metricas(enCine.id)).toEqual([])
    const total = await payload.findByID({ collection: 'anuncios', id: enInicio.id, depth: 0 })
    expect(total.impresiones).toBe(2)
  })

  it('corta a las 60 por minuto desde la misma conexión', async () => {
    const a = await anuncio({ nombre: 'Muy visto' })
    for (let i = 0; i < 60; i++) await ver('inicio', [a.id], '10.0.0.9')
    expect((await ver('inicio', [a.id], '10.0.0.9')).status).toBe(429)
    expect((await ver('inicio', [a.id], '10.0.0.10')).status).toBe(204)
  })

  it('no cuenta robots ni pedidos mal armados', async () => {
    const a = await anuncio({ nombre: 'Robot' })
    const robot = await impresiones(
      new Request('http://localhost/api/anuncios/impresiones', {
        method: 'POST',
        headers: { 'user-agent': 'Googlebot/2.1' },
        body: JSON.stringify({ ubicacion: 'inicio', ids: [a.id] }),
      }),
    )
    expect(robot.status).toBe(204)
    expect((await ver('portada', [a.id])).status).toBe(400)
    expect(await metricas(a.id)).toEqual([])
  })
})

describe('clics', () => {
  it('suma el clic en la ubicación y redirige al destino', async () => {
    const a = await anuncio({ nombre: 'Promo' })
    const r = await tocar(a.id, 'inicio')
    expect(r.status).toBe(302)
    expect(r.headers.get('location')).toBe('https://comercio.example/promo')
    await tocar(a.id, 'inicio', 'facebookexternalhit/1.1')

    expect(await metricas(a.id)).toEqual([{ ubicacion: 'inicio', impresiones: 0, clics: 1 }])
    expect((await payload.findByID({ collection: 'anuncios', id: a.id, depth: 0 })).clics).toBe(1)
  })

  it('un anuncio apagado o con un link raro manda a la portada sin contar', async () => {
    const apagado = await anuncio({ nombre: 'Apagado', activo: false })
    const raro = await anuncio({ nombre: 'Raro', link: 'javascript:alert(1)' })
    const sitio = new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost').toString()

    expect((await tocar(apagado.id, 'inicio')).headers.get('location')).toBe(sitio)
    expect((await tocar(raro.id, 'inicio')).headers.get('location')).toBe(sitio)
    expect(await metricas(apagado.id)).toEqual([])
  })
})

describe('exportar métricas', () => {
  const usuario = (email: string, rol: Usuario['rol']) =>
    payload.create({ collection: 'usuarios', data: { nombre: email, email, password: 'Clave-de-prueba-123', rol } })
  const bajar = (user: Usuario, id: number) =>
    descargarMetricas.handler({ user, payload, routeParams: { id: String(id) } } as unknown as PayloadRequest)

  it('baja el CSV por día y ubicación solo con permiso de Publicidad', async () => {
    await payload.delete({ collection: 'usuarios', where: { email: { like: 'csv-' } }, overrideAccess: true })
    const comercial = await usuario('csv-comercial@prueba.uy', 'comercial')
    const periodista = await usuario('csv-periodista@prueba.uy', 'periodista')
    const a = await anuncio({ nombre: 'Para exportar', ubicaciones: ['inicio', 'cinevision'] })
    await ver('inicio', [a.id])
    await ver('cinevision', [a.id])
    await tocar(a.id, 'cinevision')

    expect((await bajar(periodista, a.id)).status).toBe(403)
    const r = await bajar(comercial, a.id)
    expect(r.headers.get('content-type')).toContain('text/csv')
    const texto = await r.text()
    expect(texto).toContain('Fecha;Ubicación;Impresiones;Clics;CTR')
    expect(texto).toContain(`${hoy};Cinevisión;1;1;100 %`)
    expect(texto).toContain(`${hoy};Inicio;1;0;0 %`)
    expect(texto).toContain('Total;;2;1;50 %')
  })
})
