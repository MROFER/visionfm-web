import { describe, expect, it } from 'vitest'

import { silencioMp3 } from '@/seed/imagenes'
import { puedeSembrar } from '@/seed/permitido'

describe('pnpm seed', () => {
  it('corre en local, staging y la demo', () => {
    for (const url of [
      'http://localhost:3000',
      'https://visionfm-labs-staging.fraybentos.uy',
      'https://visionfm-labs.fraybentos.uy',
      'https://staging.visionfm.com.uy',
    ]) {
      expect(puedeSembrar(url), url).toEqual({ ok: true })
    }
  })

  it('nunca en producción ni sin saber el entorno', () => {
    for (const url of [
      'https://visionfm.com.uy',
      'https://www.visionfm.com.uy',
      undefined,
      'no-es-url',
    ]) {
      expect(puedeSembrar(url).ok, String(url)).toBe(false)
    }
  })

  it('el audio de ejemplo empieza con un encabezado MP3', () => {
    const mp3 = silencioMp3(1)
    expect([...mp3.subarray(0, 2)]).toEqual([0xff, 0xfb])
    expect(mp3.length % 417).toBe(0)
  })
})
