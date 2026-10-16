import { describe, expect, it } from 'vitest'

import { errorAdjunto, validarCampo, validarFormulario } from '@/sitio/formularios/campos'
import { ENVIOS_POR_HORA, reiniciarLimite, superaLimite } from '@/sitio/formularios/servidor'

const contacto = { nombre: ' Ana ', email: 'Ana@Ejemplo.com', motivo: 'noticia', mensaje: 'Hola', consentimiento: 'si' }

describe('validación de formularios', () => {
  it('acepta un contacto completo y separa los campos propios', () => {
    const r = validarFormulario('contacto', contacto)
    expect(r).toEqual({
      ok: true,
      datos: { nombre: 'Ana', email: 'ana@ejemplo.com', mensaje: 'Hola', extra: { motivo: 'noticia' } },
    })
  })

  it('pide el consentimiento y avisa cada campo que falta', () => {
    const r = validarFormulario('contacto', { ...contacto, nombre: '', email: 'ana@', consentimiento: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errores).sort()).toEqual(['consentimiento', 'email', 'nombre'])
  })

  it('rechaza opciones que no están en la lista', () => {
    expect(validarCampo('contacto', 'motivo', 'cualquiera')).toBe('Elegí una de las opciones.')
    expect(validarCampo('sumarse', 'areas', ['conduccion', 'otra'])).toBe('Elegí una de las opciones.')
  })

  it('Sumarse pide al menos un área; Tarifas, dónde anunciar', () => {
    expect(validarCampo('sumarse', 'areas', [])).toBe('Elegí al menos una opción.')
    expect(validarCampo('tarifas', 'donde', [])).toBe('Elegí dónde querés anunciar.')
    const r = validarFormulario('tarifas', {
      donde: ['radio', 'cine'],
      empresa: 'Panadería',
      nombre: 'Luis',
      email: 'luis@ejemplo.uy',
      telefono: '099 123 456',
      presupuesto: 'a-definir',
      plazo: 'ya',
      consentimiento: 'si',
    })
    expect(r.ok && r.datos.extra).toEqual({ donde: ['radio', 'cine'], empresa: 'Panadería', presupuesto: 'a-definir', plazo: 'ya' })
  })

  it('revisa el formato de teléfono y link', () => {
    expect(validarCampo('sumarse', 'telefono', 'llamame')).toMatch(/teléfono/)
    expect(validarCampo('sumarse', 'link', 'instagram.com/ana')).toBeNull()
    expect(validarCampo('sumarse', 'link', 'no es un link')).toBe('Revisá el link.')
  })

  it('limita tipo y tamaño del adjunto a 10 MB', () => {
    expect(errorAdjunto({ size: 2_000_000, type: 'application/pdf' })).toBeNull()
    expect(errorAdjunto({ size: 11 * 1024 * 1024, type: 'image/jpeg' })).toMatch(/máximo es 10 MB/)
    expect(errorAdjunto({ size: 100, type: 'application/x-msdownload' })).toMatch(/no se puede adjuntar/)
    expect(errorAdjunto({ size: 0, type: '' })).toBeNull()
  })
})

describe('límite por IP', () => {
  it(`deja ${ENVIOS_POR_HORA} envíos por hora y después corta`, () => {
    reiniciarLimite()
    const ahora = Date.now()
    for (let i = 0; i < ENVIOS_POR_HORA; i++) expect(superaLimite('1.2.3.4', ahora + i)).toBe(false)
    expect(superaLimite('1.2.3.4', ahora + 10)).toBe(true)
    expect(superaLimite('5.6.7.8', ahora + 10)).toBe(false)
    expect(superaLimite('1.2.3.4', ahora + 60 * 60 * 1000 + 1)).toBe(false)
  })
})
