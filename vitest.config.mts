import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] },
      },
      {
        // Necesitan Postgres con las migraciones aplicadas (pnpm migrate)
        extends: true,
        test: {
          name: 'int',
          include: ['tests/int/**/*.int.test.ts'],
          setupFiles: ['dotenv/config'],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
})
