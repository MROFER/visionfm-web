/** Campos que nunca se guardan en el registro: secretos de autenticación y marcas automáticas. */
const IGNORADOS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'password',
  'hash',
  'salt',
  'sessions',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'loginAttempts',
  'lockUntil',
  '_verificationToken',
])

type Doc = Record<string, unknown> | null | undefined

/** Solo los campos que cambiaron, con su valor anterior y el nuevo. */
export function diferencias(antes: Doc, despues: Doc) {
  const claves = new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])
  const campos: string[] = []
  const a: Record<string, unknown> = {}
  const d: Record<string, unknown> = {}

  for (const clave of claves) {
    if (IGNORADOS.has(clave)) continue
    const valorAntes = normalizar(antes?.[clave])
    const valorDespues = normalizar(despues?.[clave])
    if (JSON.stringify(valorAntes) === JSON.stringify(valorDespues)) continue
    campos.push(clave)
    a[clave] = valorAntes ?? null
    d[clave] = valorDespues ?? null
  }

  return { campos, antes: a, despues: d }
}

// Las relaciones llegan pobladas en un lado y como id en el otro: se comparan por id
function normalizar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(normalizar)
  if (valor && typeof valor === 'object' && 'id' in valor) return (valor as { id: unknown }).id
  return valor
}

/** "celular" o "computadora" a partir del User-Agent, más el texto original. */
export function dispositivoDe(userAgent: string | null | undefined) {
  if (!userAgent) return null
  const tipo = /Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'celular' : 'computadora'
  return `${tipo} · ${userAgent.slice(0, 200)}`
}

/** IP real del visitante: Cloudflare la manda en CF-Connecting-IP. */
export function ipDe(headers: Headers | undefined) {
  if (!headers) return null
  return headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}
