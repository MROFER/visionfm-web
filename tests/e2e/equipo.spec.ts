import { expect, test } from '@playwright/test'

// El Equipo de Institucional va por áreas, con tarjetas iguales: la foto llena el cuadro y el nombre y el
// puesto van en una franja oscura sobre la parte de abajo (8/11/2026)
test('el equipo va por áreas, en el orden del diseño', async ({ page }) => {
  await page.goto('/institucional')
  await expect(page.locator('#equipo h3')).toHaveText([
    'Dirección',
    'Producción general',
    'Conducción',
    'Columnistas y colaboradores',
    'Equipo técnico',
  ])
})

test('en web, todas las tarjetas son iguales y la franja va sobre la parte de abajo de la foto', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/institucional')
  const tarjetas = page.locator('#equipo li')
  const cajas = await tarjetas.evaluateAll((lis) =>
    lis.map((li) => {
      const t = li.getBoundingClientRect()
      const f = li.lastElementChild!.getBoundingClientRect()
      return { ancho: t.width, alto: t.height, abajo: t.bottom, franjaAncho: f.width, franjaAbajo: f.bottom }
    }),
  )
  expect(cajas.length).toBeGreaterThan(1)
  for (const c of cajas) {
    // Cuatro por fila en los 1240 px del contenido, en 4:5
    expect(c.ancho).toBeCloseTo(292, 0)
    expect(c.alto / c.ancho).toBeCloseTo(1.25, 1)
    expect(c.franjaAncho).toBeCloseTo(c.ancho, 0)
    expect(c.franjaAbajo).toBeCloseTo(c.abajo, 0)
  }
  const franja = tarjetas.first().locator('> div')
  await expect(franja).toHaveCSS('background-color', 'rgb(19, 22, 29)')
  await expect(franja).toHaveCSS('border-top-width', '4px')
  await expect(franja).toHaveCSS('border-top-color', 'rgb(192, 58, 11)')
})

test('en el celular, las tarjetas son todas iguales y van de a dos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/institucional')
  const cajas = await page
    .locator('#equipo li')
    .evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect().toJSON()))
  expect(cajas.length).toBeGreaterThan(1)
  for (const caja of cajas) {
    // Dos por fila en los 358 px del contenido, con 12 px entre las dos
    expect(caja.width).toBeCloseTo(173, 0)
    expect(caja.height / caja.width).toBeCloseTo(1.25, 1)
  }
  const conduccion = page.locator('#equipo h3:text-is("Conducción") + ul > li')
  await expect(conduccion).toHaveCount(3)
  const [a, b, c] = await conduccion.evaluateAll((lis) => lis.map((li) => li.getBoundingClientRect().toJSON()))
  expect(b.top).toBe(a.top)
  expect(b.left).toBeGreaterThan(a.right)
  expect(c.top).toBeGreaterThan(a.bottom)
})
