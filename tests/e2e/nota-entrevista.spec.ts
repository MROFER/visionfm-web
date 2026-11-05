import { expect, test } from '@playwright/test'

// La primera nota de ejemplo lleva una entrevista de la radio: su reproductor va arriba del texto
const NOTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

test('la entrevista de la nota se escucha arriba del texto y lleva a su página', async ({ page }) => {
  await page.goto(NOTA)

  const caja = page.getByRole('complementary', { name: 'Entrevista de la nota' })
  await expect(caja).toContainText('Escuchá la entrevista')
  await expect(caja.getByRole('button', { name: /^Escuchar la entrevista a / })).toBeVisible()
  await expect(caja.getByRole('link')).toHaveAttribute('href', /^\/radio\/entrevistas\/[a-z0-9-]+$/)

  // Va antes del primer párrafo
  const antes = await caja.evaluate((c) => {
    const p = document.querySelector('.cuerpo-nota p')
    return Boolean(p && c.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(antes).toBe(true)
})

test('una nota sin entrevista no muestra el reproductor', async ({ page }) => {
  await page.goto('/noticias')
  // Cualquier otra nota del listado
  const href = await page.evaluate(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('main a[href^="/noticias/"]')]
      .map((a) => a.getAttribute('href')!)
      .filter((h) => h.split('/').length === 4 && !h.includes('la-rambla-suma'))
    return links[0]
  })
  await page.goto(href)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Entrevista de la nota' })).toHaveCount(0)
})
