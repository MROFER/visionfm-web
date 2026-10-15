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

// "Al aire" y "A continuación" (design/LEEME.md, sección 8). Uruguay no cambia la hora desde 2015: UTC-3 fijo.
const DESFASE_MONTEVIDEO = -3 * 60
const MINUTOS_DIA = 24 * 60
const MINUTOS_SEMANA = 7 * MINUTOS_DIA

/** Día de la semana y minutos desde la medianoche en Montevideo. */
export function momentoMontevideo(fecha: Date): { dia: Dia; minutos: number } {
  const local = new Date(fecha.getTime() + DESFASE_MONTEVIDEO * 60_000)
  const dia = DIAS[(local.getUTCDay() + 6) % 7]
  return { dia, minutos: local.getUTCHours() * 60 + local.getUTCMinutes() }
}

export type Emision<T> = { programa: T; dia: Dia; inicio: string; fin: string }

/** Cada horario de cada programa, día por día, en minutos desde el lunes 00:00. */
function emisiones<T extends ProgramaEnGrilla>(programas: T[]) {
  return programas.flatMap((programa) =>
    programa.horarios.flatMap((h) =>
      h.dias.map((dia) => {
        const base = DIAS.indexOf(dia) * MINUTOS_DIA
        return {
          programa,
          dia,
          inicio: h.inicio,
          fin: h.fin,
          desde: base + aMinutos(h.inicio),
          hasta: base + finEnMinutos(h.fin),
        }
      }),
    ),
  )
}

const minutoDeLaSemana = (fecha: Date) => {
  const { dia, minutos } = momentoMontevideo(fecha)
  return DIAS.indexOf(dia) * MINUTOS_DIA + minutos
}

const sinPosicion = <T>({ programa, dia, inicio, fin }: Emision<T> & object): Emision<T> => ({
  programa,
  dia,
  inicio,
  fin,
})

/** El programa que suena ahora, o `null` si a esta hora no hay ninguno cargado. */
export function alAire<T extends ProgramaEnGrilla>(programas: T[], fecha: Date): Emision<T> | null {
  const ahora = minutoDeLaSemana(fecha)
  const actual = emisiones(programas).find((e) => e.desde <= ahora && ahora < e.hasta)
  return actual ? sinPosicion(actual) : null
}

/** Los próximos programas que empiezan después de ahora, dando la vuelta a la semana si hace falta. */
export function aContinuacion<T extends ProgramaEnGrilla>(
  programas: T[],
  fecha: Date,
  cantidad: number,
): Emision<T>[] {
  const ahora = minutoDeLaSemana(fecha)
  return emisiones(programas)
    .map((e) => ({ e, falta: (e.desde - ahora + MINUTOS_SEMANA) % MINUTOS_SEMANA }))
    .filter(({ falta }) => falta > 0)
    .sort((a, b) => a.falta - b.falta)
    .slice(0, cantidad)
    .map(({ e }) => sinPosicion(e))
}
