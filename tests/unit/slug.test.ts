import { describe, expect, it } from 'vitest'

import { slugify } from '@/base/lib/slug'

describe('slugify', () => {
  it('quita tildes y ñ', () => {
    expect(slugify('Año nuevo en Fray Bentos')).toBe('ano-nuevo-en-fray-bentos')
    expect(slugify('Música y Cinevisión')).toBe('musica-y-cinevision')
  })

  it('reemplaza signos por un solo guion y no deja guiones en los extremos', () => {
    expect(slugify('¡Hoy: partido de Laureles!')).toBe('hoy-partido-de-laureles')
    expect(slugify('  Policiales -- último momento  ')).toBe('policiales-ultimo-momento')
  })
})
