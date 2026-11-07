import { expect, test, type Page } from '@playwright/test'

// Mapa de publicidad (docs/07-permisos-y-publicidad.md, sección 3): casi todas las páginas llevan una
// arriba y otra al final, y el Inicio una entre cada bloque. Se cuentan las que se ven en cada tamaño.
const NOTA = '/noticias/locales/la-rambla-suma-nuevas-luminarias-led-en-el-tramo-del-anglo'

const avisos = (page: Page) => page.getByRole('complementary', { name: 'Publicidad' })

async function contar(page: Page, ruta: string) {
  await page.goto(ruta)
  return avisos(page).count()
}

async function unaEntrevista(page: Page) {
  await page.goto('/radio/entrevistas')
  return (await page.locator('ol li a').first().getAttribute('href'))!
}

for (const [nombre, tamano] of [
  ['en web', { width: 1440, height: 900 }],
  ['en el celular', { width: 390, height: 844 }],
] as const) {
  test.describe(nombre, () => {
    test.use({ viewport: tamano })

    test('cada página tiene sus publicidades', async ({ page }) => {
      const entrevista = await unaEntrevista(page)
      // En web, la nota suma la columna de cuadrados del costado
      const costado = nombre === 'en web' ? 1 : 0
      const esperadas: [string, number][] = [
        ['/', 4],
        ['/noticias', 2],
        ['/noticias/locales', 2],
        [NOTA, 2 + costado],
        // Una nota larga suma la del medio
        ['/noticias/opinion/que-nos-dice-el-anglo-sobre-el-futuro-de-la-ciudad', 3 + costado],
        ['/radio/programacion', 2],
        ['/radio/entrevistas', 1],
        // En web, cada entrevista suma los cuadrados entre el reproductor y «Más entrevistas»
        [entrevista, 2 + costado],
        // En el celular, la del reproductor a pantalla completa; en web, la de entre la radio y el pie
        ['/radio/en-vivo', 1],
        ['/institucional', 1],
      ]
      for (const [ruta, cuantas] of esperadas) {
        await page.goto(ruta)
        await expect(avisos(page), ruta).toHaveCount(cuantas)
      }
    })
  })
}

test('en web, Noticias termina con la publicidad y «¿Tenés una noticia?»', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  expect(await contar(page, '/noticias')).toBe(2)
  const participa = page.getByRole('region', { name: 'Participá' })
  await expect(participa).toBeVisible()
  // La publicidad de abajo va justo antes
  const antes = await participa.evaluate((p) => {
    const ultima = [...document.querySelectorAll('aside[aria-label="Publicidad"]')].at(-1)!
    return Boolean(ultima.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(antes).toBe(true)
})

test('la publicidad del final de la nota va antes de «Seguí leyendo»', async ({ page }) => {
  await page.goto(NOTA)
  const ultima = page.locator('aside[data-ubicacion="noticias-nota-abajo"]')
  const antes = await ultima.evaluate((a) => {
    const segui = document.getElementById('segui-leyendo')!
    const fin = document.querySelector('article')!
    return (
      Boolean(fin.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      Boolean(a.compareDocumentPosition(segui) & Node.DOCUMENT_POSITION_FOLLOWING)
    )
  })
  expect(antes).toBe(true)
})

test('en el celular, la publicidad de Cinevisión es la tira de 320×100', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/cinevision')
  const pieza = page.locator('aside[data-ubicacion="cinevision"]').locator('img:visible, a:visible').first()
  await expect(pieza).toBeVisible()
  const caja = (await pieza.boundingBox())!
  expect(Math.round(caja.width)).toBe(320)
  expect(Math.abs(caja.height - 100)).toBeLessThanOrEqual(2)
})
