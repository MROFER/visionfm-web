import type { Endpoint, Payload, TaskConfig } from 'payload'

import { slugify } from '@/base/lib/slug'
import { tienePermiso, type UsuarioConPermisos } from '@/base/permisos'
import { diaEnMontevideo, mediodiaUTC, mesAnterior, mesDe, sumarDias } from './fechas'
import { csvMetricas, type Metrica, pdfReporte, resumirMetricas } from './reporte'
import { anunciosPorVencer, DIAS_DE_AVISO, textoAvisoVencimiento } from './vencimientos'

// Tareas programadas de publicidad (docs/03-flujos.md, P6 y P11).
// Los cron van en UTC: Montevideo es UTC-3 todo el año.

/** Avisa a quienes administran publicidad de los anuncios que vencen dentro de 7 días. */
export async function avisarVencimientos(payload: Payload, hoy = new Date()) {
  const objetivo = sumarDias(diaEnMontevideo(hoy), DIAS_DE_AVISO)
  const { docs } = await payload.find({
    collection: 'anuncios',
    where: {
      and: [
        { activo: { equals: true } },
        { hasta: { greater_than_equal: `${sumarDias(objetivo, -1)}T00:00:00.000Z` } },
        { hasta: { less_than: `${sumarDias(objetivo, 2)}T00:00:00.000Z` } },
      ],
    },
    limit: 0,
    depth: 0,
    pagination: false,
  })
  const anuncios = anunciosPorVencer(docs, hoy)
  if (anuncios.length === 0) return { anuncios: 0, avisados: 0 }

  const { docs: usuarios } = await payload.find({
    collection: 'usuarios',
    where: { activo: { equals: true } },
    limit: 0,
    depth: 0,
    pagination: false,
  })
  const destinatarios = usuarios.filter((u) =>
    tienePermiso(u as unknown as UsuarioConPermisos, 'publicidad', 'editarTodo'),
  )
  const asunto =
    anuncios.length === 1
      ? `Vence un anuncio: ${anuncios[0].nombre}`
      : `Vencen ${anuncios.length} anuncios en ${DIAS_DE_AVISO} días`
  for (const u of destinatarios) {
    await payload
      .sendEmail({ to: u.email, subject: asunto, text: textoAvisoVencimiento(anuncios) })
      .catch((err: unknown) => payload.logger.error({ err, msg: `No se pudo avisar a ${u.email}` }))
  }
  return { anuncios: anuncios.length, avisados: destinatarios.length }
}

/** PDF con impresiones y clics de los anuncios de un anunciante en un mes (`AAAA-MM`). */
export async function reporteDeAnunciante(payload: Payload, anunciante: string, clave: string) {
  const mes = mesDe(clave)
  const { docs: anuncios } = await payload.find({
    collection: 'anuncios',
    where: { anunciante: { equals: anunciante } },
    limit: 0,
    depth: 0,
    pagination: false,
  })
  const metricas =
    anuncios.length === 0
      ? []
      : (
          await payload.find({
            collection: 'anunciosMetricas',
            where: {
              and: [
                { anuncio: { in: anuncios.map((a) => a.id) } },
                { fecha: { greater_than_equal: `${mes.desde}T00:00:00.000Z` } },
                { fecha: { less_than_equal: `${mes.hasta}T23:59:59.999Z` } },
              ],
            },
            limit: 0,
            depth: 0,
            pagination: false,
          })
        ).docs
  const filas = resumirMetricas(anuncios, metricas as Metrica[])
  return { anuncios, mes, pdf: await pdfReporte({ anunciante, mes: mes.nombre, filas }) }
}

