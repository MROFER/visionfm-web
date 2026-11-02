// Carga películas desde una carpeta con un peliculas.json y los afiches (docs/10-demo-en-pc.md).
// En la demo, con la carpeta "importar" al lado del compose.yml:
//   docker compose run --rm --build -v "${PWD}/importar:/importar" semilla node_modules/.bin/payload run src/seed/importar-peliculas.ts
// Entran como borradores para revisarlas y publicarlas desde el panel. Si una película ya existe
// (mismo título), no se toca.
import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'

import { slugify } from '@/base/lib/slug'
import type { Pelicula } from '@/payload-types'

type PeliculaAImportar = {
  titulo: string
  afiche: string
  tituloOriginal?: string
  anio?: number
  genero?: string
  duracion?: number
  calificacion?: Pelicula['calificacion']
  sinopsis?: string
  trailer?: string
  fechaEstreno?: string
  creditos?: Pelicula['creditos']
}

const carpeta = process.env.CARPETA_IMPORTAR ?? '/importar'
const lista = JSON.parse(
  await readFile(path.join(carpeta, 'peliculas.json'), 'utf8'),
) as PeliculaAImportar[]

const payload = await getPayload({ config })
let creadas = 0

for (const p of lista) {
  const slug = slugify(p.titulo)
  const { totalDocs } = await payload.count({
    collection: 'peliculas',
    where: { slug: { equals: slug } },
  })
  if (totalDocs) {
    payload.logger.info(`Ya estaba: ${p.titulo}`)
    continue
  }

  const datos = await readFile(path.join(carpeta, p.afiche))
  const afiche = await payload.create({
    collection: 'medios',
    data: { alt: `Afiche de ${p.titulo}`, credito: 'Afiche oficial' },
    file: { data: datos, mimetype: 'image/jpeg', name: `afiche-${slug}.jpg`, size: datos.length },
  })

  const { afiche: _archivo, ...resto } = p
  await payload.create({
    collection: 'peliculas',
    draft: true,
    data: { ...resto, slug: '', afiche: afiche.id, _status: 'draft' },
  })
  creadas++
  payload.logger.info(`Cargada como borrador: ${p.titulo}`)
}

payload.logger.info(`Películas: ${creadas} cargadas, ${lista.length - creadas} ya estaban.`)
process.exit(0)
