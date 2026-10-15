import { hoyEnMontevideo } from './fecha'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** "2026-10-09" → "Vie 09": las pestañas de los días de función. */
export function pestanaDeDia(dia: string) {
  return `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]} ${dia.slice(8, 10)}`
}

/** El día en Montevideo ("2026-10-09") de cada función, sin repetir y en orden. */
export function diasConFunciones(fechas: string[]) {
  return [...new Set(fechas.map((f) => hoyEnMontevideo(new Date(f))))].sort()
}

/** "21:30" en hora de Montevideo. */
export function horaDeFuncion(iso: string) {
  return new Intl.DateTimeFormat('es-UY', {
    timeZone: 'America/Montevideo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

const IDIOMA: Record<string, string> = { subtitulada: 'Subtitulada', doblada: 'Doblada' }
const FORMATO: Record<string, string> = { '2d': '2D', '3d': '3D' }

export const nombreIdioma = (valor: string) => IDIOMA[valor] ?? valor
export const nombreFormato = (valor: string) => FORMATO[valor] ?? valor

/** ['subtitulada', 'doblada'] → "Subtitulada y doblada"; ['2d', '3d'] → "2D y 3D". */
export function versiones(valores: string[], tipo: 'idioma' | 'formato') {
  const nombres = valores.map(tipo === 'idioma' ? nombreIdioma : nombreFormato)
  if (nombres.length < 2) return nombres.join('')
  const lista = `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
  // "Subtitulada y doblada": solo la primera en mayúscula
  return tipo === 'idioma' ? lista.charAt(0) + lista.slice(1).toLowerCase() : lista
}
