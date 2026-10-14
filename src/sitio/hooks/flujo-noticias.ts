import {
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
} from 'payload'

import { PERMISOS_DE_FABRICA, ROLES, tienePermiso, type UsuarioConPermisos } from '@/base/permisos'
import {
  avisoPorCambio,
  recibeAlInstante,
  validarTransicion,
  type DestinatarioPosible,
  type Estado,
} from '../lib/flujo-editorial'

const idDe = (valor: unknown) =>
  valor && typeof valor === 'object' ? (valor as { id: number }).id : valor

/**
 * Aplica el flujo editorial en el servidor (docs/03-flujos.md, P2): valida el cambio de estado según
 * los permisos de quien guarda y completa quién aprobó, quién publicó y las fechas.
 */
export const aplicarFlujoEditorial: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  const usuario = req.user as unknown as UsuarioConPermisos | null
  const anterior = (originalDoc?.estadoEditorial ?? null) as Estado | null
  const publicando = data._status === 'published'
  const ahora = new Date().toISOString()

  // Quién aprobó y quién publicó los pone el servidor, nunca el pedido
  data.aprobadoPor = idDe(originalDoc?.aprobadoPor) ?? null
  data.publicadoPor = idDe(originalDoc?.publicadoPor) ?? null

  // Publicación programada: la hace el sistema, sin usuario
  if (!usuario) {
    if (publicando) {
      data.estadoEditorial = 'publicada'
      data.fechaPublicacion ??= originalDoc?.fechaPublicacion ?? ahora
    }
    return data
  }

  const capacidades = {
    puedePublicar: tienePermiso(usuario, 'noticias', 'publicar'),
    puedeAprobar: tienePermiso(usuario, 'noticias', 'aprobar'),
  }
  let nuevo = (data.estadoEditorial ?? anterior ?? 'borrador') as Estado

  if (publicando && capacidades.puedePublicar) nuevo = 'publicada'
  // P2d: quien no publica y corrige una nota publicada deja la corrección pendiente de revisión
  if (
    !publicando &&
    operation === 'update' &&
    anterior === 'publicada' &&
    !capacidades.puedePublicar
  ) {
    nuevo = nuevo === 'publicada' ? 'en-revision' : nuevo
  }
  if (nuevo === 'publicada' && !publicando && anterior !== 'publicada') {
    throw new ValidationError({
      collection: 'noticias',
      errors: [{ path: 'estadoEditorial', message: 'Para publicar usá el botón "Publicar".' }],
    })
  }

  const error = validarTransicion(
    anterior,
    nuevo,
    capacidades,
    data.comentarioEditor ?? originalDoc?.comentarioEditor,
  )
  if (error) {
    throw new ValidationError({
      collection: 'noticias',
      errors: [{ path: 'estadoEditorial', message: error }],
    })
  }

  data.estadoEditorial = nuevo
  if (nuevo === 'aprobada' && anterior !== 'aprobada') data.aprobadoPor = usuario.id
  if (nuevo === 'publicada' && anterior !== 'publicada') {
    data.publicadoPor = usuario.id
    if (anterior === 'en-revision' || anterior === 'aprobada') data.aprobadoPor ??= usuario.id
    data.fechaPublicacion ??= originalDoc?.fechaPublicacion ?? ahora
  } else if (nuevo === 'publicada' && publicando && operation === 'update') {
    data.fechaActualizacion = ahora
  }
  return data
}

const ROLES_QUE_APRUEBAN = ROLES.filter((rol) =>
  PERMISOS_DE_FABRICA[rol].noticias.includes('aprobar'),
)

/** Avisos por email al cambiar de estado. Si el email falla, la nota se guarda igual y queda en el log. */
export const avisarCambioDeEstado: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const aviso = avisoPorCambio(previousDoc?.estadoEditorial, doc.estadoEditorial, doc.titulo)
  if (!aviso) return doc

  let destinatarios: DestinatarioPosible[] = []
  if (aviso.para === 'editores') {
    const { docs } = await req.payload.find({
      collection: 'usuarios',
      where: {
        and: [
          { recibeAvisosRevision: { equals: true } },
          {
            or: [
              { rol: { in: ROLES_QUE_APRUEBAN } },
              { ajusteNoticiasPublicar: { equals: 'permitir' } },
            ],
          },
        ],
      },
      pagination: false,
      depth: 0,
      req,
    })
    destinatarios = (docs as DestinatarioPosible[]).filter(
      (u) =>
        tienePermiso(u as unknown as UsuarioConPermisos, 'noticias', 'aprobar') &&
        String(u.id) !== String(req.user?.id),
    )
  } else if (doc.autor) {
    const autor = await req.payload
      .findByID({ collection: 'usuarios', id: idDe(doc.autor) as number, depth: 0, req })
      .catch(() => null)
    if (autor && String(autor.id) !== String(req.user?.id))
      destinatarios = [autor as DestinatarioPosible]
  }

  const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/collections/noticias/${doc.id}`
  const comentario =
    aviso.para === 'autor' && doc.estadoEditorial === 'devuelta'
      ? `\n\nComentario: ${doc.comentarioEditor}`
      : ''
  await Promise.all(
    destinatarios.filter(recibeAlInstante).map((u) =>
      req.payload
        .sendEmail({
          to: u.email,
          subject: aviso.asunto,
          text: `${aviso.asunto}${comentario}\n\nAbrirla en el panel: ${link}`,
        })
        .catch((err: unknown) =>
          req.payload.logger.error({ err, msg: `No se pudo avisar a ${u.email}` }),
        ),
    ),
  )
  return doc
}
