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

// Tu música: la puerta de los artistas, entre Ser parte y Publicidad, con su propia página (8/11/2026)
test('Tu música va entre Ser parte y Publicidad y lleva a su formulario', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/institucional')
  const cinta = page.getByRole('navigation', { name: 'Secciones institucionales' })
  await expect(cinta.getByRole('link')).toHaveText(['Quiénes somos', 'Equipo', 'Ser parte', 'Tu música', 'Publicidad', 'Contacto'])
  const ids = await page.locator('main section[id]').evaluateAll((s) => s.map((x) => x.id))
  expect(ids.indexOf('musica')).toBe(ids.indexOf('ser-parte') + 1)
  expect(ids.indexOf('publicidad')).toBe(ids.indexOf('musica') + 1)

  await page.locator('#musica').getByRole('link', { name: 'Enviar mi música →' }).click()
  await expect(page).toHaveURL(/\/institucional\/musica$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Enviá tu música' })).toBeVisible()
})

test('el formulario de música pide el link para escucharla y la autorización', async ({ page }) => {
  await page.goto('/institucional/musica')
  await page.getByRole('button', { name: 'Enviar mi música →' }).click()
  await expect(page.getByText('Pegá un link para escuchar tu música.')).toBeVisible()
  await expect(page.getByText('Para enviar, confirmá que podés compartir este material.')).toBeVisible()
})

// Quiero sumarme, Pedir tarifas y Escribinos son el mismo botón: oscuro y naranja con el mouse (8/11/2026)
test('en Institucional, los botones de Ser parte, Publicidad y Contacto son iguales', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/institucional')
  const fondo = (nombre: string) =>
    page
      .getByRole('link', { name: nombre })
      .filter({ visible: true })
      .evaluate((a) => getComputedStyle(a).backgroundColor)
  const sumarme = await fondo('Quiero sumarme →')
  expect(await fondo('Pedir tarifas →')).toBe(sumarme)
  expect(await fondo('Escribinos →')).toBe(sumarme)

  const tarifas = page.getByRole('link', { name: 'Pedir tarifas →' }).filter({ visible: true })
  await tarifas.hover()
  await expect(tarifas).not.toHaveCSS('background-color', sumarme)
})

// En computadora, los botones de Ser parte, Tu música y Publicidad miden lo mismo y no quedan escalonados (8/11/2026)
test('en web, los tres botones de la derecha tienen el mismo ancho y el mismo borde izquierdo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/institucional')
  const cajas = await Promise.all(
    ['Quiero sumarme →', 'Enviar mi música →', 'Pedir tarifas →'].map((nombre) =>
      page.getByRole('link', { name: nombre }).filter({ visible: true }).boundingBox(),
    ),
  )
  for (const c of cajas) {
    expect(c!.width).toBe(cajas[0]!.width)
    expect(c!.x).toBe(cajas[0]!.x)
  }
})
