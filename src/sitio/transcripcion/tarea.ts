import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  createLocalReq,
  type CollectionAfterChangeHook,
  type Payload,
  type TaskConfig,
} from 'payload'

import type { Archivo, Entrevista } from '@/payload-types'

import { armarTranscripcion } from './armar'
import { claveDeTranscripcion, transcribir } from './assemblyai'

const idDe = (valor: unknown) =>
  valor && typeof valor === 'object'
    ? (valor as { id: number }).id
    : (valor as number | null | undefined)

/**
 * Cómo le llega el audio al servicio. Con R2 el archivo vive en el bucket privado y el manejador de
 * Payload devuelve una URL firmada que vence en 1 h: el servicio lo baja de ahí. En disco (la demo y
 * desarrollo) se mandan los bytes.
 */
export async function audioParaTranscribir(
  payload: Payload,
  archivo: Archivo,
): Promise<{ url: string } | { datos: Uint8Array }> {
  const { upload } = payload.collections.archivos.config
  const filename = archivo.filename ?? ''
  if (upload.handlers?.length) {
    const req = await createLocalReq({}, payload)
    for (const manejador of upload.handlers) {
      const respuesta = await manejador(req, {
        doc: archivo,
        params: { collection: 'archivos', filename },
      })
      if (!(respuesta instanceof Response)) continue
      const destino = respuesta.headers.get('location')
      if (respuesta.status >= 300 && respuesta.status < 400 && destino) return { url: destino }
      if (respuesta.ok) return { datos: new Uint8Array(await respuesta.arrayBuffer()) }
    }
  }
  return {
    datos: new Uint8Array(await readFile(path.resolve(upload.staticDir ?? 'archivos', filename))),
  }
}

/** Transcribe una entrevista y guarda el texto, sin publicar ni despublicar nada. */
export async function transcribirEntrevista(payload: Payload, id: number) {
  const clave = claveDeTranscripcion()
  if (!clave) return { estado: 'sin clave' }
  const e: Entrevista = await payload.findByID({
    collection: 'entrevistas',
    id,
    depth: 1,
    draft: true,
    overrideAccess: true,
    populate: { programas: { nombre: true } },
  })
  if (e.transcripcion?.trim()) return { estado: 'ya tenía' }
  if (!e.audio || typeof e.audio !== 'object') return { estado: 'sin audio' }

  const { frases, segundos } = await transcribir(
    await audioParaTranscribir(payload, e.audio),
    clave,
  )
  const programa = typeof e.programa === 'object' ? e.programa.nombre : ''
  const transcripcion = armarTranscripcion(frases, { entrevistado: e.entrevistado, programa })
  if (!transcripcion) return { estado: 'sin texto' }

  await payload.update({
    collection: 'entrevistas',
    id,
    data: {
      transcripcion,
      // La duración solo la trae la migración de WordPress: la de una entrevista nueva sale de acá
      ...(e.duracion || !segundos ? {} : { duracion: Math.round(segundos) }),
    },
    // Una entrevista en borrador sigue en borrador
    draft: e._status !== 'published',
    overrideAccess: true,
  })
  return { estado: 'transcripta' }
}

export const tareaTranscribirEntrevista: TaskConfig<'transcribirEntrevista'> = {
  slug: 'transcribirEntrevista',
  label: 'Transcribir una entrevista',
  inputSchema: [{ name: 'entrevista', type: 'number', required: true }],
  outputSchema: [{ name: 'estado', type: 'text' }],
  retries: 2,
  handler: async ({ input, req }) => ({
    output: await transcribirEntrevista(req.payload, input.entrevista),
  }),
}

/** Encola la transcripción de una entrevista: la cola corre aparte, así guardar no espera. */
export const encolarTranscripcion = (payload: Payload, id: number) =>
  payload.jobs.queue({ task: 'transcribirEntrevista', input: { entrevista: id } })

/**
 * Al crear una entrevista con audio, o al cambiarle el audio, se transcribe sola si hay clave y
 * todavía no tiene texto. Publicar o guardar de nuevo no la vuelve a mandar.
 */
export const transcribirAlSubirAudio: CollectionAfterChangeHook<Entrevista> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const audio = idDe(doc.audio)
  const audioNuevo = operation === 'create' || audio !== idDe(previousDoc?.audio)
  if (claveDeTranscripcion() && audio && audioNuevo && !doc.transcripcion?.trim()) {
    await encolarTranscripcion(req.payload, doc.id)
  }
  return doc
}
