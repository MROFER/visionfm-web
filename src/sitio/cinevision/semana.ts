import { diaEnMontevideo, sumarDias } from '../publicidad/fechas'

// Semanas de la cartelera, de lunes a domingo en hora de Montevideo.
// Uruguay no tiene horario de verano desde 2015: el desfasaje es siempre -03:00.
export const DESFASAJE = '-03:00'

/** El lunes de la semana de `dia` (`AAAA-MM-DD`). */
export function lunesDe(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay() // 0 = domingo
  return sumarDias(dia, -((diaSemana + 6) % 7))
}

/** El lunes de la semana en curso en Montevideo. */
export const lunesActual = (ahora = new Date()) => lunesDe(diaEnMontevideo(ahora))

/** Inicio y fin de la semana como instantes (fin excluido), para consultar `fechaHora`. */
export function rangoSemana(lunes: string) {
  return {
    desde: new Date(`${lunes}T00:00:00${DESFASAJE}`).toISOString(),
    hasta: new Date(`${sumarDias(lunes, 7)}T00:00:00${DESFASAJE}`).toISOString(),
  }
}

const UNA_SEMANA = 7 * 24 * 60 * 60 * 1000

export type FuncionACopiar = {
  pelicula: number | string
  fechaHora: string
  idioma: string
  formato: string
}

const clave = (f: Pick<FuncionACopiar, 'pelicula' | 'fechaHora'>) =>
  `${f.pelicula}|${new Date(f.fechaHora).getTime()}`

/**
 * Las funciones de la semana anterior corridas 7 días, sin las que ya existen en la semana
 * de destino (misma película a la misma hora).
 */
export function funcionesACopiar(anteriores: FuncionACopiar[], existentes: FuncionACopiar[]) {
  const ya = new Set(existentes.map(clave))
  const nuevas: FuncionACopiar[] = []
  for (const f of anteriores) {
    const copia = {
      ...f,
      fechaHora: new Date(new Date(f.fechaHora).getTime() + UNA_SEMANA).toISOString(),
    }
    if (ya.has(clave(copia))) continue
    ya.add(clave(copia))
    nuevas.push(copia)
  }
  return nuevas
}
