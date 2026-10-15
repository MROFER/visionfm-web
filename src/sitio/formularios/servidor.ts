// Antispam de los formularios (docs/02-trd.md): Cloudflare Turnstile y 5 envíos por IP por hora.

const HORA = 60 * 60 * 1000
export const ENVIOS_POR_HORA = 5

// En memoria: el sitio corre en un solo proceso en el VPS. Si algún día hay varias réplicas, cada una
// cuenta por su lado, y Turnstile sigue siendo la barrera principal.
const envios = new Map<string, number[]>()

/** Anota un envío y dice si la IP ya pasó el límite de la última hora. */
export function superaLimite(ip: string, ahora = Date.now()): boolean {
  const recientes = (envios.get(ip) ?? []).filter((t) => ahora - t < HORA)
  if (recientes.length >= ENVIOS_POR_HORA) {
    envios.set(ip, recientes)
    return true
  }
  recientes.push(ahora)
  envios.set(ip, recientes)
  // Limpieza para que el mapa no crezca sin fin
  if (envios.size > 5000) {
    for (const [clave, tiempos] of envios) if (!tiempos.some((t) => ahora - t < HORA)) envios.delete(clave)
  }
  return false
}

export function reiniciarLimite() {
  envios.clear()
}

/** IP del visitante: Cloudflare la manda en CF-Connecting-IP; detrás de otro proxy, en X-Forwarded-For. */
export function ipDe(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconocida'
  )
}

/**
 * Verifica el token de Turnstile con Cloudflare. Sin TURNSTILE_SECRET_KEY (desarrollo y tests) no hay
 * verificación; en producción la variable va siempre (docs/02-trd.md), junto con TURNSTILE_SITE_KEY.
 */
export async function verificarTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secreto = process.env.TURNSTILE_SECRET_KEY
  if (!secreto) return true
  if (!token) return false
  try {
    const cuerpo = new URLSearchParams({ secret: secreto, response: token })
    if (ip !== 'desconocida') cuerpo.set('remoteip', ip)
    const respuesta = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: cuerpo,
      signal: AbortSignal.timeout(8000),
    })
    const resultado = (await respuesta.json()) as { success?: boolean }
    return resultado.success === true
  } catch {
    return false
  }
}
