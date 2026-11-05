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
