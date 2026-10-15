import { describe, expect, it } from 'vitest'

import { choquesCon, seSuperponen, validarHorario } from '@/sitio/lib/grilla'

describe('grilla', () => {
  it('detecta superposición el mismo día', () => {
    expect(seSuperponen({ dias: ['lun'], inicio: '07:00', fin: '09:00' }, { dias: ['lun', 'mar'], inicio: '08:30', fin: '10:00' })).toBe(true)
  })

  it('no cuenta los programas que se tocan en el borde', () => {
    expect(seSuperponen({ dias: ['lun'], inicio: '07:00', fin: '09:00' }, { dias: ['lun'], inicio: '09:00', fin: '10:00' })).toBe(false)
  })

  it('no cuenta días distintos', () => {
    expect(seSuperponen({ dias: ['sab'], inicio: '07:00', fin: '09:00' }, { dias: ['dom'], inicio: '07:00', fin: '09:00' })).toBe(false)
  })

  it('trata 00:00 como fin de día', () => {
    expect(seSuperponen({ dias: ['vie'], inicio: '22:00', fin: '00:00' }, { dias: ['vie'], inicio: '23:00', fin: '23:30' })).toBe(true)
    expect(validarHorario({ dias: ['vie'], inicio: '22:00', fin: '00:00' })).toBeNull()
  })

  it('rechaza horas mal escritas o al revés', () => {
    expect(validarHorario({ dias: ['lun'], inicio: '7:00', fin: '09:00' })).toMatch(/HH:MM/)
    expect(validarHorario({ dias: ['lun'], inicio: '10:00', fin: '09:00' })).toMatch(/medianoche/)
    expect(validarHorario({ dias: [], inicio: '07:00', fin: '09:00' })).toMatch(/día/)
  })

  it('nombra los programas que chocan', () => {
    const otros = [
      { nombre: 'La mañana', horarios: [{ dias: ['lun' as const], inicio: '06:00', fin: '09:00' }] },
      { nombre: 'Deportiva', horarios: [{ dias: ['sab' as const], inicio: '15:00', fin: '18:00' }] },
    ]
    expect(choquesCon([{ dias: ['lun'], inicio: '08:00', fin: '10:00' }], otros)).toEqual(['La mañana'])
  })
})
