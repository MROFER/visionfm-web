import { randomBytes } from 'crypto'
import {
  APIError,
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type Endpoint,
  type Payload,
  type PayloadRequest,
} from 'payload'

import { tienePermiso, type UsuarioConPermisos } from '../permisos'
import { validarClave } from './politica-clave'

export const VIGENCIA_INVITACION_MS = 48 * 60 * 60 * 1000

const sitio = () => process.env.NEXT_PUBLIC_SITE_URL ?? ''

/**
 * Manda la invitación: usa el mismo mecanismo que "Olvidé mi contraseña" de Payload (token de un uso
 * en la ficha), pero con 48 h de vigencia. El link abre la pantalla de Payload para elegir contraseña.
 */
export async function enviarInvitacion(payload: Payload, usuario: { id: number | string; email: string; nombre?: string | null }, req?: PayloadRequest) {
  const token = randomBytes(20).toString('hex')
  await payload.db.updateOne({
    collection: 'usuarios',
    id: usuario.id,
    data: {
      resetPasswordToken: token,
      resetPasswordExpiration: new Date(Date.now() + VIGENCIA_INVITACION_MS).toISOString(),
    },
    req,
  })
  const link = `${sitio()}/admin/reset/${token}`
  await payload.sendEmail({
    to: usuario.email,
    subject: 'Te invitaron al panel de Visión 96.5 FM',
    text: [
      `Hola${usuario.nombre ? ` ${usuario.nombre}` : ''}:`,
      '',
      'Te crearon un usuario en el panel de Visión 96.5 FM. Para entrar, elegí tu contraseña en este link (vale 48 horas):',
      link,
      '',
      'La contraseña tiene que tener al menos 12 caracteres. Si el link venció, pedí que te reenvíen la invitación.',
    ].join('\n'),
  })
  return token
}

/**
 * Alta por invitación (docs/07, sección 2): quien gestiona usuarios crea la cuenta sin contraseña;
 * se le pone una al azar que nadie conoce y la persona elige la suya desde el email.
 */
export const prepararInvitacion: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !req.user || !data || data.password) return data
  req.context.invitar = true
  return { ...data, password: randomBytes(32).toString('base64url') }
}

export const mandarInvitacion: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation === 'create' && req.context.invitar) {
    await enviarInvitacion(req.payload, doc, req).catch((err: unknown) =>
      req.payload.logger.error({ err, msg: `No se pudo mandar la invitación a ${doc.email}` }),
    )
  }
  return doc
}

/** Contraseñas: mínimo 12 caracteres y fuera de filtraciones conocidas, también al recuperarla. */
export const exigirClaveSegura: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data?.password || req.context.invitar) return data
  const error = await validarClave(String(data.password))
  if (error) throw new ValidationError({ collection: 'usuarios', errors: [{ path: 'password', message: error }] })
  return data
}

export const exigirClaveSeguraAlRecuperar: CollectionBeforeOperationHook = async ({ args, operation }) => {
  if (operation !== 'resetPassword') return args
  const clave = (args as { data?: { password?: string } }).data?.password
  const error = clave ? await validarClave(clave) : null
  if (error) throw new APIError(error, 400, null, true)
  return args
}

/** POST /cms-api/usuarios/:id/reenviar-invitacion — para cuando el link venció. */
export const reenviarInvitacion: Endpoint = {
  path: '/:id/reenviar-invitacion',
  method: 'post',
  handler: async (req) => {
    const actor = req.user as unknown as UsuarioConPermisos | null
    if (!tienePermiso(actor, 'sistema', 'editarTodo')) return Response.json({ error: 'Sin permiso.' }, { status: 403 })
    const id = req.routeParams?.id as string
    const usuario = await req.payload.findByID({ collection: 'usuarios', id, depth: 0, req }).catch(() => null)
    if (!usuario) return Response.json({ error: 'No existe.' }, { status: 404 })
    if (usuario.esOwner || usuario.activo === false || String(usuario.id) === String(actor?.id)) {
      return Response.json({ error: 'A este usuario no se le reenvía invitación.' }, { status: 400 })
    }
    await enviarInvitacion(req.payload, usuario, req)
    return Response.json({ ok: true, mensaje: `Invitación reenviada a ${usuario.email}.` })
  },
}
