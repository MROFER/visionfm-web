import { expect, test } from '@playwright/test'

// Menú del celular: cuatro accesos directos y solo Institucional se despliega con "+".
test('el menú del celular va directo a cada página y solo Institucional se despliega', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Menú' }).click()
  const menu = page.locator('#menu-movil')

  for (const [nombre, href] of [
    ['Noticias', '/noticias'],
    ['Programación', '/radio/programacion'],
    ['Entrevistas', '/radio/entrevistas'],
    ['Cinevisión', '/cinevision'],
  ]) {
    await expect(menu.getByRole('link', { name: nombre, exact: true })).toHaveAttribute('href', href)
  }
  await expect(menu.getByRole('button')).toHaveText([/Institucional/])

  await menu.getByRole('button', { name: /Institucional/ }).click()
  await expect(menu.getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/institucional/contacto')

  await menu.getByRole('link', { name: 'Programación', exact: true }).click()
  await expect(page).toHaveURL(/\/radio\/programacion$/)
  await expect(menu).toBeHidden()
})
