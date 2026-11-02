import { expect, test } from '@playwright/test'

// Pie: los grupos del menú en el mismo orden que el encabezado, las redes y los legales.
for (const [nombre, ancho] of [
  ['celular', 390],
  ['web', 1440],
] as const) {
  test(`el pie repite el menú y tiene redes y legales (${nombre})`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 })
    await page.goto('/')
    const pie = page.getByRole('contentinfo')

    const grupos = pie.getByRole('navigation').getByRole('heading', { level: 2 })
    await expect(grupos).toHaveText(['Radio', 'Noticias', 'Cinevisión', 'Institucional'])
    await expect(pie.getByRole('link', { name: 'Publicidad' })).toHaveAttribute(
      'href',
      '/institucional/publicidad',
    )

    // Las otras redes dependen de lo cargado en el panel; el WhatsApp sale del número de la radio
    await expect(pie.getByRole('link', { name: 'WhatsApp de Visión' })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\//,
    )

    const legales = pie.getByRole('navigation', { name: 'Legal' }).getByRole('link')
    await expect(legales).toHaveText(['Aviso legal', 'Privacidad', 'Cookies', 'Condiciones de uso'])
    await expect(pie.getByRole('link', { name: 'Labs Fray Bentos' })).toBeVisible()
  })
}
