import type { CollectionAfterChangeHook, Payload, PayloadRequest, TaskConfig } from 'payload'

import { configAccess, reemplazarEmails, revocarSesiones } from './cloudflare'

/**
 * Pone en la lista de Access exactamente los emails de los usuarios activos.
 * Desde un hook se pasa `req`, para leer dentro de la misma transacción el cambio que se está guardando.
 */
export async function sincronizarAccess(
  payload: Payload,
  req?: PayloadRequest,
  buscar: typeof fetch = fetch,
) {
  const cfg = configAccess()
  if (!cfg) return { emails: 0, omitido: true }
  const { docs } = await payload.find({
    collection: 'usuarios',
    where: { activo: { not_equals: false } },
    limit: 0,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const emails = await reemplazarEmails(
    cfg,
    docs.map((u) => u.email),
    buscar,
  )
  return { emails, omitido: false }
}

/**
 * Al crear un usuario, cambiarle el email o activarlo y desactivarlo, actualiza la lista de Access.
 * Si Cloudflare falla, el cambio se guarda igual y queda en el log; la tarea de cada hora lo corrige.
 */
export const actualizarListaAccess: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const cfg = configAccess()
  if (!cfg) return doc
  const cambio =
    operation === 'create' ||
    doc.email !== previousDoc?.email ||
    (doc.activo !== false) !== (previousDoc?.activo !== false)
  if (!cambio) return doc

  try {
    await sincronizarAccess(req.payload, req)
    const seDesactivo = doc.activo === false && previousDoc?.activo !== false
    if (seDesactivo) await revocarSesiones(cfg, doc.email)
    // Con el email nuevo, las sesiones abiertas con el viejo también se cierran
    if (operation === 'update' && previousDoc?.email && doc.email !== previousDoc.email) {
      await revocarSesiones(cfg, previousDoc.email)
    }
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `No se pudo actualizar Cloudflare Access para ${doc.email}`,
    })
  }
  return doc
}

/** Red de seguridad: cada hora vuelve a poner la lista en orden. */
export const tareaSincronizarAccess: TaskConfig = {
  slug: 'sincronizarAccess',
  label: 'Sincronizar la lista de Cloudflare Access',
  schedule: [{ cron: '0 0 * * * *', queue: 'default' }],
  outputSchema: [{ name: 'emails', type: 'number' }],
  handler: async ({ req }) => ({
    output: { emails: (await sincronizarAccess(req.payload)).emails },
  }),
}
