import { expect, test } from '@playwright/test'

// Las notas del archivo, debajo de la destacada
const ARCHIVO = 'main div.md\\:grid > article img'

// Archivo de Noticias en el celular: la foto chica a la derecha es 4:3 (128×96), no cuadrada
test('en el celular, las fotos del archivo son de 128×96', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/noticias')
  const foto = page.locator(ARCHIVO).first()
  await expect(foto).toBeVisible()
  const caja = (await foto.boundingBox())!
  expect([Math.round(caja.width), Math.round(caja.height)]).toEqual([128, 96])
})

test('en web siguen siendo 16:9 arriba de cada nota', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/noticias')
  const caja = (await page.locator(ARCHIVO).first().boundingBox())!
  expect(caja.width / caja.height).toBeCloseTo(16 / 9, 1)
})
