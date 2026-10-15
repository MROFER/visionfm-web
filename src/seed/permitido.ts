/**
 * `pnpm seed` solo corre en local, staging y la demo (docs/02-trd.md, sección 2):
 * producción nunca recibe datos de ejemplo.
 */
export function puedeSembrar(
  sitio: string | undefined,
): { ok: true } | { ok: false; motivo: string } {
  if (!sitio)
    return { ok: false, motivo: 'Falta NEXT_PUBLIC_SITE_URL: no sé en qué entorno estoy.' }
  let host: string
  try {
    host = new URL(sitio).hostname
  } catch {
    return { ok: false, motivo: `NEXT_PUBLIC_SITE_URL no es una URL: ${sitio}` }
  }
  const permitido =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.split('.')[0].endsWith('staging') ||
    host.startsWith('staging.') ||
    host.startsWith('visionfm-labs')
  return permitido
    ? { ok: true }
    : {
        ok: false,
        motivo: `${host} no es local, staging ni la demo.`,
      }
}
