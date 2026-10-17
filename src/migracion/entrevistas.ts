import path from 'node:path'

import type { Payload } from 'payload'

import { slugify } from '@/base/lib/slug'
import { alAire, type Horario } from '@/sitio/lib/grilla'
import { fechaWp, recortar, textoPlano } from './contenido'
import type { AudioWp, ClienteWp } from './wordpress'

// En el WordPress viejo cada entrevista es un MP3 subido a la biblioteca de medios desde la nota que la
// presenta (docs/05-plan.md, fase 4). Acá cada audio pasa a ser una entrevista con su archivo propio.

export type ResultadoEntrevista = 'creada' | 'sin-cambios' | 'omitida' | 'error'

export interface FilaEntrevista {
  id: number
  audio: string
  entrevistado: string
  resultado: ResultadoEntrevista
  motivo?: string
  programa?: string
  nota?: number
}

const TIPOS_AUDIO = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a']

/** El título del audio es casi siempre el nombre de quien habla: se limpia lo que sobra. */
export function entrevistadoDe(tituloHtml: string): string {
  return recortar(
    textoPlano(tituloHtml)
      .replace(/^(entrevista|charla|nota)\s+(a|con)\s+/i, '')
      .replace(/[\s,;:.–—-]+$/, '')
      .trim(),
    120,
  )
}

const sinConsulta = (url: string) => url.split('?')[0]

/** Para las notas: cada MP3 del sitio viejo lleva a su entrevista en el sitio nuevo. */
export function enlacesDeAudios(audios: AudioWp[]) {
  const porUrl = new Map(
    audios.map((a) => [sinConsulta(a.source_url), entrevistadoDe(a.title.rendered)]),
  )
  return (src: string) => {
    const entrevistado = porUrl.get(sinConsulta(src))
    if (!entrevistado) return null
    return {
      href: `/radio/entrevistas?q=${encodeURIComponent(entrevistado)}`,
      texto: `Escuchá la entrevista a ${entrevistado}`,
    }
  }
}

export async function leerAudios(cliente: ClienteWp) {
  const audios: AudioWp[] = []
  for await (const audio of cliente.audios()) {
    if (TIPOS_AUDIO.includes(audio.mime_type)) audios.push(audio)
  }
  return audios
}

/**
 * Crea una entrevista por audio. Usa la nota a la que se subió (ya migrada) para el tema, la foto y el
 * resumen, y el programa que estaba al aire a la hora en que se subió el audio. Una entrevista ya
 * migrada no se vuelve a tocar.
 */
export async function importarEntrevistas(
  payload: Payload,
  opciones: {
    cliente: ClienteWp
    audios: AudioWp[]
    /** Slug del programa cuando a esa hora no había ninguno al aire. */
    programaPorDefecto?: string
    seco?: boolean
    registrar?: (mensaje: string) => void
  },
) {
  const { cliente, audios, seco = false, registrar = () => {} } = opciones
  const filas: FilaEntrevista[] = []

  const { docs: programas } = await payload.find({
    collection: 'programas',
    pagination: false,
    depth: 0,
    sort: 'id',
    select: { nombre: true, slug: true, horarios: true, activo: true },
  })
  const grilla = programas
    .filter((p) => p.activo !== false)
    .map((p) => ({ id: p.id, nombre: p.nombre, slug: p.slug, horarios: p.horarios as Horario[] }))
  const porDefecto =
    programas.find((p) => p.slug === opciones.programaPorDefecto) ??
    (opciones.programaPorDefecto ? null : programas[0])
  if (!porDefecto) {
    throw new Error(
      opciones.programaPorDefecto
        ? `No existe el programa "${opciones.programaPorDefecto}".`
        : 'No hay programas cargados: las entrevistas necesitan uno.',
    )
  }

  async function slugLibre(base: string, idMedio: number) {
    const { totalDocs } = await payload.count({
      collection: 'entrevistas',
      where: { slug: { equals: base } },
    })
    return totalDocs ? `${base}-${idMedio}` : base
  }

  async function importarAudio(audio: AudioWp): Promise<FilaEntrevista> {
    const entrevistado = entrevistadoDe(audio.title.rendered) || 'Entrevista'
    const fila: FilaEntrevista = {
      id: audio.id,
      audio: audio.source_url,
      entrevistado,
      resultado: 'omitida',
      nota: audio.post || undefined,
    }

    const { totalDocs } = await payload.count({
      collection: 'entrevistas',
      where: { 'wordpress.idMedio': { equals: audio.id } },
    })
    if (totalDocs) return { ...fila, resultado: 'sin-cambios' }

    const fecha = fechaWp(audio.date_gmt)
    const programa =
      grilla.find((p) => p.id === alAire(grilla, new Date(fecha))?.programa.id) ?? porDefecto!
    fila.programa = programa.slug

    const nota = audio.post
      ? (
          await payload.find({
            collection: 'noticias',
            where: { 'wordpress.idPost': { equals: audio.post } },
            limit: 1,
            depth: 0,
            draft: true,
          })
        ).docs[0]
      : undefined
    if (audio.post && !nota) fila.motivo = 'la nota del audio no se migró'
    if (seco) return { ...fila, resultado: 'creada' }

    const origen = sinConsulta(audio.source_url)
    let archivo = (
      await payload.find({
        collection: 'archivos',
        where: { origen: { equals: origen } },
        limit: 1,
        depth: 0,
      })
    ).docs[0]
    if (!archivo) {
      const bajado = await cliente.archivo(audio.source_url).catch(() => null)
      if (!bajado) return { ...fila, motivo: 'no se pudo bajar el audio' }
      archivo = await payload.create({
        collection: 'archivos',
        data: { descripcion: `Entrevista a ${entrevistado}`, origen },
        file: {
          data: bajado.data,
          mimetype: TIPOS_AUDIO.includes(bajado.tipo) ? bajado.tipo : audio.mime_type,
          name: decodeURIComponent(path.basename(origen)),
          size: bajado.data.length,
        },
      })
    }

    await payload.create({
      collection: 'entrevistas',
      data: {
        entrevistado,
        tema: nota?.titulo ?? entrevistado,
        slug: await slugLibre(`${slugify(entrevistado)}-${fecha.slice(0, 10)}`, audio.id),
        programa: programa.id,
        fecha,
        audio: archivo.id,
        duracion: audio.media_details?.length ? Math.round(audio.media_details.length) : null,
        foto: nota?.foto ?? null,
        resumen: nota?.bajada ?? null,
        _status: 'published',
        wordpress: { idMedio: audio.id, idPost: audio.post || null },
      },
      depth: 0,
      context: { migracion: true },
    })
    return { ...fila, resultado: 'creada' }
  }

  for (const audio of audios) {
    try {
      const fila = await importarAudio(audio)
      filas.push(fila)
      registrar(`audio ${audio.id} ${fila.resultado}${fila.motivo ? ` (${fila.motivo})` : ''}`)
    } catch (error) {
      const motivo = error instanceof Error ? error.message : String(error)
      filas.push({
        id: audio.id,
        audio: audio.source_url,
        entrevistado: entrevistadoDe(audio.title.rendered),
        resultado: 'error',
        motivo,
      })
      registrar(`audio ${audio.id} error: ${motivo}`)
    }
  }

  const resumen = Object.fromEntries(
    (['creada', 'sin-cambios', 'omitida', 'error'] as const).map((r) => [
      r,
      filas.filter((f) => f.resultado === r).length,
    ]),
  ) as Record<ResultadoEntrevista, number>
  return { filas, resumen }
}
