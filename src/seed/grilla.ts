import type { Payload } from 'payload'

import { slugify } from '@/base/lib/slug'
import { ENTREVISTAS, PROGRAMAS } from './datos'
import { COLORES, imagenDeEjemplo } from './imagenes'

/**
 * Cambia la programación cargada por la de los datos de ejemplo, sin tocar nada más (notas, cine,
 * publicidad, equipo, excepciones). Borra todos los programas y crea los de PROGRAMAS.
 *
 * Las entrevistas no se pierden: siguen en el programa del mismo nombre si todavía existe, o pasan al
 * que les toca en los datos de ejemplo. Las que no tienen a dónde ir quedan sin programa.
 */
export async function cargarGrilla(payload: Payload) {
  const { docs: anteriores } = await payload.find({
    collection: 'programas',
    pagination: false,
    depth: 0,
    select: { nombre: true },
  })
  const nombreAnterior = new Map(anteriores.map((p) => [p.id, p.nombre]))
  const { docs: entrevistas } = await payload.find({
    collection: 'entrevistas',
    pagination: false,
    depth: 0,
    draft: true,
    select: { tema: true, programa: true },
  })

  await payload.delete({ collection: 'programas', where: { id: { exists: true } } })

  const { docs: equipo } = await payload.find({
    collection: 'equipo',
    pagination: false,
    depth: 0,
    select: { nombre: true },
  })
  const persona = new Map(equipo.map((e) => [e.nombre, e.id]))

  const programas = new Map<string, number>()
  for (const [i, p] of PROGRAMAS.entries()) {
    const doc = await payload.create({
      collection: 'programas',
      data: {
        nombre: p.nombre,
        slug: '',
        descripcion: p.descripcion,
        conductores: (p.conductores ?? []).flatMap((n) => persona.get(n) ?? []),
        horarios: p.horarios,
        foto: await fotoDePrograma(payload, p.nombre, COLORES[i % COLORES.length]),
      },
    })
    programas.set(p.nombre, doc.id)
  }

  let sinPrograma = 0
  for (const e of entrevistas) {
    const antes = typeof e.programa === 'number' ? nombreAnterior.get(e.programa) : undefined
    const destino =
      (antes ? programas.get(antes) : undefined) ??
      programas.get(ENTREVISTAS.find((x) => x.tema === e.tema)?.programa ?? '')
    if (!destino) {
      sinPrograma++
      continue
    }
    await payload.update({
      collection: 'entrevistas',
      id: e.id,
      data: { programa: destino },
    })
  }

  return { borrados: anteriores.length, creados: programas.size, sinPrograma }
}

/** La imagen de ejemplo del programa: la que ya estaba (mismo texto alternativo) o una nueva. */
async function fotoDePrograma(payload: Payload, nombre: string, color: string) {
  const alt = `Programa ${nombre}`
  const { docs } = await payload.find({
    collection: 'medios',
    where: { alt: { equals: alt } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return docs[0].id
  const data = await imagenDeEjemplo(1280, 720, nombre, color)
  const medio = await payload.create({
    collection: 'medios',
    data: { alt, credito: 'Imagen de ejemplo' },
    file: { data, mimetype: 'image/jpeg', name: `${slugify(alt)}.jpg`, size: data.length },
  })
  return medio.id
}
