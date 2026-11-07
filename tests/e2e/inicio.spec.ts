import { expect, test } from '@playwright/test'

// En web, a la derecha del título de Cinevisión va solo "Cartelera completa" (7/11/2026)
test('en web, el cine del Inicio no repite «Cartelera del … al …» arriba del botón', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const cine = page.locator('section#cine')
  await expect(cine.getByRole('link', { name: 'Cartelera completa' }).first()).toBeVisible()
  await expect(cine.getByText(/^Cartelera del /)).toHaveCount(0)
})
