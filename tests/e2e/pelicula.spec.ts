import { expect, test } from '@playwright/test'

// En web, con pocos días de función las pestañas van una al lado de la otra, como en el celular, y no
// repartidas a las dos puntas de la columna (8/11/2026)
test('en web, con pocos días las pestañas de funciones van juntas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/cinevision')
  await page.locator('#cartelera a[href^="/cinevision/"]').first().click()
  await page.waitForURL(/\/cinevision\/[a-z0-9-]+$/)
  const pestanas = page.getByRole('tablist', { name: 'Días de función' }).getByRole('tab')
  await expect(pestanas.first()).toBeVisible()
  const cajas = await pestanas.evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect().toJSON()))
  // Las películas de ejemplo tienen entre 2 y 4 días de función
  expect(cajas.length).toBeGreaterThan(1)
  expect(cajas.length).toBeLessThan(5)
  for (let i = 1; i < cajas.length; i++) {
    expect(cajas[i].left - cajas[i - 1].right).toBeLessThanOrEqual(28)
  }
})
