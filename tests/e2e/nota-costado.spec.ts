import { expect, test, type Page } from '@playwright/test'

// Nota en web con la columna del costado (5/11/2026): desde 1280 px el bloque de la nota va a la
// izquierda, a los márgenes del sitio, con la foto al ancho del título, y a la derecha dos cuadrados de
// «Noticias · Nota · Costado» (docs/07-permisos-y-publicidad.md, sección 3). Los anuncios se simulan.
const NOTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

const imagen = (ancho: number, alto: number) => ({
  url: `/prueba-anuncio/${ancho}x${alto}.svg`,
  alt: 'Anuncio de prueba',
  ancho,
  alto,
  tamanos: [],
})
const anuncio = (id: number, cuadrado: boolean) => ({
  id,
  peso: 1,
  formato: 'tira',
  web: imagen(970, 90),
  movil: imagen(320, 100),
  rectangulo: cuadrado ? imagen(300, 250) : null,
  ancha: null,
})

async function conAnuncios(page: Page, anuncios: ReturnType<typeof anuncio>[]) {
  await page.route(
    (url) =>
      url.pathname === '/api/anuncios' &&
      url.searchParams.get('ubicacion') === 'noticias-nota-costado',
    (route) => route.fulfill({ json: { anuncios } }),
  )
  await page.route('**/prueba-anuncio/*.svg', (route) => {
    const [ancho, alto] = route
      .request()
      .url()
      .match(/(\d+)x(\d+)\.svg$/)!
      .slice(1)
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="100%" height="100%" fill="#0b6"/></svg>`,
    })
  })
  await page.goto(NOTA)
  return page.locator('aside[data-ubicacion="noticias-nota-costado"]')
}

const caja = async (page: Page, selector: string) =>
  (await page.locator(selector).first().boundingBox())!

test('en web, el bloque y el costado van a los márgenes de «Seguí leyendo»', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const costado = await conAnuncios(page, [])
  await expect(costado).toBeVisible()
  const linea = await caja(page, '#segui-leyendo')
  const titulo = await caja(page, 'article h1')
  const columna = (await costado.boundingBox())!
  expect(Math.round(titulo.x)).toBe(Math.round(linea.x))
  expect(Math.round(columna.x + columna.width)).toBe(Math.round(linea.x + linea.width))
  expect(Math.round(columna.width)).toBe(300)
})

test('en web, la foto va al ancho del título, en 16:10, y el texto con su sangría de siempre', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(NOTA)
  const encabezado = await caja(page, 'article header')
  const foto = await caja(page, 'article figure img')
  const parrafo = await caja(page, '.cuerpo-nota p')
  expect(Math.round(encabezado.width)).toBe(780)
  expect(Math.round(foto.x)).toBe(Math.round(encabezado.x))
  expect(Math.round(foto.width)).toBe(780)
  expect(Math.round(foto.height)).toBe(Math.round((780 * 10) / 16))
  expect(Math.round(parrafo.x - encabezado.x)).toBe(50)
  expect(Math.round(parrafo.width)).toBe(680)
})

test('van dos cuadrados distintos, solo de anuncios con la imagen de 300×250', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const costado = await conAnuncios(page, [anuncio(1, true), anuncio(2, true), anuncio(3, false)])
  const enlaces = costado.locator('a[href^="/a/"]')
  await expect(enlaces).toHaveCount(2)
  const ids = (
    await enlaces.evaluateAll((as) => as.map((a) => a.getAttribute('href')!.split('?')[0]))
  ).sort()
  expect(ids).toEqual(['/a/1', '/a/2'])
  for (const img of await costado.locator('img').all()) {
    const b = (await img.boundingBox())!
    expect(`${Math.round(b.width)}×${Math.round(b.height)}`).toBe('300×250')
  }
})

test('el lugar que falta lo llena el aviso propio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const costado = await conAnuncios(page, [anuncio(1, true)])
  await expect(costado.locator('a[href^="/a/1"]')).toHaveCount(1)
  await expect(costado.getByRole('link', { name: 'Anunciá en Visión' })).toHaveCount(1)
})

for (const [nombre, ancho] of [
  ['la tablet', 1024],
  ['el celular', 390],
] as const) {
  test(`en ${nombre} no aparece y la nota sigue centrada`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 })
    const costado = await conAnuncios(page, [anuncio(1, true)])
    await expect(page.locator('article h1')).toBeVisible()
    await expect(costado).toBeHidden()
    const titulo = await caja(page, 'article h1')
    const enDerecha = ancho - (titulo.x + titulo.width)
    expect(Math.abs(titulo.x - enDerecha)).toBeLessThan(ancho > 800 ? 80 : 40)
  })
}
