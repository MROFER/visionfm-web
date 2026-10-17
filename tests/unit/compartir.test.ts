import { describe, expect, it } from 'vitest'

import { imagenParaCompartir } from '@/sitio/lib/compartir'

const foto = (ancho: number, alto: number) => ({
  url: '/cms-api/medios/file/foto.webp',
  alt: 'Foto',
  ancho,
  alto,
  tamanos: [
    { url: '/cms-api/medios/file/foto-640.webp', ancho: 640 },
    { url: '/cms-api/medios/file/foto-1280.webp', ancho: 1280 },
    { url: '/cms-api/medios/file/foto-1920.webp', ancho: 1920 },
  ],
})

describe('imagenParaCompartir', () => {
  it('usa la original si no es enorme', () => {
    expect(imagenParaCompartir(foto(1600, 900))).toEqual([
      { url: '/cms-api/medios/file/foto.webp', width: 1600, height: 900, alt: 'Foto' },
    ])
  })

  it('de una foto enorme, la versión más grande hasta 1600 px, con su alto', () => {
    expect(imagenParaCompartir(foto(4000, 3000))).toEqual([
      { url: '/cms-api/medios/file/foto-1280.webp', width: 1280, height: 960, alt: 'Foto' },
    ])
  })

  it('si la foto tiene el recorte para compartir, usa ese', () => {
    expect(
      imagenParaCompartir({
        ...foto(4000, 3000),
        compartir: '/cms-api/medios/file/foto-1200x630.jpg',
      }),
    ).toEqual([
      { url: '/cms-api/medios/file/foto-1200x630.jpg', width: 1200, height: 630, alt: 'Foto' },
    ])
  })

  it('un afiche va entero aunque tenga el recorte', () => {
    expect(
      imagenParaCompartir({ ...foto(1000, 1500), compartir: '/x.jpg' }, { recortar: false })[0].url,
    ).toBe('/cms-api/medios/file/foto.webp')
  })

  it('sin foto, la imagen de la radio', () => {
    expect(imagenParaCompartir(null)[0]).toMatchObject({
      url: '/marca/compartir.png',
      width: 1200,
      height: 630,
    })
  })
})
