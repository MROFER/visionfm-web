import { expect, test } from '@playwright/test'

// En web, a la derecha del título de Cinevisión va solo "Cartelera completa" (7/11/2026)
test('en web, el cine del Inicio no repite «Cartelera del … al …» arriba del botón', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const cine = page.locator('section#cine')
  await expect(cine.getByRole('link', { name: 'Cartelera completa' }).first()).toBeVisible()
  await expect(cine.getByText(/^Cartelera del /)).toHaveCount(0)
})

// El nombre de cada entrevista del Inicio lleva a su página, no al archivo (8/11/2026)
test('en el Inicio, el nombre de cada entrevista lleva a su página', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const enlace = page.locator('section#radio ol li a').first()
  const href = await enlace.getAttribute('href')
  expect(href).toMatch(/^\/radio\/entrevistas\/[a-z0-9-]+$/)
  await enlace.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

// En el celular, las noticias chicas del Inicio usan la foto 4:3 de la sección Noticias y "Todas las
// entrevistas" es el mismo botón oscuro que "Todas las noticias" (8/11/2026)
test('en el celular, las noticias chicas van en 128×96 y Todas las entrevistas es un botón', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const fotos = page.locator('article a[tabindex="-1"] > *').filter({ visible: true })
  const cajas = await fotos.evaluateAll((els) =>
    els.slice(1).map((e) => e.getBoundingClientRect().toJSON()),
  )
  expect(cajas.length).toBeGreaterThan(0)
  for (const c of cajas.slice(0, 4)) {
    expect(c.width).toBe(128)
    expect(c.height).toBe(96)
  }
  const fondo = (nombre: RegExp) =>
    page
      .getByRole('link', { name: nombre })
      .filter({ visible: true })
      .evaluate((a) => getComputedStyle(a).backgroundColor)
  expect(await fondo(/^Todas las entrevistas/)).toBe(await fondo(/^Todas las noticias/))
})

// El dibujo del hero se mueve con el video lento, el de web o el chico del celular, y nunca con "reducir
// movimiento": ahí queda la imagen quieta (28/11/2026)
for (const [ancho, movimiento, web, celular] of [
  [1529, 'no-preference', 1, 0],
  [1529, 'reduce', 0, 0],
  [390, 'no-preference', 0, 1],
  [390, 'reduce', 0, 0],
] as const) {
  test(`el video del Anglo, a ${ancho} px con movimiento ${movimiento}`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 800 })
    await page.emulateMedia({ reducedMotion: movimiento })
    await page.goto('/')
    await expect(page.locator('section[aria-label="Visión FM 96.5"] img').first()).toBeAttached()
    await expect(page.getByTestId('anglo-video-web')).toHaveCount(web)
    await expect(page.getByTestId('anglo-video-celular')).toHaveCount(celular)
  })
}

// En el celular el título va en dos renglones centrados que llenan el ancho: "Visión FM 96.5" y "La radio de
// Fray Bentos" (28/11/2026)
test('en el celular, el título del hero son dos renglones a todo el ancho', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const h1 = page.locator('section[aria-label="Visión FM 96.5"] h1')
  const medidas = await h1.evaluate((h) => {
    const ancho = h.clientWidth
    return [...h.children].map((s) => {
      const r = document.createRange()
      r.selectNodeContents(s)
      const rects = [...r.getClientRects()]
      const tops = new Set(rects.map((x) => Math.round(x.top)))
      return { renglones: tops.size, ancho: r.getBoundingClientRect().width / ancho }
    })
  })
  expect(medidas).toHaveLength(2)
  for (const m of medidas) {
    expect(m.renglones).toBe(1)
    expect(m.ancho).toBeGreaterThan(0.95)
    expect(m.ancho).toBeLessThanOrEqual(1.01)
  }
})
