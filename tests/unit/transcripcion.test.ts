import { describe, expect, it } from 'vitest'

import { parrafosDeTranscripcion } from '@/sitio/lib/texto'
import { entrevista } from '@/sitio/seo/estructurados'

describe('parrafosDeTranscripcion', () => {
  it('separa por línea en blanco y reconoce quién habla', () => {
    expect(
      parrafosDeTranscripcion(
        'Conectados: Buen día.\r\n\r\nAna Pérez: Hola,\ngracias.\n\n \nLo que más les preocupa a los vecinos del barrio es esto: la luz.\n\nBuen día. Mirá: así no se puede.',
      ),
    ).toEqual([
      { quien: 'Conectados', dice: 'Buen día.' },
      { quien: 'Ana Pérez', dice: 'Hola,\ngracias.' },
      {
        quien: '',
        dice: 'Lo que más les preocupa a los vecinos del barrio es esto: la luz.',
      },
      { quien: '', dice: 'Buen día. Mirá: así no se puede.' },
    ])
  })

  it('sin texto no hay párrafos', () => {
    expect(parrafosDeTranscripcion('  \n\n ')).toEqual([])
  })
})

describe('entrevista', () => {
  const base = {
    slug: 'tecnico-de-laureles',
    entrevistado: 'Técnico de Laureles',
    tema: 'La previa del clásico',
    resumen: 'Cómo llega el plantel.',
    fecha: '2026-11-01T12:00:00.000Z',
    duracion: 754,
    programa: { nombre: 'Conectados', slug: 'conectados' },
    foto: null,
    audio: '/api/entrevistas/tecnico-de-laureles/audio',
    transcripcion: 'Conectados: Buen día.',
  }

  it('es un episodio de su programa, con el audio y la transcripción', () => {
    expect(entrevista('https://visionfm.prueba', base)).toMatchObject({
      '@type': 'RadioEpisode',
      name: 'Técnico de Laureles: La previa del clásico',
      url: 'https://visionfm.prueba/radio/entrevistas/tecnico-de-laureles',
      partOfSeries: { '@type': 'RadioSeries', name: 'Conectados' },
      audio: {
        '@type': 'AudioObject',
        contentUrl: 'https://visionfm.prueba/api/entrevistas/tecnico-de-laureles/audio',
        duration: 'PT754S',
        transcript: 'Conectados: Buen día.',
      },
    })
  })

  it('sin programa ni transcripción no inventa esos datos', () => {
    const nodo = entrevista('https://visionfm.prueba', {
      ...base,
      programa: null,
      transcripcion: '',
    })
    expect(nodo).not.toHaveProperty('partOfSeries')
    expect(nodo.audio).not.toHaveProperty('transcript')
  })
})
