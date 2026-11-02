import { expect, test } from '@playwright/test'

// Programación: hoy, la lista empieza por el programa al aire (remarcado) y lo que ya pasó queda plegado.
test('el programa al aire va primero y lo que ya pasó se despliega con un botón', async ({
  page,
}) => {
  // Lunes 2 de noviembre de 2026, 13:30 en Montevideo: suena el Mediodía Informativo
  await page.clock.setFixedTime(new Date('2026-11-02T16:30:00Z'))
  await page.goto('/radio/programacion')

  const lista = page.locator('#grilla-del-dia li')
  const alAire = page.locator('#grilla-del-dia li[aria-current]')
  await expect(alAire).toContainText('Mediodía Informativo')
  await expect(lista.first()).toHaveAttribute('aria-current', 'true')

  const pasados = page.getByRole('button', { name: /^Ver lo que ya pasó hoy/ })
  await pasados.click()
  await expect(page.getByRole('button', { name: /^Ocultar lo que ya pasó/ })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(lista.first()).not.toHaveAttribute('aria-current', 'true')
  await expect(alAire).toBeVisible()
})
