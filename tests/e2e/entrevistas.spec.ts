import { expect, test } from '@playwright/test'

// Entrevistas: pestañas solo de programas con entrevistas y filtro por fechas.
test('las pestañas son de programas con entrevistas', async ({ page }) => {
  await page.goto('/radio/entrevistas')

  // Los datos de ejemplo tienen entrevistas en tres programas: no aparecen los 22 de la grilla
  const pestanas = page.getByRole('navigation', { name: 'Programas' }).getByRole('link')
  await expect(pestanas).toHaveCount(4)
  await expect(pestanas.first()).toHaveText('Todos')
  await expect(page.getByRole('link', { name: 'Bocaditos' })).toHaveCount(0)
})

test('se filtra por un rango de fechas y se quita con la cruz', async ({ page }) => {
  await page.goto('/radio/entrevistas')

  await page.getByRole('button', { name: 'Filtrar por fecha' }).click()
  const panel = page.getByRole('dialog', { name: 'Filtrar por fecha' })
  // Las tres entrevistas de ejemplo son de los últimos días
  await panel.getByRole('radio', { name: /^Últimos 3 meses/ }).click()
  await panel.getByRole('button', { name: 'Ver 3 entrevistas' }).click()

  await expect(page).toHaveURL(/desde=\d{4}-\d{2}-\d{2}&hasta=\d{4}-\d{2}-\d{2}/)
  await expect(page.getByRole('heading', { level: 2, name: /^Entrevistas del / })).toBeVisible()
  await expect(page.locator('ol li')).toHaveCount(3)

  await page.getByRole('button', { name: 'Quitar el filtro por fecha' }).click()
  await expect(page).not.toHaveURL(/desde=/)
  await expect(page.getByRole('heading', { level: 2, name: 'Todas las entrevistas' })).toBeVisible()
})

test('en el celular se eligen las dos fechas a mano y el botón dice cuántas hay', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/radio/entrevistas')
  await page.getByRole('button', { name: 'Filtrar por fecha' }).click()
  const panel = page.getByRole('dialog', { name: 'Filtrar por fecha' })

  await panel.getByRole('radio', { name: 'Elegir las fechas' }).click()
  await expect(panel.getByRole('button', { name: 'Elegí las dos fechas' })).toBeDisabled()

  // Hoy no hay entrevistas en los datos de ejemplo; en la última semana, las tres
  const dia = (atras: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo' }).format(
      new Date(Date.now() - atras * 86_400_000),
    )
  await panel.getByLabel('Desde').fill(dia(0))
  await panel.getByLabel('Hasta').fill(dia(0))
  await expect(panel.getByRole('button', { name: 'Sin entrevistas en esas fechas' })).toBeDisabled()
  // Al revés también vale: se dan vuelta
  await panel.getByLabel('Desde').fill(dia(0))
  await panel.getByLabel('Hasta').fill(dia(7))
  await expect(panel.getByRole('button', { name: 'Ver 3 entrevistas' })).toBeEnabled()

  await panel.getByRole('button', { name: 'Borrar' }).click()
  await expect(panel.getByRole('button', { name: 'Ver todas las entrevistas' })).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
})

test('las direcciones viejas del filtro por mes siguen andando', async ({ page }) => {
  await page.goto('/radio/entrevistas?mes=2026-10')
  await expect(
    page.getByRole('heading', { level: 2, name: /^Entrevistas del 1 al 31 de octubre/ }),
  ).toBeVisible()
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

test('cada entrevista tiene su página, con el reproductor y más entrevistas', async ({ page }) => {
  await page.goto('/radio/entrevistas')
  const titulo = page.locator('ol li a').first()
  const texto = (await titulo.textContent())!.trim()
  await titulo.click()

  await expect(page).toHaveURL(/\/radio\/entrevistas\/[a-z0-9-]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(texto)
  await expect(
    page.getByRole('button', { name: /^Escuchar la entrevista a / }).first(),
  ).toBeVisible()
  await expect(page.getByRole('complementary').getByRole('link').first()).toBeVisible()
  await expect(page.getByRole('link', { name: '← Todas las entrevistas' })).toHaveAttribute(
    'href',
    '/radio/entrevistas',
  )
})
