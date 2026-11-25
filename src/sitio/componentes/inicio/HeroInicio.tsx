'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { aContinuacion, aMinutos, momentoMontevideo } from '../../lib/grilla'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { IndicadorAlAire } from '../reproductor/IndicadorAlAire'
import { useRadio } from '../reproductor/Radio'
import { IconoFlechaAbajo } from '../ui/iconos'
import { ListaSiguientes } from './ListaSiguientes'

/** Las tres fotos de fondo, en el orden de la frase: la radio, la ciudad y el cine. */
const FOTOS = [
  { src: '/hero/estudio.webp', nombre: 'el estudio de la radio', web: '8% 50%', celular: '27% 50%' },
  { src: '/hero/plaza.webp', nombre: 'la plaza Constitución', web: '44% 50%', celular: '45% 50%' },
  { src: '/hero/cine.webp', nombre: 'el cine', web: '24% 50%', celular: '22% 50%' },
]

/** Cuánto dura cada foto al frente. */
const INTERVALO = 6500

/** Qué parte del programa ya pasó, de 0 a 1. */
function avance(inicio: string, fin: string, minutos: number) {
  const desde = aMinutos(inicio)
  const hasta = fin === '00:00' ? 24 * 60 : aMinutos(fin)
  return Math.min(1, Math.max(0, (minutos - desde) / (hasta - desde)))
}

/**
 * Las fotos pasan solas, una cada INTERVALO, mientras se llena el marcador. Se frenan con el mouse o el foco
 * adentro del hero, y dejan de pasar cuando la persona elige una. Con "reducir movimiento" quedan quietas.
 */
function useCarrusel() {
  const [activa, setActiva] = useState(0)
  const [elegida, setElegida] = useState(false)
  const [pausa, setPausa] = useState(false)
  const [quieta, setQuieta] = useState(true)

  useEffect(() => {
    const consulta = matchMedia('(prefers-reduced-motion: reduce)')
    const leer = () => setQuieta(consulta.matches)
    leer()
    consulta.addEventListener('change', leer)
    return () => consulta.removeEventListener('change', leer)
  }, [])

  return {
    activa,
    corre: !elegida && !quieta,
    pausa,
    setPausa,
    siguiente: () => setActiva((a) => (a + 1) % FOTOS.length),
    elegir: (i: number) => {
      setActiva(i)
      setElegida(true)
    },
  }
}

/**
 * Web: las tres fotos en franjas inclinadas, y la del frente más ancha. Las columnas de la grilla pasan de
 * una medida a la otra; cada franja se estira por debajo de las vecinas y un recorte en diagonal la deja
 * en su lugar.
 */
