import { createHash } from 'crypto'

export const LARGO_MINIMO = 12

/** `null` si la contraseña cumple el largo mínimo; si no, el motivo (docs/07, "Alta por invitación"). */
export function validarLargo(clave: string): string | null {
  return clave.length >= LARGO_MINIMO ? null : `La contraseña tiene que tener al menos ${LARGO_MINIMO} caracteres.`
}

/**
 * ¿Aparece la contraseña en filtraciones conocidas? Consulta Have I Been Pwned por rango (k-anonymity):
 * solo viajan los primeros 5 caracteres del hash SHA-1, nunca la contraseña.
 * Si el servicio no responde, no bloquea: el largo mínimo sigue valiendo.
 */
export async function estaFiltrada(clave: string, buscar: typeof fetch = fetch): Promise<boolean> {
  const hash = createHash('sha1').update(clave).digest('hex').toUpperCase()
  const prefijo = hash.slice(0, 5)
  const resto = hash.slice(5)
  try {
    const respuesta = await buscar(`https://api.pwnedpasswords.com/range/${prefijo}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    })
    if (!respuesta.ok) return false
    const lineas = (await respuesta.text()).split('\n')
    return lineas.some((linea) => {
      const [sufijo, veces] = linea.trim().split(':')
      return sufijo === resto && Number(veces) > 0
    })
  } catch {
    return false
  }
}

export async function validarClave(clave: string, buscar?: typeof fetch): Promise<string | null> {
  const largo = validarLargo(clave)
  if (largo) return largo
  // En los tests de integración no se consulta el servicio externo (los unitarios lo cubren con un fetch falso)
  if (!buscar && process.env.NODE_ENV === 'test') return null
  if (await estaFiltrada(clave, buscar)) {
    return 'Esa contraseña aparece en filtraciones conocidas. Elegí otra.'
  }
  return null
}