/** El día 1 manda a cada anunciante con email de reporte el PDF del mes anterior. */
export async function enviarReportesMensuales(payload: Payload, hoy = new Date()) {
  const mes = mesAnterior(hoy)
  const { docs } = await payload.find({
    collection: 'anuncios',
    where: {
      and: [
        { emailReporte: { exists: true } },
        { desde: { less_than_equal: mediodiaUTC(mes.hasta) } },
        { hasta: { greater_than_equal: mediodiaUTC(mes.desde) } },
      ],
    },
    limit: 0,
    depth: 0,
    pagination: false,
  })
  const emailsPorAnunciante = new Map<string, Set<string>>()
  for (const a of docs) {
    if (!a.emailReporte) continue
    const emails = emailsPorAnunciante.get(a.anunciante) ?? new Set<string>()
    emails.add(a.emailReporte.toLowerCase())
    emailsPorAnunciante.set(a.anunciante, emails)
  }

  let enviados = 0
  for (const [anunciante, emails] of emailsPorAnunciante) {
    const { pdf } = await reporteDeAnunciante(payload, anunciante, mes.clave)
    try {
      await payload.sendEmail({
        to: [...emails].join(', '),
        subject: `Reporte de publicidad de ${mes.nombre} · Visión 96.5 FM`,
        text: `Hola. Te mandamos adjunto el reporte de impresiones y clics de tus anuncios en ${mes.nombre}.\n\nVisión 96.5 FM`,
        attachments: [
          {
            filename: `reporte-${mes.clave}.pdf`,
            content: Buffer.from(pdf),
            contentType: 'application/pdf',
          },
        ],
      })
      enviados++
    } catch (err) {
      payload.logger.error({ err, msg: `No se pudo mandar el reporte de ${anunciante}` })
    }
  }
  return { anunciantes: emailsPorAnunciante.size, enviados }
}

export const tareasPublicidad: TaskConfig[] = [
  {
    slug: 'avisoVencimientoAnuncios',
    label: 'Aviso de anuncios por vencer',
    // Todos los días a las 9:00 de Montevideo
    schedule: [{ cron: '0 0 12 * * *', queue: 'default' }],
    outputSchema: [
      { name: 'anuncios', type: 'number' },
      { name: 'avisados', type: 'number' },
    ],
    handler: async ({ req }) => ({ output: await avisarVencimientos(req.payload) }),
  },
  {
    slug: 'reporteMensualAnunciantes',
    label: 'Reporte mensual a anunciantes',
    // El día 1 de cada mes a las 8:00 de Montevideo
    schedule: [{ cron: '0 0 11 1 * *', queue: 'default' }],
    outputSchema: [
      { name: 'anunciantes', type: 'number' },
      { name: 'enviados', type: 'number' },
    ],
    handler: async ({ req }) => ({ output: await enviarReportesMensuales(req.payload) }),
  },
]

/** GET /cms-api/anuncios/reporte?anunciante=…&mes=AAAA-MM: el mismo PDF, para bajarlo desde el panel. */
export const descargarReporte: Endpoint = {
  path: '/reporte',
  method: 'get',
  handler: async (req) => {
    if (!tienePermiso(req.user as unknown as UsuarioConPermisos, 'publicidad', 'ver')) {
      return Response.json({ error: 'Sin permiso.' }, { status: 403 })
    }
    const anunciante = req.searchParams.get('anunciante')?.trim()
    const mes = req.searchParams.get('mes') ?? ''
    if (!anunciante || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
      return Response.json(
        { error: 'Indicá el anunciante y el mes como AAAA-MM.' },
        { status: 400 },
      )
    }
    const { anuncios, pdf } = await reporteDeAnunciante(req.payload, anunciante, mes)
    if (anuncios.length === 0) {
      return Response.json({ error: 'No hay anuncios de ese anunciante.' }, { status: 404 })
    }
    const nombre = `reporte-${slugify(anunciante)}-${mes}.pdf`
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}

/** GET /cms-api/anuncios/{id}/metricas: impresiones y clics del anuncio por día y ubicación, en CSV. */
export const descargarMetricas: Endpoint = {
  path: '/:id/metricas',
  method: 'get',
  handler: async (req) => {
    if (!tienePermiso(req.user as unknown as UsuarioConPermisos, 'publicidad', 'ver')) {
      return Response.json({ error: 'Sin permiso.' }, { status: 403 })
    }
    const id = Number(req.routeParams?.id)
    const anuncio = Number.isInteger(id)
      ? await req.payload.findByID({ collection: 'anuncios', id, depth: 0 }).catch(() => null)
      : null
    if (!anuncio) return Response.json({ error: 'No existe ese anuncio.' }, { status: 404 })
    const { docs } = await req.payload.find({
      collection: 'anunciosMetricas',
      where: { anuncio: { equals: id } },
      limit: 0,
      depth: 0,
      pagination: false,
    })
    return new Response(csvMetricas(docs as Metrica[]), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="metricas-${slugify(anuncio.nombre) || id}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}
