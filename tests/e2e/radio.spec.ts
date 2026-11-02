import { expect, test, type Page } from '@playwright/test'

import { silencioMp3 } from '../../src/seed/imagenes'

// La radio no se corta al navegar, se reconecta sola y se ve en la pantalla bloqueada (docs/05-plan.md,
// fase 3). El stream de los Ajustes no existe en la base de pruebas: todo pedido de audio externo se
// reemplaza por un MP3 de silencio, sea cual sea la URL cargada.
const audio = silencioMp3(120)

const servirStream = (page: Page, { fallarPrimero = 0, colgarPrimero = false } = {}) => {
  let pedidos = 0
  return page.route(
    (url) => url.protocol === 'https:' && url.hostname !== 'localhost',
    (route) => {
      if (route.request().resourceType() !== 'media') return route.continue()
      pedidos++
      // El servidor acepta la conexión y nunca manda audio
      if (colgarPrimero && pedidos === 1) return new Promise<void>(() => {})
      if (pedidos <= fallarPrimero) return route.abort('connectionreset')
      return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: audio })
    },
  )
}

const sonando = (page: Page, timeout?: number) =>
  page.waitForFunction(
    () => {
      const a = document.querySelector('audio')
      return !!a && !a.paused && a.currentTime > 0
    },
    undefined,
    { timeout },
  )

/** Hace clic en el primer link visible a esa ruta, como lo haría una persona. */
async function irA(page: Page, href: string) {
  await page.locator(`a[href="${href}"]:visible`).first().click()
  await page.waitForURL((url) => url.pathname === href.split('#')[0])
}

test('la radio sigue sonando al recorrer cinco páginas', async ({ page }) => {
  await servirStream(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  await sonando(page)
  // Se guarda el elemento: si alguna página volviera a montar el reproductor, sería otro
  await page.evaluate(() => {
    ;(window as unknown as { __audio: HTMLAudioElement | null }).__audio =
      document.querySelector('audio')
  })

  let antes = 0
  for (const ruta of [
    '/noticias',
    '/radio/programacion',
    '/cinevision#cartelera',
    '/institucional/contacto',
    '/radio/entrevistas',
  ]) {
    await irA(page, ruta)
    await page.waitForTimeout(400)
    const estado = await page.evaluate(() => {
      const a = document.querySelector('audio')
      return {
        mismo: a === (window as unknown as { __audio: HTMLAudioElement | null }).__audio,
        pausado: a?.paused,
        tiempo: a?.currentTime ?? 0,
      }
    })
    expect(estado, ruta).toMatchObject({ mismo: true, pausado: false })
    expect(estado.tiempo, ruta).toBeGreaterThan(antes)
    antes = estado.tiempo
  }
})

test('si la señal se corta, se reconecta sola', async ({ page }) => {
  await servirStream(page, { fallarPrimero: 2 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  await sonando(page)
})

test('si la primera conexión queda colgada, prueba otra y arranca', async ({ page }) => {
  await servirStream(page, { colgarPrimero: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  // Antes esperaba 15 s colgado antes de volver a probar
  await sonando(page, 10_000)
})

test('una entrevista baja el vivo y, al terminar, el vivo vuelve solo', async ({ page }) => {
  await servirStream(page)
  await page.goto('/radio/entrevistas')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  await sonando(page)
  await page
    .getByRole('button', { name: /^Escuchar la entrevista a/ })
    .first()
    .click()
  await page.waitForFunction(() => {
    const a = document.querySelector('audio')
    return !!a && a.src.includes('/api/entrevistas/') && !a.paused && a.currentTime > 0
  })
  // Saltar al final de la entrevista
  await page.evaluate(() => {
    const a = document.querySelector('audio')!
    a.currentTime = Math.max(0, a.duration - 0.3)
  })
  await page.waitForFunction(() => {
    const a = document.querySelector('audio')
    return !!a && !a.src.includes('/api/entrevistas/') && !a.paused && a.currentTime > 0
  })
})

test('si otra app pausa el vivo (un audio de WhatsApp), al volver a la página suena solo', async ({
  page,
}) => {
  await servirStream(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  await sonando(page)
  // El sistema pausa el audio sin pasar por los botones del sitio
  await page.evaluate(() => document.querySelector('audio')!.pause())
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await sonando(page)
})

test('si el vivo queda mudo sin avisar, se reconecta solo', async ({ page }) => {
  await servirStream(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  await sonando(page)
  // Queda "sonando" pero el audio no avanza, como cuando el celular lo suspende
  const quieto = await page.evaluate(() => {
    const a = document.querySelector('audio')!
    a.playbackRate = 0
    return a.currentTime
  })
  await page.waitForFunction(
    (t) => {
      const a = document.querySelector('audio')
      return !!a && !a.paused && a.playbackRate === 1 && a.currentTime > 0 && a.currentTime !== t
    },
    quieto,
    { timeout: 10_000 },
  )
})

test('la pantalla bloqueada muestra la radio y deja pausar', async ({ page }) => {
  await servirStream(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Escuchar en vivo' }).first().click()
  await sonando(page)
  const sesion = await page.evaluate(() => ({
    album: navigator.mediaSession.metadata?.album,
    portada: navigator.mediaSession.metadata?.artwork[0]?.src,
    estado: navigator.mediaSession.playbackState,
  }))
  expect(sesion).toMatchObject({ album: 'Visión 96.5 FM', estado: 'playing' })
  expect(sesion.portada).toContain('/marca/icono-512.png')

  await page.getByRole('button', { name: 'Pausar' }).first().click()
  await expect.poll(() => page.evaluate(() => navigator.mediaSession.playbackState)).toBe('paused')
})

test.describe('en el celular', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('el play del encabezado abre la cápsula y lleva al reproductor completo', async ({
    page,
  }) => {
    await servirStream(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Escuchar la radio en vivo' }).click()
    await sonando(page)
    await page.getByRole('link', { name: /Abrir el reproductor/ }).click()
    await page.waitForURL('**/radio/en-vivo')
    await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible()
    await sonando(page)
  })
})
