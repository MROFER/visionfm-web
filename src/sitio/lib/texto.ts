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

const SALTO = new Set(['paragraph', 'heading', 'listitem', 'quote', 'linebreak', 'tablecell'])

/** Todo el texto de un cuerpo de Lexical, con un salto de línea entre párrafos, títulos e ítems. */
export function textoDeLexical(cuerpo: { root?: NodoTexto } | null | undefined) {
  const recorrer = (nodo: NodoTexto & { type?: unknown }): string => {
    const propio = typeof nodo.text === 'string' ? nodo.text : ''
    const hijos = Array.isArray(nodo.children) ? nodo.children.map(recorrer).join('') : ''
    return propio + hijos + (SALTO.has(String(nodo.type)) ? '\n' : '')
  }
  return cuerpo?.root ? recorrer(cuerpo.root).replace(/\n+/g, '\n').trim() : ''
}

/** Minutos de lectura a unas 200 palabras por minuto; nunca menos de 1. */
export const minutosDeLectura = (palabras: number) => Math.max(1, Math.round(palabras / 200))

/**
 * La transcripción de una entrevista en párrafos: se separan con una línea en blanco, y si uno empieza
 * con "Nombre:" (hasta 40 letras, sin signos de oración), ese nombre es quien habla.
 */
export function parrafosDeTranscripcion(texto: string): { quien: string; dice: string }[] {
  return texto
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^([^:\n.?!¿¡]{1,40}):\s+([\s\S]+)$/)
      return m ? { quien: m[1].trim(), dice: m[2] } : { quien: '', dice: p }
    })
}
