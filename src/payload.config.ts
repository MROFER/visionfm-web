import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Medios } from './base/collections/Medios'
import { Usuarios } from './base/collections/Usuarios'
import { Secciones } from './sitio/collections/Secciones'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Visión 96.5 FM',
    },
  },
  // La API de Payload vive en /cms-api, detrás de Cloudflare Access igual que /admin.
  // /api queda para las rutas públicas propias del sitio (docs/02-trd.md, sección 4).
  routes: {
    admin: '/admin',
    api: '/cms-api',
  },
  graphQL: {
    disable: true,
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  collections: [Usuarios, Medios, Secciones],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Nunca `push` fuera de desarrollo: producción aplica las migraciones versionadas al arrancar
    push: false,
    prodMigrations: migrations,
  }),
  sharp,
  telemetry: false,
})
