import type { Pelicula } from '@/payload-types'

/** 105 → "1 h 45 min" */
export function duracionPelicula(minutos: number) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Segundos de audio → "24 min" (o "45 s" si no llega al minuto). */
export function duracionAudio(segundos: number) {
  if (segundos < 60) return `${Math.round(segundos)} s`
  return `${Math.round(segundos / 60)} min`
}

/** 754 → "12:34"; desde una hora, "1:02:05". */
export function reloj(segundos: number) {
  const total = Math.max(0, Math.floor(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${String(m).padStart(2, '0')}:${s}`
}

const CALIFICACION: Record<Pelicula['calificacion'], string> = {
  atp: 'ATP',
  '7': '+7',
  '13': '+13',
  '16': '+16',
  '18': '+18',
}

export const calificacion = (c: Pelicula['calificacion']) => CALIFICACION[c] ?? c
