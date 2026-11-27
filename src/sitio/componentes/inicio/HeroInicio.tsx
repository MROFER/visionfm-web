'use client'

import Image from 'next/image'
import Link from 'next/link'
import { aContinuacion, aMinutos, momentoMontevideo } from '../../lib/grilla'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { IndicadorAlAire } from '../reproductor/IndicadorAlAire'
import { useRadio } from '../reproductor/Radio'
import { IconoFlechaAbajo } from '../ui/iconos'
import { ListaSiguientes } from './ListaSiguientes'

/** Qué parte del programa ya pasó, de 0 a 1. */
function avance(inicio: string, fin: string, minutos: number) {
  const desde = aMinutos(inicio)
  const hasta = fin === '00:00' ? 24 * 60 : aMinutos(fin)
  return Math.min(1, Math.max(0, (minutos - desde) / (hasta - desde)))
}

/**
 * Hero del Inicio (design/LEEME.md, sección 7), claro: el nombre de la radio, la frase y los botones a la
 * izquierda, y detrás el dibujo del Anglo con el río, que se apaga hacia la izquierda y hacia abajo. Encima
 * del muelle flota el panel con el programa al aire (su nombre va en la cabecera) y los tres que siguen.
 * Las medidas de web salen de la pantalla de 1529 px que eligió Maximiliano. En el celular el dibujo va
 * entre la frase y el panel, y no se repite el botón de play del encabezado. La página de Radio sigue con
 * HeroEnVivo, sin cambios.
 */
export function HeroInicio({ children }: { children?: React.ReactNode }) {
  const { alAire, grilla, excepciones, ahora } = useRadio()
  const { dia: hoy, minutos } = momentoMontevideo(ahora)
  const siguientes = aContinuacion(grilla, ahora, 3, excepciones)
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
    <section aria-label="Visión FM 96.5" className="relative isolate overflow-hidden bg-blanco text-tinta">
      {/* Web: el dibujo del Anglo, con más agua abajo para llenar el hueco debajo de los botones */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-16 left-[calc(50%-222.5px)] hidden w-[907px] [mask-image:linear-gradient(90deg,transparent,#000_3%),linear-gradient(0deg,transparent,#000_3%)] [mask-composite:intersect] lg:block"
      >
        <Image src="/hero/anglo-rio.png" alt="" width={1188} height={622} priority className="h-auto w-full" />
      </div>

      <div className="contenedor relative flex flex-wrap items-center gap-x-14 gap-y-8 pt-10 pb-8 md:pt-16 md:pb-14 lg:min-h-[max(600px,calc(100svh-103px))] lg:items-start lg:pt-[83px] lg:pb-24">
        <div className="flex min-w-0 flex-[999_1_540px] flex-col gap-5 md:gap-6">
          <h1 className="m-0 font-[family-name:var(--fuente-destacada)] text-[44px] leading-[1.03] font-extrabold tracking-[-0.035em] md:text-[64px] lg:text-[71px]">
            <span className="block">Visión FM 96.5</span> <span className="block">la radio de</span>{' '}
            <span className="block">Fray Bentos</span>
          </h1>
          {/* En web, una idea por renglón */}
          <p className="m-0 max-w-[520px] text-[17px] leading-[1.5] text-pretty text-tinta [text-shadow:0_0_10px_#fff,0_0_4px_#fff] md:text-xl lg:max-w-none">
            <span className="lg:block">Escuchá la radio en vivo,</span>{' '}
            <span className="lg:block">leé las noticias de Fray{'\u00a0'}Bentos y Río{'\u00a0'}Negro</span>{' '}
            <span className="lg:block">y mirá la cartelera de Cinevisión.</span>
          </p>
          {/* En el celular el play ya está en el encabezado: acá no se repite */}
          <div className="hidden gap-4 pt-1 md:flex md:flex-wrap">
            <BotonEnVivo variante="inicio" />
            <Link
              href="/radio/programacion"
              className="apretable hidden min-h-[54px] items-center rounded-[3px] border-2 border-tinta bg-blanco px-7 text-[13px] font-extrabold tracking-[0.1em] text-tinta uppercase no-underline hover:bg-tinta hover:text-blanco md:flex"
            >
              Programación completa
            </Link>
          </div>
        </div>

        {/* Celular y tablet: el dibujo entre los botones y el panel */}
        <div aria-hidden className="-mx-4 w-[calc(100%+32px)] md:-mx-6 md:w-[calc(100%+48px)] lg:hidden">
          <Image src="/hero/anglo-celular.png" alt="" width={1013} height={436} className="h-auto w-full" />
        </div>

        <div
          id="programacion"
          className="relative flex min-w-0 flex-[1_1_360px] flex-col rounded-[8px] border border-tinta bg-blanco px-5 pt-5 pb-1.5 shadow-[0_14px_40px_rgb(3_28_59/0.14)] md:px-6 md:pt-[22px] flotante-claro lg:absolute lg:top-[351px] lg:left-[847.5px] lg:w-[360px]"
        >
          <div className="flex items-center justify-between gap-3 pb-3">
            <h2 className="m-0 flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-acento uppercase md:text-[13px]">
              <IndicadorAlAire className="size-2" />
              {alAire ? alAire.programa.nombre : 'A continuación'}
            </h2>
            <span className="hidden text-[13px] text-meta first-letter:uppercase md:inline">{fechaCabecera}</span>
            <Link href="/radio/programacion" className="text-xs font-bold text-tinta md:hidden">
              Ver toda
            </Link>
          </div>
          <div className="relative h-0.5 bg-linea">
            {alAire && (
              <div
                className="absolute inset-0 origin-left bg-acento"
                style={{ transform: `scaleX(${avance(alAire.inicio, alAire.fin, minutos)})` }}
              />
            )}
          </div>
          <ListaSiguientes siguientes={siguientes} hoy={hoy} claro />
        </div>
        {children && <div className="w-full pt-3 md:hidden">{children}</div>}
      </div>

      <a
        href="#despues-del-hero"
        className="invitacion-titilar absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] font-extrabold tracking-[0.16em] text-meta uppercase no-underline hover:text-tinta lg:flex"
      >
        <IconoFlechaAbajo tamano={18} className="invitacion-bajar" />
        Deslizá para seguir
      </a>
    </section>
  )
}
