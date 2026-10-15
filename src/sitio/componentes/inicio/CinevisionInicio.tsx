import Link from 'next/link'

import type { TarjetaPelicula } from '../../datos/formas'
import { diasDeFunciones, fechaNumerica } from '../../lib/fecha'
import { calificacion, duracionPelicula } from '../../lib/formato'
import { IconoPlay } from '../ui/iconos'
import { Foto } from '../ui/Foto'
import { BotonOscuro, TituloSeccion } from '../ui/TituloSeccion'

type PeliculaEnCartelera = TarjetaPelicula & { funciones: { fechaHora: string }[] }

/**
 * Banda gris de Cinevisión en el Inicio: película destacada con género, duración y calificación
 * (también en el celular) y "También en cartelera" con los días, sin horarios.
 */
export function CinevisionInicio({
  cartelera,
  destacadaId,
  direccion,
}: {
  cartelera: PeliculaEnCartelera[]
  destacadaId: number | null
  direccion: string
}) {
  const destacada = cartelera.find((p) => p.id === destacadaId) ?? cartelera[0]
  const resto = cartelera.filter((p) => p !== destacada).slice(0, 3)
  const fechas = cartelera.flatMap((p) => p.funciones.map((f) => f.fechaHora)).sort()
  const rango = fechas.length ? `del ${fechaNumerica(fechas[0])} al ${fechaNumerica(fechas.at(-1)!)}` : ''

  return (
    <section id="cine" aria-label="Cinevisión" className="border-y border-linea bg-suave">
      <div className="contenedor flex flex-col gap-4 py-7 lg:gap-8 lg:pt-14 lg:pb-16">
        <TituloSeccion titulo="El cine de Fray Bentos" kicker="Cinevisión · Cine" tamano="enorme">
          <div className="hidden flex-col items-end gap-2.5 lg:flex">
            {rango && <span className="text-[13px] font-extrabold tracking-[0.08em] uppercase">Cartelera {rango}</span>}
            <BotonOscuro href="/cinevision">Cartelera completa</BotonOscuro>
          </div>
        </TituloSeccion>
        <p className="-mt-2 text-[13px] text-texto-2 lg:-mt-6 lg:text-base">
          En el mismo edificio de Visión{direccion && ` · ${direccion}`}
          <span className="lg:hidden">{rango && ` · Cartelera ${rango}`}</span>
        </p>

        {destacada ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:gap-10">
            <article className="flex min-w-0 flex-col gap-3 bg-tinta p-4 text-blanco lg:flex-[999_1_560px] lg:flex-row lg:flex-wrap lg:gap-7 lg:p-7">
              <div className="flex gap-3.5 lg:contents">
                <Link href={`/cinevision/${destacada.slug}`} aria-hidden tabIndex={-1} className="shrink-0 lg:flex-[0_0_240px]">
                  <Foto
                    imagen={destacada.afiche}
                    sizes="(min-width: 1024px) 240px, 120px"
                    className="h-[180px] w-[120px] bg-oscuro-linea lg:h-[360px] lg:w-60"
                    textoSinFoto="Afiche"
                  />
                </Link>
                <div className="flex min-w-0 flex-col gap-2 lg:hidden">
                  <Kicker estreno={destacada.esEstreno} />
                  <h3 className="m-0 font-titulos text-[26px] leading-[1.05] font-bold">{destacada.titulo}</h3>
                  <Datos pelicula={destacada} />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-3 lg:flex-[1_1_260px] lg:gap-3.5">
                <div className="hidden flex-col gap-3.5 lg:flex">
                  <Kicker estreno={destacada.esEstreno} />
                  <h3 className="m-0 font-titulos text-[44px] leading-[1.02] font-bold">
                    <Link href={`/cinevision/${destacada.slug}`} className="no-underline">
                      {destacada.titulo}
                    </Link>
                  </h3>
                  <Datos pelicula={destacada} />
                </div>
                <p className="m-0 line-clamp-4 max-w-[520px] text-sm leading-[1.55] text-[#e4e6ea] lg:text-base lg:leading-relaxed">
                  {destacada.sinopsis}
                </p>
                <div className="grid grid-cols-2 gap-2 lg:mt-auto lg:flex lg:flex-wrap lg:gap-2.5 lg:pt-2.5">
                  <Link
                    href={`/cinevision/${destacada.slug}#trailer`}
                    className="flex min-h-12 items-center justify-center gap-2.5 bg-acento px-5 text-[11px] font-extrabold tracking-[0.1em] text-blanco uppercase no-underline hover:bg-acento-hover lg:text-xs"
                  >
                    <IconoPlay tamano={14} className="hidden lg:block" />
                    Ver tráiler
                  </Link>
                  <Link
                    href={`/cinevision/${destacada.slug}#funciones`}
                    className="flex min-h-12 items-center justify-center border-2 border-blanco px-5 text-[11px] font-extrabold tracking-[0.1em] text-blanco uppercase no-underline hover:bg-blanco hover:text-tinta lg:text-xs"
                  >
                    Ver funciones
                  </Link>
                </div>
              </div>
            </article>

            {resto.length > 0 && (
              <div className="flex min-w-0 flex-col lg:flex-[1_1_340px]">
                <h3 className="m-0 hidden border-b-[3px] border-tinta pb-2.5 text-[13px] font-extrabold tracking-[0.1em] uppercase lg:block">
                  También en cartelera
                </h3>
                <ul className="m-0 flex list-none gap-2.5 overflow-x-auto p-0 lg:flex-col lg:gap-0 lg:overflow-visible">
                  {resto.map((p) => (
                    <li key={p.id} className="flex w-[130px] shrink-0 flex-col gap-1.5 lg:w-auto lg:flex-row lg:gap-4 lg:border-b lg:border-linea lg:py-4">
                      <Link href={`/cinevision/${p.slug}`} aria-hidden tabIndex={-1} className="shrink-0">
                        <Foto
                          imagen={p.afiche}
                          sizes="(min-width: 1024px) 72px, 130px"
                          className="h-[195px] w-[130px] lg:h-[108px] lg:w-[72px]"
                          textoSinFoto="Afiche"
                        />
                      </Link>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href={`/cinevision/${p.slug}`}
                          className="font-titulos text-[17px] leading-[1.15] font-bold no-underline lg:text-[22px]"
                        >
                          {p.titulo}
                        </Link>
                        <span className="hidden text-[13px] text-meta lg:block">
                          {p.genero} · {calificacion(p.calificacion)}
                        </span>
                        <span className="text-xs font-extrabold lg:text-[13px]">
                          {diasDeFunciones(p.funciones.map((f) => f.fechaHora))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-texto-2">La cartelera de esta semana todavía no está cargada.</p>
        )}
        <BotonOscuro href="/cinevision" className="min-h-12 lg:hidden">
          Cartelera completa
        </BotonOscuro>
      </div>
    </section>
  )
}

const Kicker = ({ estreno }: { estreno: boolean }) => (
  <span className="text-[10px] font-extrabold tracking-[0.12em] text-vivo-claro uppercase lg:text-xs">
    {estreno ? 'Película de estreno' : 'En cartelera'}
  </span>
)

const Datos = ({ pelicula }: { pelicula: TarjetaPelicula }) => (
  <span className="text-xs text-oscuro-1 lg:text-sm">
    {pelicula.genero} · {duracionPelicula(pelicula.duracion)} · {calificacion(pelicula.calificacion)}
  </span>
)
