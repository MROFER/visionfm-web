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

// En el celular, las noticias chicas del Inicio usan la foto 4:3 de la sección Noticias y "Todas las
// entrevistas" es el mismo botón oscuro que "Todas las noticias" (8/11/2026)
test('en el celular, las noticias chicas van en 128×96 y Todas las entrevistas es un botón', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const fotos = page.locator('article a[tabindex="-1"] > *').filter({ visible: true })
  const cajas = await fotos.evaluateAll((els) => els.slice(1).map((e) => e.getBoundingClientRect().toJSON()))
  expect(cajas.length).toBeGreaterThan(0)
  for (const c of cajas.slice(0, 4)) {
    expect(c.width).toBe(128)
    expect(c.height).toBe(96)
  }
  const fondo = (nombre: RegExp) =>
    page.getByRole('link', { name: nombre }).filter({ visible: true }).evaluate((a) => getComputedStyle(a).backgroundColor)
  expect(await fondo(/^Todas las entrevistas/)).toBe(await fondo(/^Todas las noticias/))
})
