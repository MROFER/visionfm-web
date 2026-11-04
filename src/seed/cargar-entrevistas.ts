// Carga 24 entrevistas inventadas, con transcripción, para probar Entrevistas (docs/10-demo-en-pc.md).
// En la demo:
//   docker compose run --rm --build semilla node_modules/.bin/payload run src/seed/cargar-entrevistas.ts
//   docker compose up -d --force-recreate app
// Se sacan con src/seed/borrar-entrevistas.ts. Nunca en producción.
import config from '@payload-config'
import { getPayload } from 'payload'

import { cargarEntrevistasDePrueba } from './entrevistas-de-prueba'
import { puedeSembrar } from './permitido'

const permiso = puedeSembrar(process.env.NEXT_PUBLIC_SITE_URL)
if (!permiso.ok) {
  console.error(`No se cargan entrevistas de prueba. ${permiso.motivo}`)
  process.exit(1)
}

const payload = await getPayload({ config })
const { creadas, existentes } = await cargarEntrevistasDePrueba(payload)
payload.logger.info(
  `Entrevistas de prueba: ${creadas} cargadas${existentes ? ` y ${existentes} que ya estaban` : ''}.`,
)
process.exit(0)
