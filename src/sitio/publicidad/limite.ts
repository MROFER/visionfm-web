// Tope de impresiones por conexión (POST /api/anuncios/impresiones). En memoria, como el límite de los
// formularios: el sitio corre en un solo proceso.

const MINUTO = 60_000
export const IMPRESIONES_POR_MINUTO = 60

const recientes = new Map<string, number[]>()

/** Anota `cantidad` impresiones y dice si la IP se pasa del tope del último minuto. */
export function superaLimiteImpresiones(ip: string, cantidad: number, ahora = Date.now()) {
  const tiempos = (recientes.get(ip) ?? []).filter((t) => ahora - t < MINUTO)
  if (tiempos.length + cantidad > IMPRESIONES_POR_MINUTO) {
    recientes.set(ip, tiempos)
    return true
  }
  recientes.set(ip, [...tiempos, ...Array<number>(cantidad).fill(ahora)])
  if (recientes.size > 5000) {
    for (const [clave, t] of recientes) if (!t.some((x) => ahora - x < MINUTO)) recientes.delete(clave)
  }
  return false
}

export function reiniciarLimiteImpresiones() {
  recientes.clear()
}
