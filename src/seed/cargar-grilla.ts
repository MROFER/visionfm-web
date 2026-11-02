// Cambia solo la programación por la de los datos de ejemplo (docs/10-demo-en-pc.md). En la demo:
//   docker compose run --rm --build semilla node_modules/.bin/payload run src/seed/cargar-grilla.ts
//   docker compose up -d --force-recreate app
// Borra todos los programas cargados: nunca en producción.
import config from '@payload-config'
import { getPayload } from 'payload'

import { cargarGrilla } from './grilla'
import { puedeSembrar } from './permitido'

const permiso = puedeSembrar(process.env.NEXT_PUBLIC_SITE_URL)
if (!permiso.ok) {
  console.error(`No se cambia la programación. ${permiso.motivo}`)
  process.exit(1)
}

const payload = await getPayload({ config })
const { borrados, creados, sinPrograma } = await cargarGrilla(payload)
payload.logger.info(`Programación: ${borrados} programas borrados y ${creados} cargados.`)
if (sinPrograma) {
  payload.logger.warn(
    `${sinPrograma} entrevista(s) quedaron sin programa: elegíselo desde el panel, en Radio › Entrevistas.`,
  )
}
process.exit(0)
