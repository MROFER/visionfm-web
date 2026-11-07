import { expect, test } from '@playwright/test'

// La cinta de Institucional lleva el mismo "+" que Noticias y Entrevistas
test('en el celular, el "+" de la cinta de Institucional se va al llegar al final', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/institucional')

  const mas = page.getByRole('button', { name: 'Ver más secciones' })
  await expect(mas).toHaveCSS('opacity', '1')

  const cinta = page.getByRole('navigation', { name: 'Secciones institucionales' })
  await cinta.evaluate((el) => el.scrollTo({ left: el.scrollWidth }))
  await expect(mas).toHaveCSS('opacity', '0')
  await expect(cinta.getByRole('link', { name: 'Contacto' })).toBeInViewport()
})

test('en web la cinta no se desliza y no hay "+"', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/institucional')
  await expect(page.getByRole('button', { name: 'Ver más secciones' })).toBeHidden()
})

// Los años de «Nuestra historia» van más chicos que los títulos de sección (6/11/2026)
test('en web, los años de «Nuestra historia» van en 32 px, más chicos que los títulos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/institucional')
  const historia = page.locator('section[aria-labelledby="titulo-historia"]')
  const anio = historia.locator('ol li > span:not([aria-hidden])').first()
  await expect(anio).toHaveCSS('font-size', '32px')
  await expect(page.locator('#titulo-nosotros')).toHaveCSS('font-size', '40px')
})
