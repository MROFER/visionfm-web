import type { Imagen } from '../datos/formas'
import { UBICACIONES } from './ubicaciones'

// Rotación de anuncios (docs/07-permisos-y-publicidad.md, sección 3). La comparten el servidor, que
// arma la lista de vigentes, y el navegador, que elige uno por visita según el peso.

export type Ubicacion = (typeof UBICACIONES)[number]['value']

export const esUbicacion = (valor: unknown): valor is Ubicacion =>
  typeof valor === 'string' && UBICACIONES.some((u) => u.value === valor)

/** Ubicaciones donde el anuncio se puede limitar a algunas secciones de Noticias. */
export const CON_SECCION: Ubicacion[] = [
  'noticias-seccion',
  'noticias-seccion-abajo',
  'noticias-nota',
  'noticias-nota-abajo',
]

/**
 * Cómo sale un anuncio al final de la nota, elegido al subirlo: tira (728×90 en web, 320×100 en el
 * celular), cuadrado (300×250; en web, de a varios anuncios distintos) o ancho (970×250, solo en web).
 */
export const FORMATOS_FINAL_NOTA = ['tira', 'cuadrado', 'ancho'] as const
export type FormatoFinalNota = (typeof FORMATOS_FINAL_NOTA)[number]

/** Lo que el navegador necesita para mostrar un anuncio. El link de destino lo resuelve `/a/{id}`. */
export type AnuncioRotable = {
  id: number
  peso: number
  web: Imagen | null
  movil: Imagen | null
  rectangulo: Imagen | null
  /** La de 970×250, para el formato ancho del final de la nota. */
  ancha: Imagen | null
  formato: FormatoFinalNota
}

/** Elige uno al azar: un anuncio de peso 2 sale el doble de veces que uno de peso 1. */
export function elegirAnuncio<T extends { peso: number }>(lista: T[], azar = Math.random): T | null {
  const total = lista.reduce((suma, a) => suma + Math.max(1, a.peso), 0)
  if (total === 0) return null
  let punto = azar() * total
  for (const anuncio of lista) {
    punto -= Math.max(1, anuncio.peso)
    if (punto < 0) return anuncio
  }
  return lista[lista.length - 1]
}

/** Elige `cantidad` distintos, cada uno según su peso entre los que quedan. */
export function elegirVarios<T extends { peso: number }>(
  lista: T[],
  cantidad: number,
  azar = Math.random,
): T[] {
  const quedan = [...lista]
  const elegidos: T[] = []
  while (elegidos.length < cantidad && quedan.length > 0) {
    const uno = elegirAnuncio(quedan, azar)!
    elegidos.push(uno)
    quedan.splice(quedan.indexOf(uno), 1)
  }
  return elegidos
}

/**
 * Al final de la nota sale uno según el peso, en su formato. Si es cuadrado, en web van al lado otros
 * cuadrados distintos hasta `lugares`; los lugares que no se llenan los completa quien lo muestra.
 */
export function elegirFinalDeNota<
  T extends { peso: number; formato: FormatoFinalNota; rectangulo: unknown },
>(lista: T[], lugares: number, azar = Math.random): { principal: T | null; cuadrados: T[] } {
  const principal = elegirAnuncio(lista, azar)
  if (!principal || principal.formato !== 'cuadrado' || !principal.rectangulo) {
    return { principal, cuadrados: [] }
  }
  const otros = lista.filter((a) => a !== principal && a.formato === 'cuadrado' && a.rectangulo)
  return { principal, cuadrados: [principal, ...elegirVarios(otros, lugares - 1, azar)] }
}

type Vigencia = { desde: string; hasta: string; activo?: boolean | null }

/**
 * Vigente en el día `hoy` (AAAA-MM-DD de Montevideo): las fechas son de solo día y se guardan a las
 * 12:00 UTC, así que se comparan por el día.
 */
export const estaVigente = (anuncio: Vigencia, hoy: string) =>
  anuncio.activo !== false && anuncio.desde.slice(0, 10) <= hoy && anuncio.hasta.slice(0, 10) >= hoy

/**
 * En Sección y Nota, un anuncio con secciones elegidas sale solo en esas; sin secciones, en todas.
 * En las demás ubicaciones las secciones no cuentan. Sin `seccion` (al validar impresiones) no filtra.
 */
export function vaEnSeccion(
  secciones: string[],
  ubicacion: Ubicacion,
  seccion: string | undefined,
): boolean {
  if (!CON_SECCION.includes(ubicacion) || !seccion || secciones.length === 0) return true
  return secciones.includes(seccion)
}

/** Navegadores automáticos que no tienen que sumar clics ni impresiones. */
export const esRobot = (agente: string | null) =>
  !agente || /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless/i.test(agente)
