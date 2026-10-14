import { revalidateTag } from 'next/cache'

/** Lo que hay que refrescar después de un cambio: etiquetas de Next y rutas para purgar en Cloudflare. */
export type Afectado = {
  etiquetas: string[]
  rutas: string[]
  /** Cambios que se ven en todas las páginas (ajustes generales): se purga toda la caché de Cloudflare. */
  todo?: boolean
}

export const nada: Afectado = { etiquetas: [], rutas: [] }

export function unir(...partes: Afectado[]): Afectado {
  return {
    etiquetas: [...new Set(partes.flatMap((p) => p.etiquetas))],
    rutas: [...new Set(partes.flatMap((p) => p.rutas))],
    todo: partes.some((p) => p.todo),
  }
}

/** Cloudflare acepta hasta 30 URL por pedido de purga en el plan gratis. */
export const URLS_POR_PURGA = 30

type Registro = { info: (msg: string) => void; error: (obj: object) => void }

/**
 * Purga en Cloudflare las rutas afectadas (o todo). Sin CF_ZONE_ID / CF_API_TOKEN (desarrollo y tests)
 * no hace nada. Un error de purga no frena el guardado: queda en el log y la caché vence sola.
 */
export async function purgarCloudflare(
  afectado: Afectado,
  log: Registro,
  buscar: typeof fetch = fetch,
) {
  const zona = process.env.CF_ZONE_ID
  const token = process.env.CF_API_TOKEN
  const sitio = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!zona || !token || !sitio) return 0

  const cuerpos = afectado.todo
    ? [{ purge_everything: true }]
    : Array.from({ length: Math.ceil(afectado.rutas.length / URLS_POR_PURGA) }, (_, i) => ({
        files: afectado.rutas
          .slice(i * URLS_POR_PURGA, (i + 1) * URLS_POR_PURGA)
          .map((r) => `${sitio}${r}`),
      }))

  let enviados = 0
  for (const cuerpo of cuerpos) {
    try {
      const respuesta = await buscar(
        `https://api.cloudflare.com/client/v4/zones/${zona}/purge_cache`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(cuerpo),
          signal: AbortSignal.timeout(5000),
        },
      )
      if (!respuesta.ok) throw new Error(`Cloudflare respondió ${respuesta.status}`)
      enviados++
    } catch (err) {
      log.error({ err, msg: 'No se pudo purgar la caché de Cloudflare' })
    }
  }
  return enviados
}

/** Revalida las etiquetas de Next. Fuera de un pedido de Next (scripts, tests) no hay caché que revalidar. */
export function revalidarEtiquetas(etiquetas: string[]) {
  for (const etiqueta of etiquetas) {
    try {
      revalidateTag(etiqueta, 'max')
    } catch {
      // Sin contexto de Next (por ejemplo, `pnpm seed` o los tests): no hay nada cacheado
    }
  }
}

export async function refrescar(afectado: Afectado, log: Registro, buscar?: typeof fetch) {
  if (!afectado.todo && afectado.etiquetas.length === 0 && afectado.rutas.length === 0) return
  revalidarEtiquetas(afectado.etiquetas)
  await purgarCloudflare(afectado, log, buscar)
}
