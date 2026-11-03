import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { silencioMp3 } from '@/seed/imagenes'

// Al subir el audio de una entrevista, la cola la transcribe con IA y guarda el texto sin publicarla
let payload: Payload
let programa: number
let audio: number

const trabajos = async () =>
  (
    await payload.find({
      collection: 'payload-jobs',
      where: { taskSlug: { equals: 'transcribirEntrevista' } },
    })
  ).docs

const vaciar = async () => {
  await payload.delete({
    collection: 'payload-jobs',
    where: { taskSlug: { equals: 'transcribirEntrevista' } },
  })
  await payload.delete({ collection: 'entrevistas', where: { tema: { like: 'Transcripción' } } })
  await payload.delete({
    collection: 'programas',
    where: { slug: { equals: 'transcripcion-manana' } },
  })
  await payload.delete({ collection: 'archivos', where: { filename: { like: 'transcripcion' } } })
}

const entrevista = (entrevistado: string) =>
  payload.create({
    collection: 'entrevistas',
    data: {
      entrevistado,
      tema: 'Transcripción de prueba',
      slug: '',
      programa,
      fecha: '2026-11-01T12:00:00.000Z',
      audio,
    },
    draft: true,
  })

const respuesta = (cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { headers: { 'content-type': 'application/json' } })

beforeAll(async () => {
  payload = await getPayload({ config })
  await vaciar()
  programa = (
    await payload.create({
      collection: 'programas',
      data: {
        nombre: 'Transcripción Mañana',
        slug: 'transcripcion-manana',
        horarios: [{ dias: ['dom'], inicio: '03:00', fin: '04:00' }],
      },
    })
  ).id
  const mp3 = silencioMp3()
  audio = (
    await payload.create({
      collection: 'archivos',
      data: {},
      file: { data: mp3, mimetype: 'audio/mpeg', name: 'transcripcion.mp3', size: mp3.length },
    })
  ).id
}, 60_000)

afterAll(async () => {
  delete process.env.ASSEMBLYAI_API_KEY
  vi.unstubAllGlobals()
  await vaciar()
}, 60_000)

describe('transcripción de entrevistas', () => {
  it('sin clave no encola nada', async () => {
    delete process.env.ASSEMBLYAI_API_KEY
    await entrevista('Sin Clave')
    expect(await trabajos()).toHaveLength(0)
  })

  it('con clave la transcribe una vez, le pone nombres y la deja en borrador', async () => {
    process.env.ASSEMBLYAI_API_KEY = 'clave-de-prueba'
    const e = await entrevista('Ana Rodríguez')
    const [trabajo] = await trabajos()
    expect(trabajo.input).toEqual({ entrevista: e.id })

    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta({ upload_url: 'https://cdn.assemblyai.prueba/a' }))
      .mockResolvedValueOnce(respuesta({ id: 't1', status: 'queued' }))
      .mockResolvedValueOnce(
        respuesta({
          id: 't1',
          status: 'completed',
          audio_duration: 61.4,
          utterances: [
            { speaker: 'A', text: '¿Cómo empezó todo?' },
            { speaker: 'B', text: 'Empezó hace diez años, con un grupo de vecinos del barrio.' },
          ],
        }),
      )
    vi.stubGlobal('fetch', fetch)
    await payload.jobs.runByID({ id: trabajo.id })
    vi.unstubAllGlobals()

    // Los bytes del disco viajaron a AssemblyAI con la clave
    expect(fetch.mock.calls[0][0]).toBe('https://api.assemblyai.com/v2/upload')
    expect((fetch.mock.calls[0][1].body as Uint8Array).length).toBe(silencioMp3().length)
    const guardada = await payload.findByID({ collection: 'entrevistas', id: e.id, draft: true })
    expect(guardada.transcripcion).toBe(
      'Transcripción Mañana: ¿Cómo empezó todo?\n\nAna Rodríguez: Empezó hace diez años, con un grupo de vecinos del barrio.',
    )
    expect(guardada.duracion).toBe(61)
    expect(guardada._status).toBe('draft')

    // Guardarla de nuevo (o publicarla) con el mismo audio no la vuelve a mandar
    await payload.update({ collection: 'entrevistas', id: e.id, data: { _status: 'published' } })
    expect(await trabajos()).toHaveLength(0)
  }, 60_000)
})
