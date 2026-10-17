import type { Imagen } from '../datos/formas'
import { UBICACIONES } from './ubicaciones'

// Rotación de anuncios (docs/07-permisos-y-publicidad.md, sección 3). La comparten el servidor, que
// arma la lista de vigentes, y el navegador, que elige uno por visita según el peso.

export type Ubicacion = (typeof UBICACIONES)[number]['value']

export const esUbicacion = (valor: unknown): valor is Ubicacion =>
  typeof valor === 'string' && UBICACIONES.some((u) => u.value === valor)

/** Ubicaciones donde el anuncio se puede limitar a algunas secciones de Noticias. */
export const CON_SECCION: Ubicacion[] = ['noticias-seccion', 'noticias-nota']

/** Lo que el navegador necesita para mostrar un anuncio. El link de destino lo resuelve `/a/{id}`. */
export type AnuncioRotable = {
  id: number
  peso: number
  web: Imagen | null
  movil: Imagen | null
  rectangulo: Imagen | null
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
