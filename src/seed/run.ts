// `pnpm seed`: carga datos de ejemplo en local, staging o la demo. Nunca en producción.
import config from '@payload-config'
import { getPayload } from 'payload'

import { sembrar } from './index'
import { puedeSembrar } from './permitido'

const permiso = puedeSembrar(process.env.NEXT_PUBLIC_SITE_URL)
if (!permiso.ok) {
  console.error(`No se cargan datos de ejemplo. ${permiso.motivo}`)
  process.exit(1)
}

const payload = await getPayload({ config })
const { creados, existentes } = await sembrar(payload)
payload.logger.info(`Datos de ejemplo: ${creados} creados, ${existentes} ya estaban.`)
process.exit(0)
