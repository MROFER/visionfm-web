import type { Frase } from './assemblyai'

const LARGO_DE_PARRAFO = 600

/** Un turno largo en párrafos de unas pocas oraciones, para que se pueda leer. */
function enParrafos(texto: string): string[] {
  const oraciones = texto.trim().split(/(?<=[.?!…])\s+/)
  const parrafos: string[] = []
  for (const o of oraciones) {
    const ultimo = parrafos.at(-1)
    if (ultimo && ultimo.length + o.length < LARGO_DE_PARRAFO)
      parrafos[parrafos.length - 1] = `${ultimo} ${o}`
    else parrafos.push(o)
  }
  return parrafos.filter(Boolean)
}

/** Sin los signos que hacen que la página no lo tome como nombre (src/sitio/lib/texto.ts). */
const comoNombre = (nombre: string) =>
  nombre
    .replace(/[:\n.?!¿¡]/g, '')
    .trim()
    .slice(0, 40)

/**
 * El texto para el campo Transcripción. El servicio no sabe los nombres: quien más habla es el
 * entrevistado y el resto, el programa. Si habla uno solo, va sin nombres. La radio corrige lo que
 * haga falta en el panel.
 */
export function armarTranscripcion(
  frases: Frase[],
  nombres: { entrevistado: string; programa: string },
): string {
  // Frases seguidas de la misma persona son un solo turno
  const turnos = frases
    .filter((f) => f.texto.trim())
    .reduce<Frase[]>((acc, f) => {
      const ultimo = acc.at(-1)
      if (ultimo?.hablante === f.hablante) ultimo.texto = `${ultimo.texto} ${f.texto.trim()}`
      else acc.push({ hablante: f.hablante, texto: f.texto.trim() })
      return acc
    }, [])
  const palabras = new Map<string, number>()
  for (const t of turnos)
    palabras.set(t.hablante, (palabras.get(t.hablante) ?? 0) + t.texto.split(/\s+/).length)
  const conNombres = palabras.size > 1
  const principal = [...palabras].sort((a, b) => b[1] - a[1])[0]?.[0]
  const nombre = (hablante: string) =>
    comoNombre(hablante === principal ? nombres.entrevistado : nombres.programa) || 'Visión FM'

  return turnos
    .flatMap((t) =>
      enParrafos(t.texto).map((p, i) =>
        conNombres && i === 0 ? `${nombre(t.hablante)}: ${p}` : p,
      ),
    )
    .join('\n\n')
}
