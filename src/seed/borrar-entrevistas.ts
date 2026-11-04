// Saca las entrevistas inventadas que carga src/seed/cargar-entrevistas.ts (docs/10-demo-en-pc.md). En la
// demo:
//   docker compose run --rm --build semilla node_modules/.bin/payload run src/seed/borrar-entrevistas.ts
//   docker compose up -d --force-recreate app
import config from '@payload-config'
import { getPayload } from 'payload'

import { borrarEntrevistasDePrueba } from './entrevistas-de-prueba'
import { puedeSembrar } from './permitido'

const permiso = puedeSembrar(process.env.NEXT_PUBLIC_SITE_URL)
if (!permiso.ok) {
  console.error(`No se borran entrevistas de prueba. ${permiso.motivo}`)
  process.exit(1)
}

const payload = await getPayload({ config })
const borradas = await borrarEntrevistasDePrueba(payload)
payload.logger.info(`Entrevistas de prueba: ${borradas} borradas.`)
process.exit(0)
