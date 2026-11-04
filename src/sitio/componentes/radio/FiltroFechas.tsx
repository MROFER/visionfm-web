'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { rangoCorto } from '@/sitio/lib/fecha'
import { IconoCalendario, IconoCerrar } from '../ui/iconos'

// Días como "2026-10-15": se suman y comparan como texto, sin husos horarios
const aFecha = (dia: string) => new Date(`${dia}T12:00:00Z`)
const sumar = (dia: string, n: number) => {
  const f = aFecha(dia)
  f.setUTCDate(f.getUTCDate() + n)
  return f.toISOString().slice(0, 10)
}

type Rango = { desde: string; hasta: string }

/** Los atajos del panel, contados desde `hoy`. */
function atajos(hoy: string): { nombre: string; rango: Rango }[] {
  const lunes = sumar(hoy, -((aFecha(hoy).getUTCDay() + 6) % 7))
  const mes = hoy.slice(0, 7)
  const ultimoDelPasado = sumar(`${mes}-01`, -1)
  return [
    { nombre: 'Esta semana', rango: { desde: lunes, hasta: hoy } },
    { nombre: 'Este mes', rango: { desde: `${mes}-01`, hasta: hoy } },
    {
      nombre: 'Mes pasado',
      rango: { desde: `${ultimoDelPasado.slice(0, 7)}-01`, hasta: ultimoDelPasado },
    },
    { nombre: 'Últimos 3 meses', rango: { desde: sumar(hoy, -90), hasta: hoy } },
    { nombre: 'Este año', rango: { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy } },
  ]
}

type Cosa = { una: string; varias: string }
const ENTREVISTAS: Cosa = { una: 'entrevista', varias: 'entrevistas' }

const cuantas = (dias: string[], r: Rango | null) =>
  r ? dias.filter((d) => d >= r.desde && d <= r.hasta).length : dias.length

/**
 * Filtro por fechas de Entrevistas y de Noticias. El botón del calendario (en web, con "Filtrar") abre un panel con
 * atajos ("Esta semana", "Mes pasado"…) que dicen cuántas entrevistas tienen, y "Elegir las fechas", que
 * usa el calendario del teléfono o del navegador. En el celular el panel sube desde abajo; en web se abre
 * debajo del botón. El rango va en la dirección (`desde` y `hasta`), así se puede compartir y volver atrás.
 */
export function FiltroFechas({
  dias,
  desde,
  hasta,
  hoy,
  cosa = ENTREVISTAS,
}: {
  /** El día de cada entrevista (o nota) que se puede ver, uno por cada una, así se cuentan. */
  dias: string[]
  desde?: string
  hasta?: string
  hoy: string
  /** Lo que se cuenta, en singular y plural: entrevistas en Radio, notas en Noticias. */
  cosa?: Cosa
}) {
  const router = useRouter()
  const ruta = usePathname()
  const parametros = useSearchParams()
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const titulo = useId()
  const actual = desde && hasta ? { desde, hasta } : null

  const aplicar = (rango: Rango | null) => {
    const p = new URLSearchParams(parametros.toString())
    for (const clave of ['pagina', 'mes', 'desde', 'hasta']) p.delete(clave)
    if (rango) {
      p.set('desde', rango.desde)
      p.set('hasta', rango.hasta)
    }
    const cadena = p.toString()
    setAbierto(false)
    router.push(cadena ? `${ruta}?${cadena}` : ruta, { scroll: false })
  }

  // Se cierra con Escape o tocando afuera; en el celular la página de atrás no se mueve
  useEffect(() => {
    if (!abierto) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    const afuera = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('keydown', tecla)
    document.addEventListener('pointerdown', afuera)
    const celular = window.matchMedia('(width < 768px)').matches
    if (celular) document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('pointerdown', afuera)
      if (celular) document.documentElement.style.overflow = ''
    }
  }, [abierto])

  const etiqueta = actual ? rangoCorto(actual.desde, actual.hasta) : 'Filtrar'

  return (
    <div ref={contenedor} className="relative -my-3 -mr-3 flex shrink-0 items-center">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={actual ? `Filtrar por fecha: ${etiqueta}` : 'Filtrar por fecha'}
        onClick={() => setAbierto((a) => !a)}
        className={`flex cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 py-3 text-xs leading-4 font-extrabold tracking-[0.1em] uppercase md:text-[13px] ${
          actual || abierto ? 'text-acento' : 'text-tinta hover:text-acento'
        }`}
      >
        <IconoCalendario tamano={14} />
        {/* En el celular va solo el ícono: el título de la lista ya dice el rango */}
        <span aria-hidden className="hidden md:inline">
          {etiqueta}
        </span>
      </button>
      {actual && (
        <button
          type="button"
          aria-label="Quitar el filtro por fecha"
          onClick={() => aplicar(null)}
          className="-ml-2 flex min-h-10 min-w-8 cursor-pointer items-center justify-center border-0 bg-transparent text-acento hover:text-tinta"
        >
          <IconoCerrar tamano={14} />
        </button>
      )}

      {abierto && (
        <>
          <div
            aria-hidden
            onPointerDown={() => setAbierto(false)}
            className="fixed inset-0 z-[60] bg-tinta/60 md:hidden"
          />
          <div
            role="dialog"
            aria-labelledby={titulo}
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[88vh] flex-col overflow-y-auto border-t-[3px] border-tinta bg-blanco text-tinta normal-case md:absolute md:inset-x-auto md:top-full md:right-3 md:bottom-auto md:mt-1 md:max-h-none md:w-max md:border-2 md:shadow-[6px_6px_0_var(--color-tinta)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-linea px-4 py-3 md:px-5">
              <h3 id={titulo} className="etiqueta m-0">
                Filtrar por fecha
              </h3>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setAbierto(false)}
                className="-mr-2 flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-tinta"
              >
                <IconoCerrar tamano={20} />
              </button>
            </div>
            <Panel dias={dias} hoy={hoy} inicial={actual} aplicar={aplicar} cosa={cosa} />
          </div>
        </>
      )}
    </div>
  )
}

