'use client'

import { useState } from 'react'

import { diasConFunciones, horaDeFuncion, nombreFormato, nombreIdioma, pestanaDeDia } from '../../lib/cine'
import { hoyEnMontevideo } from '../../lib/fecha'
import { PestanasDias } from './PestanasDias'

export type Funcion = { fechaHora: string; idioma: string; formato: string }

/** Pestañas por día y los horarios de ese día con chips de idioma y formato. */
export function FuncionesDias({ funciones }: { funciones: Funcion[] }) {
  const dias = diasConFunciones(funciones.map((f) => f.fechaHora))
  const [dia, setDia] = useState(dias[0])
  const delDia = funciones.filter((f) => hoyEnMontevideo(new Date(f.fechaHora)) === dia)

  return (
    <div className="flex flex-col">
      <PestanasDias
        opciones={dias.map((d) => ({ valor: d, etiqueta: pestanaDeDia(d) }))}
        elegida={dia}
        onElegir={setDia}
        controla="funciones-del-dia"
        repartidas
      />
      <ul role="tabpanel" id="funciones-del-dia" aria-labelledby={`funciones-del-dia-${dia}`} className="m-0 list-none p-0">
        {delDia.map((f) => (
          <li
            key={f.fechaHora + f.idioma + f.formato}
            className="flex items-center justify-between gap-2.5 border-b border-linea py-3 lg:gap-3 lg:py-3.5"
          >
            <time dateTime={f.fechaHora} className="font-titulos text-2xl font-extrabold tabular-nums lg:text-[28px]">
              {horaDeFuncion(f.fechaHora)}
            </time>
            <span className="flex gap-1.5">
              <Chip>{nombreIdioma(f.idioma)}</Chip>
              <Chip>{nombreFormato(f.formato)}</Chip>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-suave px-1.5 py-1 text-[10px] font-extrabold tracking-[0.1em] uppercase lg:px-2 lg:text-xs">
    {children}
  </span>
)
