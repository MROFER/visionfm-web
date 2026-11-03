import type { MetadataRoute } from 'next'

// Qué puede leer cada bot (robots.txt). Hay dos tipos de bots de IA: los que leen una página para
// contestarle a una persona, que citan el sitio y mandan visitas, y los que la copian para entrenar
// modelos, que no mandan nada. Los primeros entran siempre; los segundos, no.

/** Lo que no son páginas: el panel, la API y los links de salida de los anuncios, que cuentan clics. */
export const PRIVADO = ['/admin', '/cms-api', '/api/', '/a/']

/** Leen para responder en ChatGPT, Claude y Perplexity. Google y Bing responden con su bot de siempre. */
export const BOTS_DE_RESPUESTA = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
]

/**
 * Copian para entrenar modelos. Google-Extended no está a propósito: bloquearlo también puede sacar a
 * la radio de las respuestas de Gemini.
 */
export const BOTS_DE_ENTRENAMIENTO = [
  'GPTBot',
  'ClaudeBot',
  'CCBot',
  'Applebot-Extended',
  'meta-externalagent',
]

export function reglasDeRobots(): MetadataRoute.Robots['rules'] {
  return [
    { userAgent: '*', allow: '/', disallow: PRIVADO },
    // Un bot que tiene su propio bloque no lee el de "*": por eso repite lo privado
    { userAgent: BOTS_DE_RESPUESTA, allow: '/', disallow: PRIVADO },
    { userAgent: BOTS_DE_ENTRENAMIENTO, disallow: '/' },
  ]
}
