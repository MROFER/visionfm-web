import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // src/base es la futura plantilla de la agencia: no puede depender de nada propio de la radio
    files: ['src/base/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/sitio', '@/sitio/*', '**/sitio/**'], message: 'src/base no puede importar de src/sitio.' },
          ],
        },
      ],
    },
  },
  {
    ignores: ['.next/', 'design/', 'src/payload-types.ts', 'src/migrations/', 'src/app/(payload)/'],
  },
]

export default config
