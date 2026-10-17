import { describe, expect, it } from 'vitest'

import { armarTabla, buscar } from '@/base/redirecciones/tabla'

const tabla = armarTabla([
  { desde: '/obras-en-la-rambla/', hacia: '/noticias/locales/obras-en-la-rambla', tipo: '301' },
  { desde: '/año-nuevo/', hacia: '/noticias/locales/ano-nuevo', tipo: '301' },
  { desde: '/1win-plinko/', hacia: null, tipo: '410' },
  { desde: '/promo', hacia: '/radio', tipo: '302' },
  { desde: '/sin-destino/', hacia: '', tipo: '301' },
  { desde: '/bucle/', hacia: '/bucle', tipo: '301' },
])

describe('redirecciones', () => {
  it('encuentra la ruta vieja con o sin barra final', () => {
    const destino = { tipo: '301', hacia: '/noticias/locales/obras-en-la-rambla' }
    expect(buscar(tabla, '/obras-en-la-rambla/')).toEqual(destino)
    expect(buscar(tabla, '/obras-en-la-rambla')).toEqual(destino)
  })

  it('entiende las rutas con tildes como llegan del navegador', () => {
    expect(buscar(tabla, '/a%C3%B1o-nuevo/')).toEqual({
      tipo: '301',
      hacia: '/noticias/locales/ano-nuevo',
    })
  })

  it('devuelve 410 para el spam y 302 cuando se pidió', () => {
    expect(buscar(tabla, '/1win-plinko/')).toEqual({ tipo: '410' })
    expect(buscar(tabla, '/promo/')).toEqual({ tipo: '302', hacia: '/radio' })
  })

  it('ignora las que no tienen destino y las que vuelven a sí mismas', () => {
    expect(buscar(tabla, '/sin-destino/')).toBeNull()
    expect(buscar(tabla, '/bucle/')).toBeNull()
    expect(buscar(tabla, '/noticias')).toBeNull()
  })

  it('no rompe con una ruta mal codificada', () => {
    expect(buscar(tabla, '/%E0%A4%A')).toBeNull()
  })
})
