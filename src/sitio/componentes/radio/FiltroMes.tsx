'use client'

import { useRouter } from 'next/navigation'

import { IconoCalendario, IconoFlechaAbajo } from '../ui/iconos'

export type OpcionMes = { valor: string; etiqueta: string; href: string }

/** Filtro por mes de Entrevistas: solo ofrece los meses que tienen entrevistas. */
export function FiltroMes({ opciones, actual }: { opciones: OpcionMes[]; actual: string }) {
  const router = useRouter()
  return (
    <div className="relative flex shrink-0 items-center text-tinta">
      <IconoCalendario tamano={15} className="pointer-events-none absolute left-2.5" />
      <select
        aria-label="Filtrar por fecha"
        value={actual}
        onChange={(e) => {
          const opcion = opciones.find((o) => o.valor === e.target.value)
          if (opcion) router.push(opcion.href, { scroll: false })
        }}
        className="min-h-10 cursor-pointer appearance-none border-2 border-tinta bg-blanco pr-8 pl-8 text-xs font-bold tracking-normal normal-case focus:outline-3 focus:outline-acento md:text-sm"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      <IconoFlechaAbajo className="pointer-events-none absolute right-2.5" />
    </div>
  )
}
