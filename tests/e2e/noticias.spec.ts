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
