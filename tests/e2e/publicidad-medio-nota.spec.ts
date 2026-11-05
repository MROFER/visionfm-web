import { expect, test, type Page } from '@playwright/test'

// Publicidad en el medio de la nota (docs/07-permisos-y-publicidad.md, sección 3): solo en notas de 6
// párrafos o más, después del párrafo de la mitad. Cuadrada si el anuncio tiene la imagen de 300×250 y,
// si no, la tira. Los anuncios se simulan: la lista que devuelve /api/anuncios y sus imágenes.
const LARGA = '/noticias/opinion/que-nos-dice-el-anglo-sobre-el-futuro-de-la-ciudad'
const CORTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

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

async function conAnuncio(page: Page, cuadrado: boolean) {
  await page.route(
    (url) => url.pathname === '/api/anuncios' && url.searchParams.get('ubicacion') === 'noticias-nota-medio',
    (route) => route.fulfill({ json: { anuncios: [anuncio(7, cuadrado)] } }),
  )
  await page.route('**/prueba-anuncio/*.svg', (route) => {
    const [ancho, alto] = route.request().url().match(/(\d+)x(\d+)\.svg$/)!.slice(1)
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="100%" height="100%" fill="#0b6"/></svg>`,
    })
  })
  await page.goto(LARGA)
  return page.locator('.cuerpo-nota').getByRole('complementary', { name: 'Publicidad' })
}

const medida = async (page: Page) => {
  const caja = (await page.locator('.cuerpo-nota a[href^="/a/7"]:visible img').boundingBox())!
  return `${Math.round(caja.width)}×${Math.round(caja.height)}`
}

test('va después del cuarto de los ocho párrafos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const aviso = await conAnuncio(page, true)
  await expect(aviso).toHaveCount(1)
  const parrafos = page.locator('.cuerpo-nota p')
  await expect(parrafos).toHaveCount(8)
  const arriba = (await parrafos.nth(3).boundingBox())!
  const abajo = (await parrafos.nth(4).boundingBox())!
  const caja = (await aviso.boundingBox())!
  expect(caja.y).toBeGreaterThan(arriba.y + arriba.height)
  expect(caja.y + caja.height).toBeLessThan(abajo.y)
})

test('con la imagen cuadrada sale de 300×250 en web y en el celular', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await conAnuncio(page, true)
  expect(await medida(page)).toBe('300×250')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await medida(page)).toBe('300×250')
})

test('sin la imagen cuadrada sale la tira, al ancho del texto en web', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await conAnuncio(page, false)
  const texto = (await page.locator('.cuerpo-nota p').first().boundingBox())!
  await expect.poll(() => medida(page)).toBe(`${Math.round(texto.width)}×${Math.round((texto.width * 90) / 970)}`)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await medida(page)).toBe('320×100')
})

test('una nota corta no la lleva', async ({ page }) => {
  await page.goto(CORTA)
  await expect(page.locator('.cuerpo-nota p').first()).toBeVisible()
  await expect(page.locator('.cuerpo-nota').getByRole('complementary', { name: 'Publicidad' })).toHaveCount(0)
})
