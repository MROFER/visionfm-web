// Lista de Cloudflare Access (docs/07-permisos-y-publicidad.md, "Cómo se entra al panel"):
// solo pasan los emails de usuarios activos. La lista es un grupo de Access que usa la política
// de la aplicación del panel; el panel reemplaza sus emails cada vez que cambia un usuario.

const API = 'https://api.cloudflare.com/client/v4'

export type ConfigAccess = { cuenta: string; token: string; grupo: string }
type Buscar = typeof fetch

/** `null` en local y en tests: sin Cloudflare no hay nada que sincronizar. */
export function configAccess(
  env: Record<string, string | undefined> = process.env,
): ConfigAccess | null {
  const { CF_ACCOUNT_ID, CF_ACCESS_TOKEN, CF_ACCESS_GROUP_ID } = env
  if (!CF_ACCOUNT_ID || !CF_ACCESS_TOKEN || !CF_ACCESS_GROUP_ID) return null
  return { cuenta: CF_ACCOUNT_ID, token: CF_ACCESS_TOKEN, grupo: CF_ACCESS_GROUP_ID }
}

/** Emails en minúscula, sin repetir y ordenados, para que la lista no cambie sin motivo. */
export const normalizarEmails = (emails: string[]) =>
  [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))].sort()

async function llamar(cfg: ConfigAccess, ruta: string, init: RequestInit, buscar: Buscar) {
  const respuesta = await buscar(`${API}/accounts/${cfg.cuenta}/access${ruta}`, {
    ...init,
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  const cuerpo = (await respuesta.json().catch(() => null)) as {
    success?: boolean
    result?: { name?: string }
    errors?: { message: string }[]
  } | null
  if (!respuesta.ok || !cuerpo?.success) {
    const detalle = cuerpo?.errors?.map((e) => e.message).join('; ') || `HTTP ${respuesta.status}`
    throw new Error(`Cloudflare Access: ${detalle}`)
  }
  return cuerpo.result
}

/** Reemplaza los emails del grupo por los de los usuarios activos. */
export async function reemplazarEmails(
  cfg: ConfigAccess,
  emails: string[],
  buscar: Buscar = fetch,
) {
  const grupo = await llamar(cfg, `/groups/${cfg.grupo}`, { method: 'GET' }, buscar)
  const lista = normalizarEmails(emails)
  // Un grupo vacío dejaría pasar a nadie, pero Cloudflare no acepta `include` vacío
  if (lista.length === 0)
    throw new Error('Cloudflare Access: no hay usuarios activos para la lista.')
  await llamar(
    cfg,
    `/groups/${cfg.grupo}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: grupo?.name,
        include: lista.map((email) => ({ email: { email } })),
      }),
    },
    buscar,
  )
  return lista.length
}

/** Cierra al instante las sesiones de Access de un email (al desactivar un usuario). */
export async function revocarSesiones(cfg: ConfigAccess, email: string, buscar: Buscar = fetch) {
  await llamar(
    cfg,
    '/organizations/revoke_user',
    { method: 'POST', body: JSON.stringify({ email: email.toLowerCase() }) },
    buscar,
  )
}
