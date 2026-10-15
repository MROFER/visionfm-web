import type { Endpoint, Payload, PayloadRequest } from 'payload'

import type { Funcione } from '@/payload-types'
import { tienePermiso, type UsuarioConPermisos } from '@/base/permisos'
import { sumarDias } from '../publicidad/fechas'
import { type FuncionACopiar, funcionesACopiar, lunesDe, rangoSemana } from './semana'

const idDe = (ref: unknown) =>
  (ref && typeof ref === 'object' ? (ref as { id: number | string }).id : ref) as number | string

async function funcionesDeLaSemana(payload: Payload, lunes: string, req?: PayloadRequest) {
  const { desde, hasta } = rangoSemana(lunes)
  const { docs } = await payload.find({
    collection: 'funciones',
    where: {
      and: [{ fechaHora: { greater_than_equal: desde } }, { fechaHora: { less_than: hasta } }],
    },
    sort: 'fechaHora',
    limit: 0,
    depth: 0,
    pagination: false,
    req,
  })
  return docs.map((f) => ({
    pelicula: idDe(f.pelicula),
    fechaHora: f.fechaHora,
    idioma: f.idioma,
    formato: f.formato,
  })) satisfies FuncionACopiar[]
}

/**
 * Copia a la semana de `lunes` las funciones de la semana anterior. Las que ya existen se saltean
 * y las que ya no son válidas (por ejemplo, la película dejó de estar doblada) quedan afuera.
 */
export async function copiarSemanaAnterior(req: PayloadRequest, lunes: string) {
  const { payload } = req
  const anteriores = await funcionesDeLaSemana(payload, sumarDias(lunes, -7), req)
  const existentes = await funcionesDeLaSemana(payload, lunes, req)
  const nuevas = funcionesACopiar(anteriores, existentes)

  let creadas = 0
  const errores: string[] = []
  for (const f of nuevas) {
    try {
      await payload.create({
        collection: 'funciones',
        data: { ...f, pelicula: Number(f.pelicula) } as Pick<
          Funcione,
          'pelicula' | 'fechaHora' | 'idioma' | 'formato'
        >,
        overrideAccess: false,
        user: req.user,
        req,
      })
      creadas++
    } catch (err) {
      errores.push((err as Error).message)
    }
  }
  return { creadas, omitidas: anteriores.length - creadas, errores }
}

/** POST /cms-api/funciones/copiar-semana { semana: 'AAAA-MM-DD' } (cualquier día de la semana destino). */
export const endpointCopiarSemana: Endpoint = {
  path: '/copiar-semana',
  method: 'post',
  handler: async (req) => {
    if (!tienePermiso(req.user as unknown as UsuarioConPermisos, 'cinevision', 'crear')) {
      return Response.json({ error: 'Sin permiso.' }, { status: 403 })
    }
    const cuerpo = (await req.json?.().catch(() => ({}))) as { semana?: string }
    if (!cuerpo?.semana || !/^\d{4}-\d{2}-\d{2}$/.test(cuerpo.semana)) {
      return Response.json({ error: 'Indicá la semana como AAAA-MM-DD.' }, { status: 400 })
    }
    const resultado = await copiarSemanaAnterior(req, lunesDe(cuerpo.semana))
    return Response.json(resultado)
  },
}
