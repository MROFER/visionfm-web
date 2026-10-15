import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { MB } from '@/base/lib/limiteSubida'

// Límites de tamaño por archivo (docs/02-trd.md): imágenes 15 MB, audio 90 MB, documentos 10 MB
let payload: Payload
const creados: { collection: 'medios' | 'archivos'; id: number | string }[] = []

const subir = async (
  collection: 'medios' | 'archivos',
  mimetype: string,
  name: string,
  data: Buffer,
) => {
  const doc = await payload.create({
    collection,
    data: collection === 'medios' ? { alt: name } : {},
    file: { data, mimetype, name, size: data.length },
  })
  creados.push({ collection, id: doc.id })
  return doc
}

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  for (const { collection, id } of creados) await payload.delete({ collection, id })
})

describe('límite de tamaño de subidas', () => {
  it('rechaza una imagen de más de 15 MB con un mensaje claro', async () => {
    await expect(
      subir('medios', 'image/png', 'grande.png', Buffer.alloc(16 * MB)),
    ).rejects.toMatchObject({
      status: 413,
      message: 'El archivo pesa 16 MB y el máximo para este tipo es 15 MB.',
    })
  })

  it('acepta una imagen normal', async () => {
    const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#f80' } })
      .png()
      .toBuffer()
    expect((await subir('medios', 'image/png', 'chica.png', png)).filename).toBeTruthy()
  })

  it('guarda el original en WebP con 2560 px de ancho como máximo', async () => {
    const png = await sharp({
      create: { width: 3200, height: 400, channels: 3, background: '#08f' },
    })
      .png()
      .toBuffer()
    const imagen = await subir('medios', 'image/png', 'ancha.png', png)
    expect(imagen.width).toBe(2560)
    expect(imagen.mimeType).toBe('image/webp')
  })

  it('un PDF de más de 10 MB no entra, pero un audio de ese tamaño sí', async () => {
    await expect(
      subir('archivos', 'application/pdf', 'grande.pdf', Buffer.alloc(11 * MB)),
    ).rejects.toMatchObject({ status: 413 })
    // Cabecera MP4 de audio (marca M4A) para que la detección de tipo lo reconozca
    const cabecera = Buffer.from('00000018667479704d344120000000004d34412069736f6d', 'hex')
    const m4a = Buffer.concat([cabecera, Buffer.alloc(11 * MB)])
    const audio = await subir('archivos', 'audio/x-m4a', 'entrevista.m4a', m4a)
    expect(audio.filesize).toBe(m4a.length)
  })
})