function Panel({
  dias,
  hoy,
  inicial,
  aplicar,
  cosa,
}: {
  dias: string[]
  hoy: string
  inicial: Rango | null
  aplicar: (r: Rango | null) => void
  cosa: Cosa
}) {
  const opciones = atajos(hoy)
  const delAtajo = inicial
    ? opciones.findIndex((a) => a.rango.desde === inicial.desde && a.rango.hasta === inicial.hasta)
    : -1
  // -1: cualquier fecha; un número: ese atajo; 'propio': las fechas de los dos campos
  const [eleccion, setEleccion] = useState<number | 'propio'>(
    inicial ? (delAtajo >= 0 ? delAtajo : 'propio') : -1,
  )
  const [desde, setDesde] = useState(inicial?.desde ?? '')
  const [hasta, setHasta] = useState(inicial?.hasta ?? '')
  // Si las fechas vienen al revés, se dan vuelta
  const rango: Rango | null =
    eleccion === 'propio'
      ? desde && hasta
        ? desde <= hasta
          ? { desde, hasta }
          : { desde: hasta, hasta: desde }
        : null
      : eleccion >= 0
        ? opciones[eleccion].rango
        : null
  const total = cuantas(dias, rango)
  const faltanFechas = eleccion === 'propio' && !rango

  const fila = (clave: number | 'propio', nombre: string, cantidad: number | null) => {
    const elegida = eleccion === clave
    return (
      <button
        key={String(clave)}
        type="button"
        role="radio"
        aria-checked={elegida}
        onClick={() => setEleccion(clave)}
        className="flex min-h-12 w-full cursor-pointer items-center gap-3 border-0 border-b border-linea bg-transparent px-4 text-left text-[15px] text-tinta last:border-b-0 hover:bg-suave md:min-w-[340px] md:px-5"
      >
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            elegida ? 'border-acento' : 'border-tinta'
          }`}
        >
          {elegida && <span className="h-2.5 w-2.5 rounded-full bg-acento" />}
        </span>
        <span className={`flex-1 ${elegida ? 'font-bold' : ''}`}>{nombre}</span>
        {cantidad !== null && (
          <span className="text-sm text-meta">
            {cantidad}
            <span className="sr-only"> {cantidad === 1 ? cosa.una : cosa.varias}</span>
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <div role="radiogroup" aria-label="Fechas" className="flex flex-col">
        {fila(-1, 'Cualquier fecha', dias.length)}
        {opciones.map((a, i) => fila(i, a.nombre, cuantas(dias, a.rango)))}
        {fila('propio', 'Elegir las fechas', null)}
      </div>
      {eleccion === 'propio' && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-1 pb-4 md:px-5">
          {(
            [
              ['Desde', desde, setDesde],
              ['Hasta', hasta, setHasta],
            ] as const
          ).map(([nombre, valor, cambiar]) => (
            <label key={nombre} className="flex flex-col gap-1">
              <span className="text-[11px] font-extrabold tracking-[0.1em] text-meta uppercase">
                {nombre}
              </span>
              <input
                type="date"
                value={valor}
                min={dias.at(-1)}
                max={hoy}
                onChange={(e) => cambiar(e.target.value)}
                className="min-h-12 w-full border-2 border-tinta bg-blanco px-3 text-[15px] font-bold text-tinta"
              />
            </label>
          ))}
        </div>
      )}
      <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-4 border-t border-linea bg-blanco px-4 py-3 md:px-5">
        <button
          type="button"
          onClick={() => {
            setEleccion(-1)
            setDesde('')
            setHasta('')
          }}
          disabled={eleccion === -1}
          className="min-h-11 cursor-pointer border-0 bg-transparent px-0 text-sm font-semibold text-tinta underline underline-offset-4 disabled:cursor-default disabled:text-meta disabled:no-underline"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={() => aplicar(rango)}
          disabled={faltanFechas || (Boolean(rango) && total === 0)}
          className="etiqueta min-h-11 cursor-pointer border-0 bg-acento px-5 text-blanco hover:bg-acento-hover disabled:cursor-default disabled:bg-linea disabled:text-meta"
        >
          {faltanFechas
            ? 'Elegí las dos fechas'
            : !rango
              ? `Ver todas las ${cosa.varias}`
              : total === 0
                ? `Sin ${cosa.varias} en esas fechas`
                : `Ver ${total} ${total === 1 ? cosa.una : cosa.varias}`}
        </button>
      </div>
    </>
  )
}
