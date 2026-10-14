export const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const
export type Dia = (typeof DIAS)[number]

export type Horario = { dias: Dia[]; inicio: string; fin: string }
export type ProgramaEnGrilla = { id?: number | string; nombre: string; horarios: Horario[] }

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

export const esHora = (valor: unknown): valor is string =>
  typeof valor === 'string' && HORA.test(valor)

/** Minutos desde la medianoche. `24:00` no existe: un horario que cruza la medianoche se carga como dos filas. */
export const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))

/** `null` si el horario es válido; si no, el motivo. */
export function validarHorario(h: Partial<Horario>): string | null {
  if (!h.dias?.length) return 'Elegí al menos un día.'
  if (!esHora(h.inicio) || !esHora(h.fin))
    return 'Las horas van en formato HH:MM, por ejemplo 07:30.'
  if (aMinutos(h.fin) <= aMinutos(h.inicio) && h.fin !== '00:00') {
    return 'El fin tiene que ser después del inicio. Si cruza la medianoche, cargalo como dos filas (hasta 00:00 y desde 00:00).'
  }
  return null
}

const finEnMinutos = (fin: string) => (fin === '00:00' ? 24 * 60 : aMinutos(fin))

/** Dos horarios se superponen si comparten un día y sus franjas se cruzan (tocarse en el borde no cuenta). */
export function seSuperponen(a: Horario, b: Horario): boolean {
  if (!a.dias.some((d) => b.dias.includes(d))) return false
  return aMinutos(a.inicio) < finEnMinutos(b.fin) && aMinutos(b.inicio) < finEnMinutos(a.fin)
}

/** Nombres de los otros programas que pisan algún horario de este. */
export function choquesCon(horarios: Horario[], otros: ProgramaEnGrilla[]): string[] {
  return otros
    .filter((otro) => otro.horarios.some((ho) => horarios.some((h) => seSuperponen(h, ho))))
    .map((otro) => otro.nombre)
}
