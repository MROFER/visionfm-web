import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { POST } from '@/app/api/formularios/[tipo]/route'
import { reiniciarLimite } from '@/sitio/formularios/servidor'

// POST /api/formularios/{tipo} (docs/03-flujos.md, F6): guarda el mensaje y el adjunto privado
let payload: Payload
const marca = `prueba-form-${Date.now()}`

const enviar = (tipo: string, campos: Record<string, string | string[] | File>, ip = '10.0.0.1') => {
  const datos = new FormData()
  for (const [clave, valor] of Object.entries(campos)) {
    for (const v of Array.isArray(valor) ? valor : [valor]) datos.append(clave, v)
  }
  const pedido = new Request(`http://localhost/api/formularios/${tipo}`, {
    method: 'POST',
    body: datos,
    headers: { 'cf-connecting-ip': ip },
  })
  return POST(pedido, { params: Promise.resolve({ tipo }) })
}

const PDF =
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n' +
  'xref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n98\n%%EOF\n'

const contacto = { nombre: marca, email: 'ana@ejemplo.com', motivo: 'noticia', mensaje: 'Hay un pozo en la calle', consentimiento: 'si' }

beforeAll(async () => {
  payload = await getPayload({ config })
})

beforeEach(() => reiniciarLimite())

afterAll(async () => {
  const { docs } = await payload.find({ collection: 'mensajes', where: { nombre: { equals: marca } }, depth: 0, limit: 50 })
  for (const m of docs) {
    await payload.delete({ collection: 'mensajes', id: m.id })
    if (m.adjunto) await payload.delete({ collection: 'archivos', id: m.adjunto as number })
  }
})

describe('envío de formularios', () => {
  it('crea el mensaje con el adjunto como archivo privado', async () => {
    const pdf = new File([Buffer.from(PDF, 'latin1')], 'Mi CV (final).pdf', { type: 'application/pdf' })
    const r = await enviar('sumarse', {
      ...contacto,
      telefono: '099 123 456',
      areas: ['conduccion', 'pasantia'],
      adjunto: pdf,
    })
    expect(r.status).toBe(201)
    const { docs } = await payload.find({ collection: 'mensajes', where: { nombre: { equals: marca }, tipo: { equals: 'sumarse' } }, depth: 1 })
    expect(docs).toHaveLength(1)
    const m = docs[0]
    expect(m.estado).toBe('nuevo')
    expect(m.datos).toEqual({ areas: ['conduccion', 'pasantia'] })
    expect(m.consentimiento.aceptado).toBe(true)
    expect(m.adjunto).toMatchObject({ privado: true, mimeType: 'application/pdf' })
    expect((m.adjunto as { filename: string }).filename).toMatch(/^Mi-CV-final-?\d*\.pdf$/)
  })

  it('devuelve los errores por campo sin guardar nada', async () => {
    const r = await enviar('contacto', { ...contacto, email: 'no-es-email', consentimiento: '' })
    expect(r.status).toBe(400)
    const cuerpo = await r.json()
    expect(Object.keys(cuerpo.error.errores).sort()).toEqual(['consentimiento', 'email'])
  })

  it('rechaza adjuntos de tipos no permitidos', async () => {
    const exe = new File([Buffer.from('MZ')], 'programa.exe', { type: 'application/x-msdownload' })
    const r = await enviar('contacto', { ...contacto, adjunto: exe })
    expect(r.status).toBe(400)
    expect((await r.json()).error.errores.adjunto).toMatch(/no se puede adjuntar/)
  })

  it('corta después de 5 envíos por hora desde la misma IP', async () => {
    for (let i = 0; i < 5; i++) expect((await enviar('contacto', contacto, '10.0.0.9')).status).toBe(201)
    const r = await enviar('contacto', contacto, '10.0.0.9')
    expect(r.status).toBe(429)
  })

  it('rechaza un archivo que dice ser PDF y no lo es', async () => {
    const falso = new File([Buffer.from('%PDF-1.4 nada más')], 'cv.pdf', { type: 'application/pdf' })
    const r = await enviar('contacto', { ...contacto, adjunto: falso })
    expect(r.status).toBe(400)
    expect((await r.json()).error.errores.adjunto).toMatch(/No pudimos leer ese archivo/)
  })

  it('no conoce otros formularios', async () => {
    expect((await enviar('cualquiera', contacto)).status).toBe(404)
  })
})
