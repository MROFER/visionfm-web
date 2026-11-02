'use client'

import { useState } from 'react'

import type { ProgramaCompleto } from '../../datos/tipos'
import { aMinutos, DIAS, momentoMontevideo, programacionDelDia, proximaSemana, type Dia } from '../../lib/grilla'
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

/** Minuto del día en que termina: un programa que termina a medianoche ("00:00") cuenta como 24:00. */
const finEnMinutos = (inicio: string, fin: string) => (aMinutos(fin) <= aMinutos(inicio) ? 24 * 60 : aMinutos(fin))

/**
 * Pestañas por día y la grilla de ese día. Arranca en el día de hoy en Montevideo; cada pestaña es la
 * próxima fecha de ese día, con sus cambios de grilla. Hoy, lo que ya terminó queda plegado arriba y la
 * lista empieza por lo que suena, remarcado en oscuro, o por lo que viene.
 */
export function GrillaSemanal({ programas }: { programas: ProgramaCompleto[] }) {
  const { ahora, alAire, excepciones } = useRadio()
  const [elegido, setElegido] = useState<Dia | null>(null)
  const [verPasados, setVerPasados] = useState(false)
  const { dia: hoy, minutos } = momentoMontevideo(ahora)
  const dia = elegido ?? hoy
  const delDia = programacionDelDia(programas, proximaSemana(ahora)[dia], excepciones)
  const siguiente = dia === hoy ? delDia.findIndex((e) => finEnMinutos(e.inicio, e.fin) > minutos) : 0
  const pasados = siguiente === -1 ? delDia.length : siguiente
  const emisiones = verPasados ? delDia : delDia.slice(pasados)

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
        {pasados > 0 && (
          <button
            type="button"
            onClick={() => setVerPasados((v) => !v)}
            aria-expanded={verPasados}
            className="etiqueta my-3 flex w-full cursor-pointer items-center justify-center gap-2 border border-linea py-3 text-[11px] text-meta hover:text-tinta"
          >
            {verPasados ? 'Ocultar lo que ya pasó' : `Ver lo que ya pasó hoy (${pasados})`}
            <span aria-hidden>{verPasados ? '↓' : '↑'}</span>
          </button>
        )}
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
                  aria-current={suena ? 'true' : undefined}
                  className={`flex gap-3.5 py-4 md:grid md:grid-cols-[150px_minmax(0,1fr)_260px] md:items-start md:gap-6 md:py-[22px] ${
                    suena
                      ? 'my-2 -mx-4 border-l-4 border-acento bg-tinta px-4 text-blanco md:-mx-6 md:px-6'
                      : 'border-b border-linea'
                  }`}
                >
                  <span className="flex w-24 shrink-0 flex-col gap-1 md:w-auto md:gap-1.5">
                    <span className="text-sm font-extrabold tabular-nums md:text-[17px]">
                      {e.inicio}–{e.fin}
                    </span>
                    {suena && (
                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase md:text-[11px]">
                        <span aria-hidden className="size-1.5 bg-vivo motion-safe:animate-pulse md:size-2" />
                        Al aire<span className="hidden md:inline"> ahora</span>
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
                      <span className={`hidden text-base leading-[1.55] md:block ${suena ? 'text-blanco/75' : 'text-texto-2'}`}>
                        {e.programa.descripcion}
                      </span>
                    )}
                    {e.programa.conduccion && (
                      <span className={`text-[13px] md:hidden ${suena ? 'text-blanco/70' : 'text-meta'}`}>
                        {e.programa.conduccion}
                      </span>
                    )}
                  </span>
                  <span className={`hidden text-[15px] md:block ${suena ? 'text-blanco/70' : 'text-meta'}`}>
                    {e.programa.conduccion}
                  </span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="py-8 text-texto-2">
            {delDia.length
              ? 'La programación de hoy ya terminó: suena la música de Visión.'
              : 'Este día no hay programas cargados: suena la música de Visión.'}
          </p>
        )}
      </div>
    </div>
  )
}
