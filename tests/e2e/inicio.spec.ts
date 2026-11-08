import { expect, test } from '@playwright/test'

// En web, a la derecha del título de Cinevisión va solo "Cartelera completa" (7/11/2026)
test('en web, el cine del Inicio no repite «Cartelera del … al …» arriba del botón', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const cine = page.locator('section#cine')
  await expect(cine.getByRole('link', { name: 'Cartelera completa' }).first()).toBeVisible()
  await expect(cine.getByText(/^Cartelera del /)).toHaveCount(0)
})

// El nombre de cada entrevista del Inicio lleva a su página, no al archivo (8/11/2026)
test('en el Inicio, el nombre de cada entrevista lleva a su página', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const enlace = page.locator('section#radio ol li a').first()
  const href = await enlace.getAttribute('href')
  expect(href).toMatch(/^\/radio\/entrevistas\/[a-z0-9-]+$/)
  await enlace.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
