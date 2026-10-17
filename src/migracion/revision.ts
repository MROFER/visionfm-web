// Decisiones tomadas a mano después de leer el informe de la migración (migracion-informe/).
// Se corrigen acá y se vuelve a correr: la migración las respeta en cada corrida.

export const REVISION: {
  /** Posts que el filtro no detectó pero son spam. */
  spam: number[]
  /** Posts que el filtro marcó como spam pero son notas de la radio. */
  noSpam: number[]
  /** Dominios de enlaces que se sacan del texto de las notas. */
  dominiosSpam: string[]
  /** Sección de una nota puntual, por id del post: gana sobre la de su categoría. */
  seccionDePost: Record<number, string>
} = {
  spam: [],
  noSpam: [],
  dominiosSpam: [],
  seccionDePost: {},
}

/**
 * Categoría del WordPress viejo → slug de la sección nueva. Casi todas las notas están en
 * "Uncategorized", así que la mayoría cae en la sección por defecto de la corrida.
 */
export const SECCION_DE_CATEGORIA: Record<string, string> = {
  deportes: 'deportes',
  policiales: 'policiales',
  nacionales: 'nacionales',
  locales: 'locales',
  'locales-y-nacionales': 'locales',
  'medio-ambiente': 'locales',
  politicas: 'nacionales',
  editoriales: 'opinion',
  opinion: 'opinion',
  'culturales-y-artisticas': 'cultura',
  cultura: 'cultura',
  actividades: 'cultura',
}
