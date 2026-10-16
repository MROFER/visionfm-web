import { expect, test, type Page } from '@playwright/test'

import { silencioMp3 } from '../../src/seed/imagenes'

// La radio no se corta al navegar, se reconecta sola y se ve en la pantalla bloqueada (docs/05-plan.md,
// fase 3). El stream de los datos de ejemplo no existe: se reemplaza por un MP3 de silencio.
const STREAM = 'https://stream.ejemplo.uy/**'
const audio = silencioMp3(120)

const servirStream = (page: Page, { fallarPrimero = 0 } = {}) => {
  let pedidos = 0
  return page.route(STREAM, (route) => {
    pedidos++
    if (pedidos <= fallarPrimero) return route.abort('connectionreset')
    return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: audio })
  })
}

const sonando = (page: Page) =>
  page.waitForFunction(() => {
    const a = document.querySelector('audio')
    return !!a && !a.paused && a.currentTime > 0
  })

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
