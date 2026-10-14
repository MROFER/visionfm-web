import { describe, expect, it } from 'vitest'

import { avisoPorCambio, recibeAlInstante, validarTransicion } from '@/sitio/lib/flujo-editorial'

const periodista = { puedePublicar: false, puedeAprobar: false }
const confiable = { puedePublicar: true, puedeAprobar: false }
const editor = { puedePublicar: true, puedeAprobar: true }

describe('flujo editorial', () => {
  it('el periodista envía a revisión pero no publica ni aprueba', () => {
    expect(validarTransicion('borrador', 'en-revision', periodista)).toBeNull()
    expect(validarTransicion('borrador', 'publicada', periodista)).toMatch(/revisión/)
    expect(validarTransicion('en-revision', 'aprobada', periodista)).toMatch(/editor/)
  })

  it('el periodista con Publicar publica sin revisión', () => {
    expect(validarTransicion('borrador', 'publicada', confiable)).toBeNull()
  })

  it('devolver exige ser editor, estar en revisión y un motivo', () => {
    expect(validarTransicion('en-revision', 'devuelta', periodista, 'x')).toMatch(/editor/)
    expect(validarTransicion('borrador', 'devuelta', editor, 'x')).toMatch(/en revisión/)
    expect(validarTransicion('en-revision', 'devuelta', editor, '  ')).toMatch(/motivo/)
    expect(validarTransicion('en-revision', 'devuelta', editor, 'Falta la fuente')).toBeNull()
  })

  it('el autor corrige una devuelta y la reenvía', () => {
    expect(validarTransicion('devuelta', 'en-revision', periodista)).toBeNull()
  })

  it('corregir una publicada sin permiso la deja en revisión, no la despublica', () => {
    expect(validarTransicion('publicada', 'en-revision', periodista)).toBeNull()
  })

  it('avisa a editores al enviar y al autor al devolver o publicar', () => {
    expect(avisoPorCambio('borrador', 'en-revision', 'T')?.para).toBe('editores')
    expect(avisoPorCambio('en-revision', 'devuelta', 'T')?.para).toBe('autor')
    expect(avisoPorCambio('aprobada', 'publicada', 'T')?.para).toBe('autor')
    expect(avisoPorCambio('en-revision', 'en-revision', 'T')).toBeNull()
    expect(avisoPorCambio('en-revision', 'aprobada', 'T')).toBeNull()
  })

  it('al instante es el valor por defecto y los inactivos no reciben', () => {
    expect(recibeAlInstante({ id: 1, email: 'a@b.uy' })).toBe(true)
    expect(recibeAlInstante({ id: 1, email: 'a@b.uy', avisosEmail: 'nunca' })).toBe(false)
    expect(recibeAlInstante({ id: 1, email: 'a@b.uy', activo: false })).toBe(false)
  })
})
