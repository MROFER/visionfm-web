'use client'

import Link from 'next/link'

import { aContinuacion, aMinutos, momentoMontevideo, type Dia } from '../../lib/grilla'
import { telefonoParaLink } from '../../navegacion'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { useRadio } from '../reproductor/Radio'

const NOMBRE_DIA: Record<Dia, string> = {
  lun: 'Lun',
  mar: 'Mar',
  mie: 'Mié',
  jue: 'Jue',
  vie: 'Vie',
  sab: 'Sáb',
  dom: 'Dom',
}

/** Qué parte del programa ya pasó, de 0 a 1. */
function avance(inicio: string, fin: string, minutos: number) {
  const desde = aMinutos(inicio)
  const hasta = fin === '00:00' ? 24 * 60 : aMinutos(fin)
  return Math.min(1, Math.max(0, (minutos - desde) / (hasta - desde)))
}

/**
 * Hero oscuro del Inicio (design/LEEME.md, sección 7): el programa al aire con su avance y "A
 * continuación". En el celular muestra dos programas y debajo la publicidad, que llega como `children`.
 */
export function HeroEnVivo({ telefono, children }: { telefono: string; children?: React.ReactNode }) {
  const { alAire, grilla, excepciones, ahora } = useRadio()
  const { dia: hoy, minutos } = momentoMontevideo(ahora)
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
    <section aria-label="En vivo" className="bg-tinta text-blanco">
      <div className="contenedor flex flex-wrap gap-x-14 gap-y-6 pt-7 pb-7 md:pt-14 md:pb-16">
        <div className="flex min-w-0 flex-[999_1_540px] flex-col justify-center gap-3.5 md:gap-5">
          <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.12em] text-vivo-claro uppercase md:gap-2.5 md:text-[13px]">
            <span aria-hidden className="size-2 bg-vivo md:size-2.5" />
            Al aire ahora · 96.5 FM
          </span>
          <h1 className="m-0 font-titulos text-5xl leading-none font-bold tracking-[-0.03em] md:text-[84px] md:leading-[0.98]">
            {alAire ? alAire.programa.nombre : 'Visión 96.5 FM'}
          </h1>
          <p className="m-0 text-[15px] text-oscuro-1 md:text-[19px]">
            {alAire
              ? [alAire.programa.conduccion && `Con ${alAire.programa.conduccion}`, `${alAire.inicio} a ${alAire.fin} h`]
                  .filter(Boolean)
                  .join(' · ')
              : 'La radio de Fray Bentos'}
          </p>
          {alAire && (
            <div className="flex max-w-[560px] flex-col gap-2">
              <div className="h-1 bg-oscuro-linea">
                <div
                  className="h-1 bg-vivo"
                  style={{ width: `${Math.round(avance(alAire.inicio, alAire.fin, minutos) * 100)}%` }}
                />
              </div>
              <div className="hidden justify-between text-[13px] text-oscuro-2 tabular-nums md:flex">
                <span>{alAire.inicio}</span>
                <span>{alAire.fin}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:pt-2">
            <BotonEnVivo variante="hero" />
            <Link
              href="/radio/programacion"
              className="hidden min-h-16 items-center border-2 border-blanco px-6 text-[13px] font-extrabold tracking-[0.1em] text-blanco uppercase no-underline hover:bg-blanco hover:text-tinta md:flex"
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

        <div id="programacion" className="mt-2.5 flex min-w-0 flex-[1_1_380px] flex-col md:mt-0">
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
          {siguientes.length ? (
            <ol className="m-0 list-none p-0">
              {siguientes.map((e, i) => (
                <li
                  key={`${e.programa.id}-${e.fecha}-${e.inicio}`}
                  className={`flex gap-3.5 border-b border-oscuro-linea py-3.5 md:gap-4 md:py-4 ${
                    i > 0 ? 'md:opacity-80' : ''
                  } ${i > 1 ? 'max-md:hidden' : ''}`}
                >
                  <span className="flex w-20 shrink-0 flex-col gap-[3px] md:w-[92px] md:gap-1">
                    <span className="text-[13px] font-extrabold tabular-nums md:text-sm">
                      {e.dia !== hoy && `${NOMBRE_DIA[e.dia]} `}
                      {e.inicio}
                    </span>
                    <span className="text-[10px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase md:text-[11px]">
                      {i === 0 ? 'Después' : 'Más tarde'}
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-titulos text-xl leading-[1.15] font-semibold md:text-[22px]">
                      {e.programa.nombre}
                    </span>
                    {e.programa.conduccion && (
                      <span className="text-[13px] text-oscuro-2 md:text-sm">{e.programa.conduccion}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-4 text-sm text-oscuro-2">No hay más programas cargados por ahora.</p>
          )}
        </div>
        {children && <div className="w-full pt-3 md:hidden">{children}</div>}
      </div>
    </section>
  )
}
