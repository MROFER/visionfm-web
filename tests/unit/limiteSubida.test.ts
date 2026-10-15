import { describe, expect, it } from 'vitest'

import { LIMITE_GLOBAL, MB, maximoPara } from '@/base/lib/limiteSubida'

describe('límite de subida por tipo', () => {
  const reglas = [
    { prefijo: 'audio/', maximo: 90 * MB },
    { prefijo: '', maximo: 10 * MB },
  ]

  it('usa la primera regla cuyo prefijo coincide', () => {
    expect(maximoPara(reglas, 'audio/mpeg')).toBe(90 * MB)
    expect(maximoPara(reglas, 'application/pdf')).toBe(10 * MB)
  })

  it('sin regla aplicable queda el tope global', () => {
    expect(maximoPara([{ prefijo: 'image/', maximo: 15 * MB }], 'video/mp4')).toBe(LIMITE_GLOBAL)
  })
})
