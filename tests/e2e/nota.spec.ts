import { expect, test } from '@playwright/test'

// La nota de ejemplo trae una foto en el medio del texto y una galería de tres fotos
const NOTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

test('la foto del medio del texto lleva su epígrafe', async ({ page }) => {
  await page.goto(NOTA)
  await expect(page.locator('.cuerpo-nota figure > figcaption').first()).toContainText(
    'Las columnas nuevas, en el tramo del muelle.',
  )
})

test('la galería se pasa con las flechas y cambia el epígrafe', async ({ page }) => {
  await page.goto(NOTA)
  const galeria = page.getByRole('group', { name: 'Galería de 3 fotos' })
  await expect(galeria.getByText('1 / 3', { exact: true })).toBeVisible()
  await expect(galeria.getByRole('button', { name: 'Foto anterior' })).toBeDisabled()

  await galeria.getByRole('button', { name: 'Foto siguiente' }).click()
  await expect(galeria.getByText('2 / 3', { exact: true })).toBeVisible()
  await expect(galeria.locator('figcaption')).toContainText('La costanera con las luminarias nuevas.')

  await galeria.getByRole('button', { name: 'Foto siguiente' }).click()
  await expect(galeria.getByText('3 / 3', { exact: true })).toBeVisible()
  await expect(galeria.getByRole('button', { name: 'Foto siguiente' })).toBeDisabled()
})
