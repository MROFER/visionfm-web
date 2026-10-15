import config from '@payload-config'
import { getPayload, type Payload, type PayloadRequest, type SendEmailOptions } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { diaEnMontevideo, mediodiaUTC, sumarDias } from '@/sitio/publicidad/fechas'
import {
  avisarVencimientos,
  descargarReporte,
  enviarReportesMensuales,
} from '@/sitio/publicidad/tareas'
import type { Anuncio, Usuario } from '@/payload-types'

// Aviso de vencimiento (P6) y reporte mensual a anunciantes (P11)
let payload: Payload
let comercial: Usuario
let periodista: Usuario
let enviados: SendEmailOptions[] = []
const clave = 'Clave-de-prueba-123'
const hoy = diaEnMontevideo(new Date())

const imagen = async (width: number, height: number) => {
  const png = await sharp({ create: { width, height, channels: 3, background: '#0b6' } })
    .png()
    .toBuffer()
  return payload.create({
    collection: 'medios',
    data: { alt: 'Anuncio' },
    file: { data: png, mimetype: 'image/png', name: `anuncio-${width}.png`, size: png.length },
  })
}

let imagenes: Pick<Anuncio, 'imagenWeb' | 'imagenMovil'>
const anuncio = (datos: Partial<Anuncio> & Pick<Anuncio, 'nombre' | 'anunciante'>) =>
  payload.create({
    collection: 'anuncios',
    data: {
      ubicaciones: ['inicio'],
      desde: mediodiaUTC('2026-09-01'),
      hasta: mediodiaUTC(sumarDias(hoy, 30)),
      ...imagenes,
      ...datos,
    },
  })

const metrica = (anuncio: Anuncio, dia: string, impresiones: number, clics: number) =>
  payload.create({
    collection: 'anunciosMetricas',
    data: { anuncio: anuncio.id, ubicacion: 'inicio', fecha: mediodiaUTC(dia), impresiones, clics },
  })

const usuario = (email: string, rol: Usuario['rol']) =>
  payload.create({ collection: 'usuarios', data: { nombre: email, email, password: clave, rol } })

const pedirReporte = (user: Usuario, consulta: string) =>
  descargarReporte.handler({
    user,
    payload,
    searchParams: new URLSearchParams(consulta),
  } as unknown as PayloadRequest)

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const c of ['anunciosMetricas', 'anuncios', 'medios', 'usuarios'] as const) {
    await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
  }
  // La primera cuenta queda como Owner
  await usuario('owner@prueba.uy', 'periodista')
  comercial = await usuario('comercial@prueba.uy', 'comercial')
  periodista = await usuario('periodista@prueba.uy', 'periodista')
  imagenes = { imagenWeb: (await imagen(970, 90)).id, imagenMovil: (await imagen(320, 100)).id }
  vi.spyOn(payload, 'sendEmail').mockImplementation(async (mensaje) => {
    enviados.push(mensaje as SendEmailOptions)
  })
})

beforeEach(() => {
  enviados = []
})

// Los anuncios apuntan a medios: sin borrarlos, los otros tests no pueden vaciar `medios`
afterAll(async () => {
  for (const c of ['anunciosMetricas', 'anuncios'] as const) {
    await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
  }
})

describe('aviso de vencimiento', () => {
  it('avisa a quienes administran publicidad de lo que vence en 7 días', async () => {
    await anuncio({
      nombre: 'Banner primavera',
      anunciante: 'Tienda Sol',
      hasta: mediodiaUTC(sumarDias(hoy, 7)),
    })
    await anuncio({
      nombre: 'Banner verano',
      anunciante: 'Tienda Sol',
      hasta: mediodiaUTC(sumarDias(hoy, 8)),
    })
    await anuncio({
      nombre: 'Banner pausado',
      anunciante: 'Tienda Sol',
      hasta: mediodiaUTC(sumarDias(hoy, 7)),
      activo: false,
    })

    expect(await avisarVencimientos(payload)).toEqual({ anuncios: 1, avisados: 2 })
    expect(enviados.map((m) => m.to).sort()).toEqual(['comercial@prueba.uy', 'owner@prueba.uy'])
    expect(enviados[0].text).toContain('Banner primavera')
    expect(enviados[0].text).not.toContain('Banner verano')
  })

  it('corre como tarea de la cola', async () => {
    const job = await payload.jobs.queue({ task: 'avisoVencimientoAnuncios', input: {} })
    await payload.jobs.runByID({ id: job.id })
    // Al terminar bien, la cola borra el trabajo
    expect(
      (await payload.find({ collection: 'payload-jobs', where: { id: { equals: job.id } } }))
        .totalDocs,
    ).toBe(0)
    expect(enviados).toHaveLength(2)
  })
})

describe('reporte mensual', () => {
  beforeAll(async () => {
    const radio = await anuncio({
      nombre: 'Ferretería · radio',
      anunciante: 'Ferretería Rivera',
      emailReporte: 'ventas@ferreteria.uy',
    })
    const web = await anuncio({
      nombre: 'Ferretería · web',
      anunciante: 'Ferretería Rivera',
      emailReporte: 'Ventas@ferreteria.uy',
    })
    const sinEmail = await anuncio({ nombre: 'Panadería', anunciante: 'Panadería Centro' })
    await metrica(radio, '2026-09-01', 1000, 12)
    await metrica(web, '2026-09-30', 500, 3)
    await metrica(radio, '2026-10-01', 9999, 99)
    await metrica(sinEmail, '2026-09-10', 300, 1)
  })

  it('el día 1 manda un PDF por anunciante con email, una sola vez por dirección', async () => {
    const resultado = await enviarReportesMensuales(payload, new Date('2026-10-01T11:00:00Z'))
    expect(resultado).toEqual({ anunciantes: 1, enviados: 1 })
    expect(enviados[0].to).toBe('ventas@ferreteria.uy')
    expect(enviados[0].subject).toContain('setiembre de 2026')
    const [adjunto] = enviados[0].attachments as { filename: string; content: Buffer }[]
    expect(adjunto.filename).toBe('reporte-2026-09.pdf')
    expect(adjunto.content.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('comercial baja el PDF desde el panel', async () => {
    const respuesta = await pedirReporte(comercial, 'anunciante=Ferretería Rivera&mes=2026-09')
    expect(respuesta.status).toBe(200)
    expect(respuesta.headers.get('Content-Type')).toBe('application/pdf')
    expect(respuesta.headers.get('Content-Disposition')).toContain(
      'reporte-ferreteria-rivera-2026-09.pdf',
    )
  })

  it('sin permiso de publicidad no hay reporte', async () => {
    expect(
      (await pedirReporte(periodista, 'anunciante=Ferretería Rivera&mes=2026-09')).status,
    ).toBe(403)
  })

  it('pide el mes como AAAA-MM y un anunciante que exista', async () => {
    expect(
      (await pedirReporte(comercial, 'anunciante=Ferretería Rivera&mes=septiembre')).status,
    ).toBe(400)
    expect((await pedirReporte(comercial, 'anunciante=Nadie&mes=2026-09')).status).toBe(404)
  })
})
