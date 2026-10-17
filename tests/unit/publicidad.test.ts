import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { mesAnterior, sumarDias } from '@/sitio/publicidad/fechas'
import { ctr, pdfReporte, resumirMetricas } from '@/sitio/publicidad/reporte'
import { anunciosPorVencer } from '@/sitio/publicidad/vencimientos'

describe('aviso de vencimiento', () => {
  const hoy = new Date('2026-10-14T13:00:00Z') // 10:00 en Montevideo
  const anuncio = (id: number, hasta: string, activo = true) => ({
    id,
    nombre: `A${id}`,
    anunciante: 'X',
    hasta,
    activo,
  })

  it('avisa los que vencen dentro de exactamente 7 días, en hora de Montevideo', () => {
    const anuncios = [
      anuncio(1, '2026-10-21T12:00:00.000Z'),
      // 21/10 a la 1:00 UTC todavía es 20/10 en Montevideo
      anuncio(2, '2026-10-21T01:00:00.000Z'),
      anuncio(3, '2026-10-22T12:00:00.000Z'),
      anuncio(4, '2026-10-21T12:00:00.000Z', false),
    ]
    expect(anunciosPorVencer(anuncios, hoy).map((a) => a.id)).toEqual([1])
  })

  it('suma días cruzando el fin de mes', () => {
    expect(sumarDias('2026-10-28', 7)).toBe('2026-11-04')
  })
})

describe('reporte mensual', () => {
  it('el mes anterior de enero es diciembre del año pasado', () => {
    expect(mesAnterior(new Date('2026-01-01T11:00:00Z'))).toMatchObject({
      desde: '2025-12-01',
      hasta: '2025-12-31',
    })
  })

  it('el 1 de noviembre a las 1:00 UTC todavía es octubre en Montevideo', () => {
    expect(mesAnterior(new Date('2026-11-01T01:00:00Z')).clave).toBe('2026-09')
  })

  it('suma por anuncio y ubicación', () => {
    const filas = resumirMetricas(
      [{ id: 1, nombre: 'Ferretería' }],
      [
        { anuncio: 1, ubicacion: 'inicio', fecha: '2026-09-01', impresiones: 100, clics: 2 },
        { anuncio: 1, ubicacion: 'inicio', fecha: '2026-09-02', impresiones: 50, clics: 1 },
        { anuncio: 1, ubicacion: 'noticias-nota', fecha: '2026-09-02', impresiones: 300, clics: 6 },
        { anuncio: 9, ubicacion: 'inicio', fecha: '2026-09-02', impresiones: 999, clics: 9 },
      ],
    )
    expect(filas).toEqual([
      { anuncio: 'Ferretería', ubicacion: 'Noticias · Nota', impresiones: 300, clics: 6 },
      { anuncio: 'Ferretería', ubicacion: 'Inicio', impresiones: 150, clics: 3 },
    ])
  })

  it('la tasa de clics no divide por cero', () => {
    expect(ctr(0, 0)).toBe('—')
    expect(ctr(200, 3)).toBe('1,5 %')
  })

  it('genera un PDF válido, también con muchas filas', async () => {
    const filas = Array.from({ length: 60 }, (_, i) => ({
      anuncio: `Anuncio ${i}`,
      ubicacion: 'Inicio',
      impresiones: i,
      clics: 0,
    }))
    const bytes = await pdfReporte({
      anunciante: 'Ferretería Ñandú',
      mes: 'septiembre de 2026',
      filas,
    })
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(2)
  })
})

describe('rotación de anuncios', () => {
  it('elige según el peso', async () => {
    const { elegirAnuncio } = await import('@/sitio/publicidad/rotacion')
    const lista = [
      { id: 1, peso: 1 },
      { id: 2, peso: 3 },
    ]
    // Total 4: [0, 1) es el primero, [1, 4) el segundo
    expect(elegirAnuncio(lista, () => 0.2)?.id).toBe(1)
    expect(elegirAnuncio(lista, () => 0.3)?.id).toBe(2)
    expect(elegirAnuncio(lista, () => 0.99)?.id).toBe(2)
    expect(elegirAnuncio([], () => 0.5)).toBeNull()
    const veces = { 1: 0, 2: 0 }
    for (let i = 0; i < 4000; i++) veces[elegirAnuncio(lista)!.id as 1 | 2]++
    expect(veces[2] / veces[1]).toBeGreaterThan(2.5)
    expect(veces[2] / veces[1]).toBeLessThan(3.5)
  })

  it('vigencia por día, secciones y robots', async () => {
    const { esRobot, estaVigente, vaEnSeccion } = await import('@/sitio/publicidad/rotacion')
    const a = { desde: '2026-10-10T12:00:00.000Z', hasta: '2026-10-16T12:00:00.000Z' }
    expect(estaVigente(a, '2026-10-10')).toBe(true)
    expect(estaVigente(a, '2026-10-16')).toBe(true)
    expect(estaVigente(a, '2026-10-17')).toBe(false)
    expect(estaVigente({ ...a, activo: false }, '2026-10-12')).toBe(false)

    expect(vaEnSeccion(['deportes'], 'noticias-nota', 'deportes')).toBe(true)
    expect(vaEnSeccion(['deportes'], 'noticias-nota', 'politica')).toBe(false)
    expect(vaEnSeccion([], 'noticias-seccion', 'politica')).toBe(true)
    // Fuera de Noticias las secciones no cuentan
    expect(vaEnSeccion(['deportes'], 'inicio', 'politica')).toBe(true)

    expect(esRobot('Mozilla/5.0 (iPhone) Safari/604.1')).toBe(false)
    expect(esRobot('Googlebot/2.1')).toBe(true)
    expect(esRobot('WhatsApp/2.23')).toBe(true)
    expect(esRobot(null)).toBe(true)
  })

  it('tope de impresiones por conexión', async () => {
    const { reiniciarLimiteImpresiones, superaLimiteImpresiones } = await import('@/sitio/publicidad/limite')
    reiniciarLimiteImpresiones()
    const t = 1_000_000
    expect(superaLimiteImpresiones('ip', 59, t)).toBe(false)
    expect(superaLimiteImpresiones('ip', 2, t)).toBe(true)
    expect(superaLimiteImpresiones('ip', 1, t)).toBe(false)
    expect(superaLimiteImpresiones('ip', 1, t + 61_000)).toBe(false)
  })

  it('CSV de métricas para Excel', async () => {
    const { csvMetricas } = await import('@/sitio/publicidad/reporte')
    const csv = csvMetricas([
      { anuncio: 1, ubicacion: 'inicio', fecha: '2026-10-02T12:00:00.000Z', impresiones: 100, clics: 3 },
      { anuncio: 1, ubicacion: 'cinevision', fecha: '2026-10-01T12:00:00.000Z', impresiones: 50, clics: 0 },
    ])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).trimEnd().split('\r\n')).toEqual([
      'Fecha;Ubicación;Impresiones;Clics;CTR',
      '2026-10-01;Cinevisión;50;0;0 %',
      '2026-10-02;Inicio;100;3;3 %',
      'Total;;150;3;2 %',
    ])
  })
})
