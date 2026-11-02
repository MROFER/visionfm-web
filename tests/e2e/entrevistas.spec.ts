import { expect, test } from '@playwright/test'

// Entrevistas: pestañas solo de programas con entrevistas y filtro por mes.
test('las pestañas son de programas con entrevistas y se puede filtrar por mes', async ({
  page,
}) => {
  await page.goto('/radio/entrevistas')

  // Los datos de ejemplo tienen entrevistas en tres programas: no aparecen los 22 de la grilla
  const pestanas = page.getByRole('navigation', { name: 'Programas' }).getByRole('link')
  await expect(pestanas).toHaveCount(4)
  await expect(pestanas.first()).toHaveText('Todos')
  await expect(page.getByRole('link', { name: 'Bocaditos' })).toHaveCount(0)

  const filtro = page.getByLabel('Filtrar por fecha')
  await expect(filtro).toHaveValue('')
  const mes = await filtro.locator('option').nth(1).getAttribute('value')
  await filtro.selectOption(mes!)
  await expect(page).toHaveURL(new RegExp(`mes=${mes}`))
  await expect(page.getByRole('heading', { level: 2, name: /^Entrevistas de / })).toBeVisible()
  await expect(page.locator('ol li').first()).toBeVisible()
})

test('en el celular, el "+" de la cinta de programas se va al llegar al final', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/radio/entrevistas')

  const mas = page.getByRole('button', { name: 'Ver más programas' })
  await expect(mas).toHaveCSS('opacity', '1')

  const cinta = page.getByRole('navigation', { name: 'Programas' })
  await cinta.evaluate((el) => el.scrollTo({ left: el.scrollWidth }))
  await expect(mas).toHaveCSS('opacity', '0')

  await cinta.evaluate((el) => el.scrollTo({ left: 0 }))
  await expect(mas).toHaveCSS('opacity', '1')
})
