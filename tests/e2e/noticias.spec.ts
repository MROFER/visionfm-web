import { expect, test } from '@playwright/test'

// Noticias en web: sin la caja de la radio al costado y el archivo en tarjetas con foto, titular y bajada.
test('el archivo de Noticias va en tarjetas y no repite la radio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/noticias')

  await expect(
    page.getByRole('main').getByRole('button', { name: 'Escuchar en vivo' }),
  ).toHaveCount(0)

  // Cada tarjeta del archivo: titular y, debajo, la bajada
  const tarjeta = page.getByRole('main').locator('article:has(h3)').first()
  await expect(tarjeta.getByRole('heading', { level: 3 })).toBeVisible()
  await expect(tarjeta.locator('p')).toBeVisible()
})

test('cada nota dice la hora y se comparte con los logos de las redes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/noticias')
  await page.getByRole('main').locator('article h3 a').first().click()
  await expect(page).toHaveURL(/\/noticias\/[a-z0-9-]+\/[a-z0-9-]+$/)

  await expect(page.locator('article header').getByText(/^\d{2}:\d{2} ·$/)).toBeVisible()
  for (const red of ['WhatsApp', 'Facebook', 'X']) {
    await expect(page.getByRole('button', { name: `Compartir en ${red}` })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Copiar enlace' })).toBeVisible()
})

test('en un celular angosto, copiar el enlace queda en un cuadrado con el ícono', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/noticias')
  await page.getByRole('main').locator('article h3 a').first().click()

  // El nombre sigue estando para quien usa lector de pantalla, aunque no se vea
  const copiar = page.getByRole('button', { name: 'Copiar enlace' })
  await expect(copiar).toBeVisible()
  const caja = await copiar.boundingBox()
  expect(caja?.width).toBe(48)
  expect(caja?.height).toBe(48)
})
