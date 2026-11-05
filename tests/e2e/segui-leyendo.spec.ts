import { expect, test, type Page } from '@playwright/test'

// «Seguí leyendo» usa las mismas tarjetas que el archivo de Noticias, y la foto de la nota en el celular
// tiene la proporción de la destacada (16:10).
const NOTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

const fotos = (page: Page) => page.locator('section[aria-labelledby="segui-leyendo"] article img')

const medidas = async (page: Page) => {
  const caja = (await fotos(page).first().boundingBox())!
  return [Math.round(caja.width), Math.round(caja.height)]
}

test('en web, las tarjetas son las del archivo: foto 16:9, título, texto y fecha', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(NOTA)
  const tarjetas = page.locator('section[aria-labelledby="segui-leyendo"] article')
  await expect(tarjetas).toHaveCount(3)
  const [ancho, alto] = await medidas(page)
  expect(Math.abs(ancho / alto - 16 / 9)).toBeLessThan(0.02)
  await expect(tarjetas.first().locator('p')).toBeVisible()
})

test('en el celular, cada tarjeta lleva la foto 4:3 a la derecha', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(NOTA)
  expect(await medidas(page)).toEqual([128, 96])
  const tarjeta = page.locator('section[aria-labelledby="segui-leyendo"] article').first()
  const titulo = (await tarjeta.locator('h3').boundingBox())!
  const foto = (await fotos(page).first().boundingBox())!
  expect(foto.x).toBeGreaterThan(titulo.x + titulo.width - 1)
})

test('en el celular, la foto de la nota es 16:10', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(NOTA)
  const caja = (await page.locator('article figure').first().locator('img').boundingBox())!
  expect(Math.round(caja.width)).toBe(390)
  expect(Math.abs(caja.width / caja.height - 1.6)).toBeLessThan(0.02)
})
