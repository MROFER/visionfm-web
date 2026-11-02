'use client'

import { useRouter } from 'next/navigation'

import { IconoFiltro } from '../ui/iconos'

export type OpcionMes = { valor: string; etiqueta: string; href: string }

/**
 * Filtro por mes de Entrevistas: un botón con el embudo (en web dice "Filtrar") que abre la lista
 * nativa de meses con entrevistas. Con un mes elegido se marca en naranja; el título de la lista
 * dice cuál es.
 */
export function FiltroMes({ opciones, actual }: { opciones: OpcionMes[]; actual: string }) {
  const router = useRouter()
  const activo = actual !== ''
  return (
    <div
      className={`relative flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 border-2 px-2.5 text-xs font-extrabold tracking-[0.1em] uppercase focus-within:outline-3 focus-within:outline-acento md:text-[13px] ${
        activo ? 'border-acento bg-acento text-blanco' : 'border-tinta text-tinta hover:text-acento'
      }`}
    >
      <IconoFiltro />
      <span aria-hidden className="hidden md:inline">
        Filtrar
      </span>
      {/* La lista de meses es la del sistema (en el celular, la del teléfono); queda invisible encima del botón */}
      <select
        aria-label="Filtrar por fecha"
        value={actual}
        onChange={(e) => {
          const opcion = opciones.find((o) => o.valor === e.target.value)
          if (opcion) router.push(opcion.href, { scroll: false })
        }}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  )
}
