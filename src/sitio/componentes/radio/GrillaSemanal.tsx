'use client'

import { useState } from 'react'

import type { ProgramaCompleto } from '../../datos/tipos'
import { DIAS, momentoMontevideo, programacionDelDia, proximaSemana, type Dia } from '../../lib/grilla'
import { useRadio } from '../reproductor/Radio'

const NOMBRES: Record<Dia, [string, string]> = {
  lun: ['Lunes', 'Lun'],
  mar: ['Martes', 'Mar'],
  mie: ['Miércoles', 'Mié'],
  jue: ['Jueves', 'Jue'],
  vie: ['Viernes', 'Vie'],
  sab: ['Sábado', 'Sáb'],
  dom: ['Domingo', 'Dom'],
}

/**
 * Pestañas por día y la grilla de ese día, con "Al aire" en el programa que suena. Arranca en el día de
 * hoy en Montevideo; cada pestaña es la próxima fecha de ese día, con sus cambios de grilla.
 */
export function GrillaSemanal({ programas }: { programas: ProgramaCompleto[] }) {
  const { ahora, alAire, excepciones } = useRadio()
  const [elegido, setElegido] = useState<Dia | null>(null)
  const dia = elegido ?? momentoMontevideo(ahora).dia
  const emisiones = programacionDelDia(programas, proximaSemana(ahora)[dia], excepciones)

  return (
    <div>
      <div
        role="tablist"
        aria-label="Días"
        className="mb-2 flex gap-[18px] overflow-x-auto border-b border-linea md:flex-wrap md:gap-x-7 md:overflow-visible"
      >
        {DIAS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            id={`dia-${d}`}
            aria-selected={d === dia}
            aria-controls="grilla-del-dia"
            onClick={() => setElegido(d)}
            className={`flex min-h-11 shrink-0 cursor-pointer items-center text-[13px] tracking-[0.08em] uppercase hover:text-acento md:min-h-12 md:text-sm ${
              d === dia ? 'font-extrabold shadow-[inset_0_-3px_0_var(--color-acento)]' : 'font-semibold'
            }`}
          >
            <span className="md:hidden">{NOMBRES[d][1]}</span>
            <span className="hidden md:inline">{NOMBRES[d][0]}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id="grilla-del-dia" aria-labelledby={`dia-${dia}`}>
        {emisiones.length ? (
          <ol className="m-0 list-none p-0">
            {emisiones.map((e) => {
              const suena =
                alAire !== null &&
                alAire.programa.id === e.programa.id &&
                alAire.fecha === e.fecha &&
                alAire.inicio === e.inicio
              return (
                <li
                  key={`${e.programa.id}-${e.inicio}`}
                  className="flex gap-3.5 border-b border-linea py-4 md:grid md:grid-cols-[150px_minmax(0,1fr)_260px] md:items-start md:gap-6 md:py-[22px]"
                >
                  <span className="flex w-24 shrink-0 flex-col gap-1 md:w-auto md:gap-1.5">
                    <span className="text-sm font-extrabold tabular-nums md:text-[17px]">
                      {e.inicio}–{e.fin}
                    </span>
                    {suena && (
                      <span className="text-[10px] font-extrabold tracking-[0.1em] text-acento uppercase md:text-[11px]">
                        Al aire
                      </span>
                    )}
                    {e.especial && !suena && (
                      <span className="text-[10px] font-extrabold tracking-[0.1em] text-meta uppercase md:text-[11px]">
                        Especial
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col gap-[3px] md:gap-1.5">
                    <span className="font-titulos text-xl leading-[1.15] font-bold md:text-[26px]">
                      {e.programa.nombre}
                    </span>
                    {e.programa.descripcion && (
                      <span className="hidden text-base leading-[1.55] text-texto-2 md:block">
                        {e.programa.descripcion}
                      </span>
                    )}
                    {e.programa.conduccion && (
                      <span className="text-[13px] text-meta md:hidden">{e.programa.conduccion}</span>
                    )}
                  </span>
                  <span className="hidden text-[15px] text-meta md:block">{e.programa.conduccion}</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="py-8 text-texto-2">Este día no hay programas cargados: suena la música de Visión.</p>
        )}
      </div>
    </div>
  )
}
