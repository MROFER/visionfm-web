import { defineConfig, devices } from '@playwright/test'

// Pruebas de humo en un navegador contra el sitio ya armado (docs/02-trd.md, sección 8). En CI corren
// contra `pnpm build` con los datos de ejemplo; en local, contra el servidor que diga E2E_URL.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.E2E_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
