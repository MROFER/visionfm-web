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
