'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef } from 'react'

import { aContinuacion, aMinutos, momentoMontevideo } from '../../lib/grilla'
import { telefonoParaLink } from '../../navegacion'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { IndicadorAlAire } from '../reproductor/IndicadorAlAire'
import { useRadio } from '../reproductor/Radio'
import { Rueda } from '../ui/Rueda'
import { FondoPixelado } from './FondoPixelado'
import { ListaSiguientes } from './ListaSiguientes'

/** Qué parte del programa ya pasó, de 0 a 1, con tres decimales. */
function avance(inicio: string, fin: string, minutos: number) {
  const desde = aMinutos(inicio)
  const hasta = fin === '00:00' ? 24 * 60 : aMinutos(fin)
  return Math.round(Math.min(1, Math.max(0, (minutos - desde) / (hasta - desde))) * 1000) / 1000
}

/**
 * Barra de avance del programa al aire. Cuando empieza otro (`programa` cambia), se completa, se apaga y
 * arranca de nuevo desde lo que ya pasó del programa nuevo.
 */
function Avance({ programa, valor }: { programa: string; valor: number }) {
  const barra = useRef<HTMLDivElement>(null)
  const previo = useRef({ programa, valor })

  useLayoutEffect(() => {
    const antes = previo.current
    previo.current = { programa, valor }
    const el = barra.current
    if (!el || antes.programa === programa) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.animate(
      [
        { transform: `scaleX(${antes.valor})`, opacity: 1 },
        { transform: 'scaleX(1)', opacity: 1, offset: 0.4, easing: 'ease-out' },
        { transform: 'scaleX(1)', opacity: 0, offset: 0.62 },
        { transform: `scaleX(${valor})`, opacity: 0, offset: 0.63 },
        { transform: `scaleX(${valor})`, opacity: 1 },
      ],
      { duration: 1000, easing: 'ease-in-out' },
    )
  }, [programa, valor])

  return (
    <div className="h-1 bg-oscuro-linea">
      <div ref={barra} className="h-1 origin-left bg-vivo" style={{ transform: `scaleX(${valor})` }} />
    </div>
  )
}

/**
 * Hero oscuro del Inicio (design/LEEME.md, sección 7): el programa al aire con su avance y "A
 * continuación". En el celular muestra dos programas y debajo la publicidad, que llega como `children`.
 * En web lleva de fondo fotos de la ciudad en cuadritos (FondoPixelado) y "A continuación" va en un
 * panel oscuro recto con un filete naranja arriba, para que la lista se lea sobre la imagen.
 *
 * Cuando empieza otro programa con la página abierta, el nombre y el horario nuevos suben en el lugar de
 * los viejos (Rueda), la barra de avance arranca de cero y "A continuación" corre un lugar. En web, el
 * panel de "A continuación" flota sobre la foto (estilos.css, .flotante).
 */
export function HeroEnVivo({ telefono, children }: { telefono: string; children?: React.ReactNode }) {
  const { alAire, grilla, excepciones, ahora } = useRadio()
  const { dia: hoy, minutos } = momentoMontevideo(ahora)
  const programa = alAire ? `${alAire.programa.id}-${alAire.fecha}-${alAire.inicio}` : ''
  const siguientes = aContinuacion(grilla, ahora, 4, excepciones)
  const fechaCabecera = new Intl.DateTimeFormat('es-UY', {
    timeZone: 'America/Montevideo',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
    .format(ahora)
    .replace(',', '')
    .replace('.', '')

  return (
    <section aria-label="En vivo" className="relative isolate overflow-hidden bg-tinta text-blanco">
      <FondoPixelado />
      <div className="contenedor flex flex-wrap gap-x-14 gap-y-6 pt-7 pb-7 md:pt-14 md:pb-16 lg:pt-20 lg:pb-[88px]">
        <div className="flex min-w-0 flex-[999_1_540px] flex-col justify-center gap-3.5 md:gap-5">
          <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.12em] text-vivo-claro uppercase md:gap-2.5 md:text-[13px]">
            <IndicadorAlAire className="size-2 md:size-2.5" />
            Al aire ahora · 96.5 FM
          </span>
          <h1 className="m-0 font-titulos text-5xl leading-none font-bold tracking-[-0.03em] md:text-[84px] md:leading-[0.98]">
            <Rueda bloque texto={alAire ? alAire.programa.nombre : 'Visión 96.5 FM'} />
          </h1>
          <p className="m-0 text-[15px] text-oscuro-1 md:text-[19px]">
            <Rueda
              bloque
              texto={
                alAire
                  ? [alAire.programa.conduccion && `Con ${alAire.programa.conduccion}`, `${alAire.inicio} a ${alAire.fin} h`]
                      .filter(Boolean)
                      .join(' · ')
                  : 'La radio de Fray Bentos'
              }
            />
          </p>
          {alAire && (
            <div className="flex max-w-[560px] flex-col gap-2">
              <Avance programa={programa} valor={avance(alAire.inicio, alAire.fin, minutos)} />
              <div className="hidden justify-between text-[13px] text-oscuro-2 tabular-nums md:flex">
                <Rueda texto={alAire.inicio} />
                <Rueda texto={alAire.fin} />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:pt-2">
            <BotonEnVivo variante="hero" />
            <Link
              href="/radio/programacion"
              className="apretable hidden min-h-16 items-center border-2 border-blanco px-6 text-[13px] font-extrabold tracking-[0.1em] text-blanco uppercase no-underline hover:bg-blanco hover:text-tinta md:flex"
            >
              Programación completa
            </Link>
          </div>
          <a
            href={`tel:${telefonoParaLink(telefono)}`}
            className="hidden text-[15px] text-oscuro-1 no-underline md:block"
          >
            Comunicate con la radio: <strong className="text-blanco">{telefono}</strong>
          </a>
        </div>

        <div
          id="programacion"
          className="flotante mt-2.5 flex min-w-0 flex-[1_1_380px] flex-col md:mt-0 lg:relative lg:self-center lg:bg-tinta/90 lg:px-6 lg:pt-[22px] lg:pb-2 lg:shadow-[inset_0_3px_0_var(--color-acento)]"
        >
          <div className="flex items-baseline justify-between border-b-[3px] border-blanco pb-2 md:pb-2.5">
            <h2 className="m-0 text-xs font-extrabold tracking-[0.1em] uppercase md:text-[13px]">
              A continuación
            </h2>
            <span className="hidden text-[13px] text-oscuro-2 first-letter:uppercase md:inline">
              {fechaCabecera}
            </span>
            <Link href="/radio/programacion" className="text-xs font-bold text-blanco md:hidden">
              Ver toda
            </Link>
          </div>
          <ListaSiguientes siguientes={siguientes} hoy={hoy} />
        </div>
        {children && <div className="w-full pt-3 md:hidden">{children}</div>}
      </div>
    </section>
  )
}
