import { devices, expect, test } from '@playwright/test'

// El carrusel de Cinevisión es infinito: después de la última imagen sigue de largo a la primera, sin
// rebobinar todas para atrás (7/11/2026). Rebobinar se vería como varios anchos de imagen de recorrido.
test('en web, el carrusel de Cinevisión pasa de la última a la primera sin rebobinar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/cinevision')
  const pista = page.locator('section[aria-roledescription="carrusel"] .snap-x')
  const negativos = page
    .getByRole('navigation', { name: 'Imágenes del carrusel' })
    .getByRole('button')
  const total = await negativos.count()
  test.skip(total < 2, 'Hace falta más de una imagen en el carrusel')

  // Anota cada movimiento animado (los saltos sin animación entre copias iguales no se ven)
  await pista.evaluate((el) => {
    const w = window as unknown as { recorrido: number; ultimo: number }
    w.recorrido = 0
    w.ultimo = el.scrollLeft
    el.addEventListener('scroll', () => {
      const d = Math.abs(el.scrollLeft - w.ultimo)
      if (d < el.clientWidth / 2) w.recorrido += d
      w.ultimo = el.scrollLeft
    })
  })
  const siguiente = page.getByRole('button', { name: 'Imagen siguiente' })
  for (let i = 0; i < total; i++) {
    await siguiente.click()
    await expect(negativos.nth((i + 1) % total)).toHaveAttribute('aria-current', 'true')
  }
  await page.waitForTimeout(300)
  const { recorrido, ancho } = await pista.evaluate((el) => ({
    recorrido: (window as unknown as { recorrido: number }).recorrido,
    ancho: el.clientWidth,
  }))
  // Una imagen por toque, también de la última a la primera
  expect(recorrido).toBeLessThanOrEqual(total * ancho + 4)

  await page.getByRole('button', { name: 'Imagen anterior' }).click()
  await expect(negativos.nth(total - 1)).toHaveAttribute('aria-current', 'true')
})

// Próximos estrenos: la fecha va en la cinta de la esquina también en el celular, no abajo del nombre (8/11/2026)
test('en el celular, la fecha de estreno va en la cinta del afiche', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/cinevision')
  const estreno = page.locator('#estrenos li').first()
  await expect(estreno.locator('span[aria-hidden="true"]', { hasText: /^Estreno / })).toBeVisible()
  // La fecha de abajo queda solo para lectores de pantalla
  const abajo = await estreno.getByText(/^Estreno: /).boundingBox()
  expect(abajo!.width).toBeLessThanOrEqual(1)
})

// En el celular, deslizar muy rápido de una imagen a otra nunca choca contra el final del carrusel: el salto a
// las imágenes de verdad se hace al apoyar el dedo, sin esperar a que el carrusel se quede quieto (8/11/2026)
test.describe('en el celular', () => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = devices['Pixel 7']
  test.use({ viewport, deviceScaleFactor, isMobile, hasTouch, userAgent })

  test('deslizar rápido varias veces no choca contra el final del carrusel', async ({
    page,
    context,
  }) => {
    await page.goto('/cinevision')
    const pista = page.locator('section[aria-roledescription="carrusel"] div.snap-x')
    // Espera las copias, que aparecen con JavaScript
    await expect.poll(() => pista.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
    await pista.evaluate((el) => {
      ;(window as unknown as { tocoElFinal: boolean }).tocoElFinal = false
      el.addEventListener('scroll', () => {
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)
          (window as unknown as { tocoElFinal: boolean }).tocoElFinal = true
      })
    })
    const caja = (await pista.boundingBox())!
    const cdp = await context.newCDPSession(page)
    const y = Math.round(caja.y + caja.height / 2)
    for (let k = 0; k < 15; k++) {
      let x = Math.round(caja.x + caja.width * 0.85)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let s = 0; s < 6; s++) {
        x -= Math.round(caja.width * 0.12)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
        await page.waitForTimeout(8)
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await page.waitForTimeout(30)
    }
    await page.waitForTimeout(800)
    expect(
      await page.evaluate(() => (window as unknown as { tocoElFinal: boolean }).tocoElFinal),
    ).toBe(false)
  })
})
