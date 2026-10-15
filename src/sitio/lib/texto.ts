/** ["Ana", "Luis", "Marta"] → "Ana, Luis y Marta" */
export function enumerar(nombres: string[]) {
  if (nombres.length < 2) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

type NodoTexto = { text?: unknown; children?: unknown }

/** Cantidad de palabras de un cuerpo de Lexical (el texto de todos sus nodos). */
export function palabrasDeLexical(cuerpo: { root?: NodoTexto } | null | undefined) {
  let total = 0
  const recorrer = (nodo: NodoTexto) => {
    if (typeof nodo.text === 'string') total += nodo.text.split(/\s+/).filter(Boolean).length
    if (Array.isArray(nodo.children)) nodo.children.forEach(recorrer)
  }
  if (cuerpo?.root) recorrer(cuerpo.root)
  return total
}

/** Minutos de lectura a unas 200 palabras por minuto; nunca menos de 1. */
export const minutosDeLectura = (palabras: number) => Math.max(1, Math.round(palabras / 200))
