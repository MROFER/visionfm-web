import { expect, test, type Locator, type Page } from '@playwright/test'

// Formatos de la publicidad del final de la nota (docs/07-permisos-y-publicidad.md, sección 3). Los
// anuncios se simulan: la lista que devuelve /api/anuncios y sus imágenes.
const NOTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

const imagen = (ancho: number, alto: number) => ({
  url: `/prueba-anuncio/${ancho}x${alto}.svg`,
  alt: 'Anuncio de prueba',
  ancho,
  alto,
  tamanos: [],
})
const anuncio = (id: number, formato: 'tira' | 'cuadrado' | 'ancho') => ({
  id,
  peso: 1,
  formato,
  web: imagen(970, 90),
  movil: imagen(320, 100),
  rectangulo: formato === 'cuadrado' ? imagen(300, 250) : null,
  ancha: formato === 'ancho' ? imagen(970, 250) : null,
})

async function conAnuncios(page: Page, anuncios: ReturnType<typeof anuncio>[]) {
  await page.route(
    (url) => url.pathname === '/api/anuncios' && url.searchParams.get('ubicacion') === 'noticias-nota-abajo',
    (route) => route.fulfill({ json: { anuncios } }),
  )
  await page.route('**/prueba-anuncio/*.svg', (route) => {
    const [ancho, alto] = route.request().url().match(/(\d+)x(\d+)\.svg$/)!.slice(1)
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="100%" height="100%" fill="#0b6"/></svg>`,
    })
  })
  await page.goto(NOTA)
  return page.getByRole('complementary', { name: 'Publicidad' }).last()
}

const medidas = async (imagenes: Locator) =>
  imagenes.evaluateAll((els) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .map((e) => `${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
  )

test('en web, los cuadrados van de a tres y el lugar que falta lo llena el aviso propio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const aviso = await conAnuncios(page, [anuncio(1, 'cuadrado'), anuncio(2, 'cuadrado'), anuncio(3, 'tira')])
  // Puede salir la tira: se recarga hasta que sale un cuadrado, esperando cada vez a que lleguen los anuncios
  const elegido = async () => {
    await expect(aviso.locator('a[href^="/a/"]:visible').first()).toBeVisible()
    return aviso.locator('a[href^="/a/3"]').count()
  }
  for (let i = 0; i < 20 && (await elegido()) > 0; i++) await page.reload()

  const enlaces = aviso.locator('a[href^="/a/"]:visible')
  await expect(enlaces).toHaveCount(2)
  const ids = (await enlaces.evaluateAll((as) => as.map((a) => a.getAttribute('href')!.split('?')[0]))).sort()
  expect(ids).toEqual(['/a/1', '/a/2'])
  await expect(aviso.getByRole('link', { name: 'Anunciá en Visión' })).toBeVisible()
  expect(await medidas(aviso.locator('[data-aviso] img'))).toEqual(['300×250', '300×250'])
})

test('en tablet entran dos cuadrados', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 })
  const aviso = await conAnuncios(page, [anuncio(1, 'cuadrado'), anuncio(2, 'cuadrado')])
  await expect(aviso.locator('a[href^="/a/"]:visible')).toHaveCount(2)
  await expect(aviso.getByRole('link', { name: 'Anunciá en Visión' })).toBeHidden()
})

test('el ancho sale de 970×250 en web y de 320×100 en el celular', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const aviso = await conAnuncios(page, [anuncio(5, 'ancho')])
  const enlace = aviso.locator('a[href^="/a/5"]:visible')
  await expect(enlace).toHaveCount(1)
  const caja = (await enlace.locator('img').boundingBox())!
  expect([Math.round(caja.width), Math.round(caja.height)]).toEqual([970, 250])

  await page.setViewportSize({ width: 390, height: 844 })
  const movil = (await aviso.locator('a[href^="/a/5"]:visible img').boundingBox())!
  expect([Math.round(movil.width), Math.round(movil.height)]).toEqual([320, 100])
})

test('en el celular el cuadrado sale de 300×250', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const aviso = await conAnuncios(page, [anuncio(1, 'cuadrado')])
  const caja = (await aviso.locator('a[href^="/a/1"]:visible img').boundingBox())!
  expect([Math.round(caja.width), Math.round(caja.height)]).toEqual([300, 250])
})
