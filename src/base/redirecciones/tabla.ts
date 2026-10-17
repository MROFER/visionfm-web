// Redirecciones de las direcciones viejas (docs/04-esquema.md): las sirve src/proxy.ts antes de llegar a
// las páginas, así una nota vieja responde 301 a la nueva y una URL de spam 410, en un solo salto.

export type Destino = { tipo: '301' | '302'; hacia: string } | { tipo: '410' }

/** `desde` → destino. Se guarda sin la barra final, que WordPress ponía y el sitio nuevo no usa. */
export type Tabla = Record<string, Destino>

export const sinBarra = (ruta: string) => (ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta)

function decodificar(ruta: string) {
  try {
    return decodeURI(ruta)
  } catch {
    return ruta
  }
}

export function armarTabla(filas: { desde: string; hacia?: string | null; tipo: string }[]): Tabla {
  const tabla: Tabla = {}
  for (const { desde, hacia, tipo } of filas) {
    const clave = sinBarra(decodificar(desde))
    if (tipo === '410') tabla[clave] = { tipo: '410' }
    else if (hacia && (tipo === '301' || tipo === '302')) tabla[clave] = { tipo, hacia }
  }
  return tabla
}

/** El destino de una ruta pedida (tal como llega, con %), o `null` si no tiene redirección. */
export function buscar(tabla: Tabla, ruta: string): Destino | null {
  const destino = tabla[sinBarra(decodificar(ruta))]
  // Una redirección a la misma ruta haría un bucle
  if (
    !destino ||
    (destino.tipo !== '410' && sinBarra(destino.hacia) === sinBarra(decodificar(ruta)))
  )
    return null
  return destino
}
