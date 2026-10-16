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

/**
 * Un cambio de grilla para una fecha (docs/04-esquema.md, excepcionesGrilla): un partido, un feriado o
 * una cobertura. En su horario reemplaza a lo que hubiera ese día; el resto del día sigue igual.
 */
export type ExcepcionEnGrilla = {
  id: number | string
  /** `AAAA-MM-DD` en Montevideo. */
  fecha: string
  inicio: string
  fin: string
  /** El programa de la grilla que sale en ese horario, si es uno. */
  programa: number | string | null
  titulo: string
  conduccion: string
}

export type Emision<T> = {
  programa: T
  dia: Dia
  /** `AAAA-MM-DD` en Montevideo. */
  fecha: string
  inicio: string
  fin: string
  /** Sale por una excepción de grilla, no por el horario habitual. */
  especial: boolean
}

type Tramo<T> = Emision<T> & { desde: number; hasta: number }

/** Fecha en Montevideo, como `AAAA-MM-DD`. */
export const fechaMontevideo = (fecha: Date) =>
  new Date(fecha.getTime() + DESFASE_MONTEVIDEO * 60_000).toISOString().slice(0, 10)

const diaDeFecha = (fecha: string): Dia =>
  DIAS[(new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7]

const sumarDias = (fecha: string, dias: number) =>
  new Date(Date.parse(`${fecha}T12:00:00Z`) + dias * MINUTOS_DIA * 60_000)
    .toISOString()
    .slice(0, 10)

/** Las fechas de hoy a seis días, una por día de la semana: lo que muestran las pestañas de Programación. */
export function proximaSemana(ahora: Date): Record<Dia, string> {
  const hoy = fechaMontevideo(ahora)
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i))
  return Object.fromEntries(fechas.map((f) => [diaDeFecha(f), f])) as Record<Dia, string>
}

/** El programa que muestra una excepción: el de la grilla si es uno, con el título y la conducción propios. */
function programaDe<T extends ProgramaEnGrilla>(excepcion: ExcepcionEnGrilla, programas: T[]): T {
  const propio =
    excepcion.programa === null ? undefined : programas.find((p) => p.id === excepcion.programa)
  const base =
    propio ??
    ({ id: `excepcion-${excepcion.id}`, nombre: excepcion.titulo, horarios: [] } as unknown as T)
  const conduccion = excepcion.conduccion || (base as { conduccion?: string }).conduccion || ''
  return { ...base, nombre: excepcion.titulo || base.nombre, conduccion }
}

/** Saca de un tramo habitual los minutos que ocupa una excepción; puede quedar antes, después o nada. */
function recortar<T>(tramo: Tramo<T>, especiales: Tramo<T>[]): Tramo<T>[] {
  return especiales.reduce<Tramo<T>[]>(
    (tramos, e) =>
      tramos.flatMap((t) => {
        if (e.hasta <= t.desde || e.desde >= t.hasta) return [t]
        const partes: Tramo<T>[] = []
        if (t.desde < e.desde) partes.push({ ...t, hasta: e.desde, fin: e.inicio })
        if (e.hasta < t.hasta) partes.push({ ...t, desde: e.hasta, inicio: e.fin })
        return partes
      }),
    [tramo],
  )
}

/** Lo que sale al aire en una fecha: la grilla de ese día de la semana con sus excepciones aplicadas. */
function delDia<T extends ProgramaEnGrilla>(
  programas: T[],
  excepciones: ExcepcionEnGrilla[],
  fecha: string,
): Tramo<T>[] {
  const dia = diaDeFecha(fecha)
  const especiales = excepciones
    .filter((e) => e.fecha === fecha)
    .map((e) => ({
      programa: programaDe(e, programas),
      dia,
      fecha,
      inicio: e.inicio,
      fin: e.fin,
      especial: true,
      desde: aMinutos(e.inicio),
      hasta: finEnMinutos(e.fin),
    }))
  const habituales = programas.flatMap((programa) =>
    programa.horarios
      .filter((h) => h.dias.includes(dia))
      .map((h) => ({
        programa,
        dia,
        fecha,
        inicio: h.inicio,
        fin: h.fin,
        especial: false,
        desde: aMinutos(h.inicio),
        hasta: finEnMinutos(h.fin),
      })),
  )
  return [...habituales.flatMap((h) => recortar(h, especiales)), ...especiales].sort(
    (a, b) => a.desde - b.desde,
  )
}

const sinPosicion = <T>({ programa, dia, fecha, inicio, fin, especial }: Tramo<T>): Emision<T> => ({
  programa,
  dia,
  fecha,
  inicio,
  fin,
  especial,
})

/** El programa que suena ahora, o `null` si a esta hora no hay ninguno cargado. */
export function alAire<T extends ProgramaEnGrilla>(
  programas: T[],
  fecha: Date,
  excepciones: ExcepcionEnGrilla[] = [],
): Emision<T> | null {
  const { minutos } = momentoMontevideo(fecha)
  const actual = delDia(programas, excepciones, fechaMontevideo(fecha)).find(
    (e) => e.desde <= minutos && minutos < e.hasta,
  )
  return actual ? sinPosicion(actual) : null
}

/** Los próximos programas que empiezan después de ahora, hasta una semana adelante. */
export function aContinuacion<T extends ProgramaEnGrilla>(
  programas: T[],
  fecha: Date,
  cantidad: number,
  excepciones: ExcepcionEnGrilla[] = [],
): Emision<T>[] {
  const { minutos } = momentoMontevideo(fecha)
  const hoy = fechaMontevideo(fecha)
  // Ocho fechas: el mismo día de la semana que viene cuenta para lo que ya pasó hoy
  return Array.from({ length: 8 }, (_, i) =>
    delDia(programas, excepciones, sumarDias(hoy, i)).map((e) => ({
      e,
      falta: i * MINUTOS_DIA + e.desde - minutos,
    })),
  )
    .flat()
    .filter(({ falta }) => falta > 0 && falta < MINUTOS_SEMANA)
    .sort((a, b) => a.falta - b.falta)
    .slice(0, cantidad)
    .map(({ e }) => sinPosicion(e))
}

/** Lo que sale al aire en una fecha (`AAAA-MM-DD`), de la mañana a la noche. */
export function programacionDelDia<T extends ProgramaEnGrilla>(
  programas: T[],
  fecha: string,
  excepciones: ExcepcionEnGrilla[] = [],
): Emision<T>[] {
  return delDia(programas, excepciones, fecha).map(sinPosicion)
}
