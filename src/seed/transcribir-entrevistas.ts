// Manda a transcribir con IA las entrevistas que tienen audio y todavía no tienen texto: las que ya
// estaban antes de cargar la clave, como el archivo traído de WordPress (docs/10-demo-en-pc.md). En la demo:
//   docker compose run --rm --build semilla node_modules/.bin/payload run src/seed/transcribir-entrevistas.ts
// Las transcribe la cola del sitio en los minutos siguientes. No toca las que ya tienen texto.
import config from '@payload-config'
import { getPayload } from 'payload'

import { claveDeTranscripcion } from '@/sitio/transcripcion/assemblyai'
import { encolarTranscripcion } from '@/sitio/transcripcion/tarea'

if (!claveDeTranscripcion()) {
  console.error('Falta ASSEMBLYAI_API_KEY en el .env: sin la clave no se puede transcribir.')
  process.exit(1)
}

const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'entrevistas',
  where: {
    and: [
      { audio: { exists: true } },
      { or: [{ transcripcion: { exists: false } }, { transcripcion: { equals: '' } }] },
    ],
  },
  pagination: false,
  depth: 0,
  select: { duracion: true },
  overrideAccess: true,
})
const pendientes = await payload.find({
  collection: 'payload-jobs',
  where: { taskSlug: { equals: 'transcribirEntrevista' } },
  pagination: false,
  depth: 0,
})
const yaEnCola = new Set(
  pendientes.docs.map((j) => (j.input as { entrevista?: number })?.entrevista),
)
const nuevas = docs.filter((e) => !yaEnCola.has(e.id))
for (const e of nuevas) await encolarTranscripcion(payload, e.id)

const horas = nuevas.reduce((total, e) => total + (e.duracion ?? 0), 0) / 3600
payload.logger.info(
  `Transcripciones: ${nuevas.length} entrevistas en la cola` +
    (horas ? `, unas ${horas.toFixed(1)} horas de audio` : '') +
    (docs.length > nuevas.length ? ` (${docs.length - nuevas.length} ya estaban en la cola)` : '') +
    '.',
)
process.exit(0)
