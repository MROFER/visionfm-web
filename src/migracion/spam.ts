import { REVISION } from './revision'
import { terminosDe, type PostWp } from './wordpress'

// El WordPress viejo está comprometido: tiene entradas de casinos y enlaces ocultos en notas reales
// (docs/01-prd.md). Lo que se detecta acá se revisa a mano en el informe y se corrige en revision.ts.

const PALABRAS_SPAM =
  /\b(1\s?x\s?bet|1\s?win|casinos?|casino[ -]online|plinko|aviator|slots?|tragamonedas|apuestas? (deportivas|en l[ií]nea|online)|bookmaker|betting|pin[- ]?up|mostbet|melbet|vavada|bet365|betwinner|parimatch|kazino|jackpot|free spins?|giros gratis|bonus sin dep[oó]sito|crypto casino|viagra|cialis|escort|loan|pr[eé]stamos? r[aá]pidos? online)\b/i

// Títulos en alfabetos que la radio no usa: cirílico, árabe, hangul, bengalí, etc.
const OTRO_ALFABETO = /[Ѐ-ӿ؀-ۿঀ-৿가-힯぀-ヿ฀-๿]/

const sinHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#\w]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Por qué un post parece spam, o `null` si parece una nota de la radio. */
export function motivoSpam(post: PostWp): string | null {
  if (REVISION.noSpam.includes(post.id)) return null
  if (REVISION.spam.includes(post.id)) return 'marcado a mano en revision.ts'

  const titulo = sinHtml(post.title.rendered)
  if (OTRO_ALFABETO.test(titulo)) return 'título en otro alfabeto'
  const enTitulo = titulo.match(PALABRAS_SPAM) ?? decodeURIComponent(post.slug).match(PALABRAS_SPAM)
  if (enTitulo) return `"${enTitulo[0]}" en el título`
  const termino = terminosDe(post).find(
    (t) => PALABRAS_SPAM.test(t.name) || OTRO_ALFABETO.test(t.name),
  )
  if (termino) return `categoría o etiqueta "${termino.name}"`
  // Una nota real puede nombrar un casino una vez; el spam lo repite
  const texto = sinHtml(post.content.rendered)
  const veces = texto.match(new RegExp(PALABRAS_SPAM.source, 'gi'))?.length ?? 0
  if (veces >= 3) return `${veces} menciones de apuestas o casinos en el texto`
  return null
}

const OCULTO =
  /display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(px|pt|em)?\s*(;|$)|(left|top)\s*:\s*-\d{3,}|height\s*:\s*0(px)?\s*;[^"]*overflow\s*:\s*hidden|opacity\s*:\s*0(\.0+)?\s*(;|$)/i

const esEnlaceSpam = (a: Element) =>
  PALABRAS_SPAM.test(a.getAttribute('href') ?? '') ||
  PALABRAS_SPAM.test(a.textContent ?? '') ||
  REVISION.dominiosSpam.some((d) => (a.getAttribute('href') ?? '').includes(d))

/**
 * Saca del HTML de una nota lo inyectado por el hackeo: bloques ocultos con CSS y enlaces a casinos
 * (de esos queda el texto, sin el enlace). Devuelve cuántos enlaces sacó, para el informe.
 */
export function limpiarSpam(documento: Document): { enlaces: number; bloques: number } {
  let enlaces = 0
  let bloques = 0
  for (const elemento of [...documento.querySelectorAll('[style], [hidden]')]) {
    if (!elemento.isConnected) continue
    if (elemento.hasAttribute('hidden') || OCULTO.test(elemento.getAttribute('style') ?? '')) {
      enlaces += elemento.querySelectorAll('a').length + (elemento.tagName === 'A' ? 1 : 0)
      bloques++
      elemento.remove()
    }
  }
  for (const a of [...documento.querySelectorAll('a')]) {
    if (!esEnlaceSpam(a)) continue
    enlaces++
    a.replaceWith(documento.createTextNode(a.textContent ?? ''))
  }
  return { enlaces, bloques }
}

/** Direcciones del sitemap viejo que son spam aunque no sean posts (categorías y etiquetas de casinos). */
export function esRutaSpam(ruta: string): boolean {
  const legible = ruta.replace(/[-_/]+/g, ' ')
  return PALABRAS_SPAM.test(legible) || OTRO_ALFABETO.test(legible)
}