function FondoTresFotos({ activa }: { activa: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 hidden [--sesgo:96px] motion-safe:transition-[grid-template-columns] motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.65,0,0.35,1)] lg:grid"
      style={{ gridTemplateColumns: FOTOS.map((_, i) => (i === activa ? 'minmax(0,1.7fr)' : 'minmax(0,1fr)')).join(' ') }}
    >
      {FOTOS.map((f, i) => (
        <div
          key={f.src}
          className="relative"
          style={{
            marginInline: 'calc(var(--sesgo) * -1)',
            clipPath:
              'polygon(calc(var(--sesgo) * 2 + 1px) 0, calc(100% - 1px) 0, calc(100% - var(--sesgo) * 2 - 1px) 100%, 1px 100%)',
          }}
        >
          <Image
            src={f.src}
            alt=""
            fill
            sizes="60vw"
            priority={i === 0}
            className="absolute inset-0 size-full object-cover motion-safe:transition-[filter] motion-safe:duration-1000"
            style={{
              objectPosition: f.web,
              filter: i === activa ? 'brightness(0.95) saturate(1.05)' : 'brightness(0.5) saturate(0.8)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

/** Celular y tablet: una foto por vez detrás del título, que se funde con la siguiente. */
function FondoUnaFoto({ activa }: { activa: number }) {
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 h-[600px] md:h-[640px] lg:hidden">
      {FOTOS.map((f, i) => (
        <Image
          key={f.src}
          src={f.src}
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 size-full object-cover motion-safe:transition-opacity motion-safe:duration-1000"
          style={{ objectPosition: f.celular, opacity: i === activa ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(19_22_29/0.42)_0%,rgb(19_22_29/0.7)_45%,var(--color-tinta)_100%)]" />
    </div>
  )
}

function Marcadores({ carrusel }: { carrusel: ReturnType<typeof useCarrusel> }) {
  const { activa, corre, pausa, siguiente, elegir } = carrusel
  return (
    <div role="group" aria-label="Fotos de fondo" className="flex gap-2.5">
      {FOTOS.map((f, i) => (
        <button
          key={f.src}
          type="button"
          aria-label={`Mostrar la foto de ${f.nombre}`}
          aria-pressed={i === activa}
          onClick={() => elegir(i)}
          className="flex h-6 w-[68px] cursor-pointer items-center"
        >
          <span className="relative block h-1 w-full overflow-hidden rounded-[2px] bg-blanco/30">
            {i === activa && (
              <span
                key={`${activa}-${corre}`}
                className="absolute inset-0 origin-left bg-acento"
                style={
                  corre
                    ? {
                        animation: `llenar-marcador ${INTERVALO}ms linear forwards`,
                        animationPlayState: pausa ? 'paused' : 'running',
                      }
                    : undefined
                }
                onAnimationEnd={siguiente}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * Hero del Inicio (design/LEEME.md, sección 7): el nombre de la radio, la frase y los botones a la izquierda,
 * el panel "Al aire ahora" a la derecha y de fondo tres fotos (la radio, la ciudad y el cine) que pasan con
 * los marcadores de abajo de los botones. Abajo al medio, la invitación a seguir bajando. La página de
 * Radio sigue con HeroEnVivo, sin cambios.
 */
export function HeroInicio({ children }: { children?: React.ReactNode }) {
  const { alAire, grilla, excepciones, ahora } = useRadio()
  const carrusel = useCarrusel()
  const { dia: hoy, minutos } = momentoMontevideo(ahora)
  const siguientes = aContinuacion(grilla, ahora, alAire ? 3 : 4, excepciones)
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
    <section
      aria-label="Visión FM 96.5"
      className="relative isolate overflow-hidden bg-tinta text-blanco"
      onMouseEnter={() => carrusel.setPausa(true)}
      onMouseLeave={() => carrusel.setPausa(false)}
      onFocus={() => carrusel.setPausa(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) carrusel.setPausa(false)
      }}
    >
      <FondoTresFotos activa={carrusel.activa} />
      <FondoUnaFoto activa={carrusel.activa} />
      {/* Web: oscuro detrás del texto y del panel, y abajo para la invitación a bajar */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-[radial-gradient(ellipse_48%_62%_at_24%_58%,rgb(19_22_29/0.8),rgb(19_22_29/0.5)_60%,rgb(19_22_29/0)_100%),linear-gradient(90deg,rgb(19_22_29/0.5)_0%,rgb(19_22_29/0.2)_30%,rgb(19_22_29/0.08)_50%,rgb(19_22_29/0.1)_62%,rgb(19_22_29/0.45)_80%,rgb(19_22_29/0.55)_100%)] lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 hidden h-44 bg-[linear-gradient(0deg,var(--color-tinta),transparent)] lg:block"
      />

      <div className="contenedor relative flex flex-wrap items-center gap-x-14 gap-y-8 pt-10 pb-8 md:pt-16 md:pb-14 lg:min-h-[max(600px,calc(100svh-103px))] lg:pt-12 lg:pb-24">
        <div className="flex min-w-0 flex-[999_1_540px] flex-col gap-5 md:gap-6">
          <h1 className="m-0 font-titulos text-[44px] leading-[1.03] font-bold tracking-[-0.03em] [text-shadow:0_2px_28px_rgb(19_22_29/0.55)] md:text-[64px] lg:text-[74px]">
            <span className="block">Visión FM 96.5</span> <span className="block">la radio de</span>{' '}
            <span className="block">Fray Bentos</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[17px] leading-[1.5] text-pretty text-oscuro-1 [text-shadow:0_1px_12px_rgb(19_22_29/0.9)] md:text-xl">
            Escuchá la radio en vivo, leé las noticias de Fray{' '}Bentos y Río{' '}Negro y mirá la
            cartelera de Cinevisión.
          </p>
          <div className="flex flex-col gap-3 pt-1 md:flex-row md:flex-wrap md:gap-4">
            <BotonEnVivo variante="inicio" />
            <Link
              href="/radio/programacion"
              className="apretable hidden min-h-[54px] items-center rounded-[3px] border-2 border-blanco bg-tinta/40 px-7 text-[13px] font-extrabold tracking-[0.1em] text-blanco uppercase no-underline hover:bg-blanco hover:text-tinta md:flex"
            >
              Programación completa
            </Link>
          </div>
          <div className="pt-1 md:pt-3">
            <Marcadores carrusel={carrusel} />
          </div>
        </div>

        <div
          id="programacion"
          className="flex min-w-0 flex-[1_1_360px] flex-col border border-blanco/14 bg-tinta/88 px-5 pt-5 pb-1.5 md:px-6 md:pt-[22px] lg:max-w-[400px] lg:self-center"
        >
          <div className="flex items-center justify-between gap-3 pb-3">
            <h2 className="m-0 flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-vivo-claro uppercase md:text-[13px]">
              <IndicadorAlAire className="size-2" />
              {alAire ? 'Al aire ahora' : 'A continuación'}
            </h2>
            <span className="hidden text-[13px] text-oscuro-2 first-letter:uppercase md:inline">{fechaCabecera}</span>
            <Link href="/radio/programacion" className="text-xs font-bold text-blanco md:hidden">
              Ver toda
            </Link>
          </div>
          <div className="relative h-0.5 bg-blanco/15">
            {alAire && (
              <div
                className="absolute inset-0 origin-left bg-acento"
                style={{ transform: `scaleX(${avance(alAire.inicio, alAire.fin, minutos)})` }}
              />
            )}
          </div>
          <ListaSiguientes alAire={alAire} siguientes={siguientes} hoy={hoy} />
        </div>
        {children && <div className="w-full pt-3 md:hidden">{children}</div>}
      </div>

      <a
        href="#despues-del-hero"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-[11px] font-extrabold tracking-[0.16em] text-oscuro-2 uppercase no-underline hover:text-blanco lg:flex"
      >
        <IconoFlechaAbajo tamano={18} className="invitacion-bajar" />
        Deslizá para seguir
      </a>
    </section>
  )
}
