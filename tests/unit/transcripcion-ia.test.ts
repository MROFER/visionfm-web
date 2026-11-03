import { describe, expect, it, vi } from 'vitest'

import { armarTranscripcion } from '@/sitio/transcripcion/armar'
import { transcribir } from '@/sitio/transcripcion/assemblyai'
import { parrafosDeTranscripcion } from '@/sitio/lib/texto'

const nombres = { entrevistado: 'Técnico de Laureles', programa: 'Conectados' }

describe('armarTranscripcion', () => {
  it('quien más habla es el entrevistado; el resto, el programa; y junta frases seguidas', () => {
    const texto = armarTranscripcion(
      [
        { hablante: 'A', texto: 'Buen día.' },
        { hablante: 'B', texto: 'Hola, gracias por invitarme a la radio.' },
        { hablante: 'B', texto: 'Llegamos muy bien al domingo.' },
        { hablante: 'A', texto: '¿Alguna baja?' },
      ],
      nombres,
    )
    expect(texto).toBe(
      'Conectados: Buen día.\n\nTécnico de Laureles: Hola, gracias por invitarme a la radio. Llegamos muy bien al domingo.\n\nConectados: ¿Alguna baja?',
    )
    // La página lo lee con los mismos nombres
    expect(parrafosDeTranscripcion(texto).map((p) => p.quien)).toEqual([
      'Conectados',
      'Técnico de Laureles',
      'Conectados',
    ])
  })

  it('si habla uno solo, va sin nombres; un turno largo se parte en párrafos', () => {
    const oracion = 'Esta es una oración bastante larga para la prueba de párrafos. '
    const texto = armarTranscripcion([{ hablante: 'A', texto: oracion.repeat(20) }], nombres)
    expect(texto).not.toContain('Técnico de Laureles:')
    const parrafos = texto.split('\n\n')
    expect(parrafos.length).toBeGreaterThan(1)
    for (const p of parrafos) expect(p.length).toBeLessThan(700)
  })

  it('un nombre con puntos o muy largo queda como nombre que la página reconoce', () => {
    const texto = armarTranscripcion(
      [
        { hablante: 'A', texto: 'Pregunta.' },
        { hablante: 'B', texto: 'Una respuesta larga del entrevistado.' },
      ],
      { entrevistado: 'Dr. Juan Pérez', programa: '' },
    )
    expect(parrafosDeTranscripcion(texto).map((p) => p.quien)).toEqual([
      'Visión FM',
      'Dr Juan Pérez',
    ])
  })
})

describe('transcribir', () => {
  const respuesta = (cuerpo: unknown, status = 200) =>
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { 'content-type': 'application/json' },
    })

  it('sube los bytes, pide la transcripción en español con quién habla y espera a que termine', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta({ upload_url: 'https://cdn.assemblyai.prueba/a' }))
      .mockResolvedValueOnce(respuesta({ id: 't1', status: 'queued' }))
      .mockResolvedValueOnce(respuesta({ id: 't1', status: 'processing' }))
      .mockResolvedValueOnce(
        respuesta({
          id: 't1',
          status: 'completed',
          audio_duration: 754.2,
          utterances: [
            { speaker: 'A', text: 'Hola.' },
            { speaker: 'B', text: 'Buen día.' },
          ],
        }),
      )
    const resultado = await transcribir({ datos: new Uint8Array([1, 2, 3]) }, 'clave', {
      espera: 0,
      fetch,
    })

    expect(resultado).toEqual({
      frases: [
        { hablante: 'A', texto: 'Hola.' },
        { hablante: 'B', texto: 'Buen día.' },
      ],
      segundos: 754.2,
    })
    const [urlSubida, subida] = fetch.mock.calls[0]
    expect(urlSubida).toBe('https://api.assemblyai.com/v2/upload')
    expect(subida.headers.authorization).toBe('clave')
    const pedido = JSON.parse(fetch.mock.calls[1][1].body)
    expect(pedido).toEqual({
      audio_url: 'https://cdn.assemblyai.prueba/a',
      language_code: 'es',
      speaker_labels: true,
    })
  })

  it('con una URL firmada no sube nada, y un error del servicio corta con su motivo', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta({ id: 't2', status: 'queued' }))
      .mockResolvedValueOnce(respuesta({ id: 't2', status: 'error', error: 'audio vacío' }))
    await expect(
      transcribir({ url: 'https://r2.prueba/firmada' }, 'clave', { espera: 0, fetch }),
    ).rejects.toThrow('audio vacío')
    expect(JSON.parse(fetch.mock.calls[0][1].body).audio_url).toBe('https://r2.prueba/firmada')
  })

  it('una clave mala corta enseguida', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(respuesta({ error: 'Invalid API key' }, 401))
    await expect(transcribir({ url: 'https://r2.prueba/x' }, 'mala', { fetch })).rejects.toThrow(
      '401: Invalid API key',
    )
  })
})
