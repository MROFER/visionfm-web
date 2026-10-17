import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FuncionesDias } from '@/sitio/componentes/cine/FuncionesDias'
import { Precios } from '@/sitio/componentes/cine/Precios'
import { Trailer } from '@/sitio/componentes/cine/Trailer'
import { DatosEstructurados } from '@/sitio/componentes/ui/DatosEstructurados'
import { Foto } from '@/sitio/componentes/ui/Foto'
import { obtenerAjustes, obtenerCartelera } from '@/sitio/datos'
import { obtenerCinevision, obtenerPelicula, type PeliculaCompleta } from '@/sitio/datos/cinevision'
import { versiones } from '@/sitio/lib/cine'
import { imagenParaCompartir, OPEN_GRAPH, urlDelSitio } from '@/sitio/lib/compartir'
import { fechaDia, fechaNumerica, hoyEnMontevideo } from '@/sitio/lib/fecha'
import { calificacion, duracionPelicula } from '@/sitio/lib/formato'
import { cine as nodoCine, migas, pelicula as nodosPelicula } from '@/sitio/seo/estructurados'

type Parametros = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { slug } = await params
  const pelicula = await obtenerPelicula(slug)
  if (!pelicula) return {}
  return {
    title: pelicula.seo.titulo,
    description: pelicula.seo.descripcion,
    alternates: { canonical: `/cinevision/${slug}` },
    openGraph: {
      ...OPEN_GRAPH,
      type: 'video.movie',
      url: `/cinevision/${slug}`,
      title: pelicula.seo.titulo,
      description: pelicula.seo.descripcion,
      images: imagenParaCompartir(pelicula.seo.imagen, { recortar: false }),
    },
  }
}

const titulo2 = 'm-0 border-b-[3px] border-tinta pb-2 font-titulos text-[26px] leading-none font-extrabold lg:pb-2.5 lg:text-[32px]'

// La película (design/LEEME.md, sección 7). Web: tráiler y funciones lado a lado, ficha técnica y
// "También en cartelera". Celular: funciones, tráiler, sinopsis, ficha y "También en cartelera". Sin
// publicidad.
export default async function Pelicula({ params }: Parametros) {
  const { slug } = await params
  const hoy = hoyEnMontevideo()
  const [pelicula, cartelera, cine, ajustes] = await Promise.all([
    obtenerPelicula(slug),
    obtenerCartelera(hoy),
    obtenerCinevision(),
    obtenerAjustes(),
  ])
  if (!pelicula) notFound()

  const funciones = cartelera.find((p) => p.id === pelicula.id)?.funciones ?? []
  const fechas = funciones.map((f) => f.fechaHora)
  const rango = fechas.length ? `${fechaNumerica(fechas[0])} al ${fechaNumerica(fechas.at(-1)!)}` : ''
  const otras = cartelera.filter((p) => p.id !== pelicula.id).slice(0, 4)
  const proximoEstreno = pelicula.fechaEstreno && pelicula.fechaEstreno.slice(0, 10) > hoy ? pelicula.fechaEstreno : null
  const tieneFicha = Object.values(pelicula.creditos).some(Boolean) || pelicula.anio
  const origen = urlDelSitio().origin
  const datos = [
    ...nodosPelicula(origen, pelicula, funciones),
    nodoCine(origen, {
      ...cine.comoLlegar,
      direccion: cine.comoLlegar.direccion || ajustes.direccion,
      telefono: cine.comoLlegar.telefono || ajustes.telefono,
    }),
    migas(origen, [
      { nombre: 'Cinevisión', ruta: '/cinevision' },
      { nombre: pelicula.titulo },
    ]),
  ]

  return (
    <main className="pb-8 lg:pb-20">
      <DatosEstructurados nodos={datos} />
      <nav aria-label="Ruta" className="contenedor py-3 text-[13px] lg:py-[18px]">
        <Link href="/cinevision#cartelera" className="font-bold text-meta no-underline lg:hidden">
          ‹ Cartelera
        </Link>
        <span className="hidden flex-wrap gap-1.5 text-meta lg:flex">
          <Link href="/cinevision" className="text-meta">
            Cinevisión
          </Link>
          <span aria-hidden>›</span>
          <Link href="/cinevision#cartelera" className="text-meta">
            Cartelera
          </Link>
          <span aria-hidden>›</span>
          <span aria-current="page" className="font-bold text-tinta">
            {pelicula.titulo}
          </span>
        </span>
      </nav>

      <Franja pelicula={pelicula} />

      <div className="contenedor flex flex-col gap-7 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-12 lg:gap-y-14 lg:pt-12">
        <section id="funciones" aria-labelledby="titulo-funciones" className="flex scroll-mt-4 flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <div className="flex items-baseline justify-between gap-4 border-b-[3px] border-tinta pb-2 lg:pb-2.5">
            <h2 id="titulo-funciones" className="m-0 font-titulos text-[26px] leading-none font-extrabold lg:text-[32px]">
              Funciones
            </h2>
            {rango && (
              <span className="text-[11px] font-extrabold lg:text-xs lg:tracking-[0.1em] lg:text-meta lg:uppercase">
                <span className="hidden lg:inline">Del </span>
                {rango}
              </span>
            )}
          </div>
          <div className="-mt-4">
            {funciones.length ? (
              <FuncionesDias funciones={funciones} />
            ) : (
              <p className="mt-4 mb-0 text-texto-2">
                {proximoEstreno
                  ? `Se estrena el ${fechaDia(proximoEstreno)}. Las funciones se publican en la semana del estreno.`
                  : 'Esta semana no tiene funciones.'}
              </p>
            )}
          </div>
          <Precios datos={cine} className="lg:mt-auto" />
        </section>

        <section
          id="trailer"
          aria-labelledby="titulo-trailer"
          className={`min-w-0 scroll-mt-4 flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:flex lg:gap-4 ${pelicula.trailer ? 'flex' : 'hidden'}`}
        >
          <h2 id="titulo-trailer" className={titulo2}>
            Tráiler
          </h2>
          {pelicula.trailer ? (
            <Trailer video={pelicula.trailer} titulo={pelicula.titulo} />
          ) : (
            <p className="m-0 flex aspect-video items-center justify-center bg-suave text-sm text-meta">
              El tráiler todavía no está disponible.
            </p>
          )}
        </section>

        <section aria-labelledby="titulo-sinopsis" className="flex flex-col gap-3 lg:hidden">
          <h2 id="titulo-sinopsis" className={titulo2}>
            Sinopsis
          </h2>
          <p className="m-0 text-base leading-[1.65] whitespace-pre-line">{pelicula.sinopsis}</p>
        </section>

        {tieneFicha && (
          <section aria-labelledby="titulo-ficha" className="flex flex-col lg:col-span-2">
            <h2 id="titulo-ficha" className={titulo2}>
              Ficha técnica
            </h2>
            <Ficha pelicula={pelicula} />
          </section>
        )}
      </div>

      {otras.length > 0 && (
        <section aria-labelledby="titulo-otras" className="contenedor pt-7 lg:pt-14">
          <div className="mb-3.5 flex items-baseline justify-between gap-4 border-b-[3px] border-tinta pb-2 lg:mb-6 lg:pb-2.5">
            <h2 id="titulo-otras" className="m-0 font-titulos text-[26px] leading-none font-extrabold lg:text-[32px]">
              También en cartelera
            </h2>
            <Link href="/cinevision#cartelera" className="hidden text-[13px] font-extrabold tracking-[0.1em] uppercase lg:inline">
              Ver cartelera →
            </Link>
          </div>
          <ul className="-mx-4 m-0 flex list-none gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
            {otras.map((p) => (
              <li key={p.id} className="w-[130px] shrink-0 lg:w-auto">
                <Link href={`/cinevision/${p.slug}`} className="group flex flex-col gap-1.5 no-underline">
                  <Foto imagen={p.afiche} sizes="(min-width: 1024px) 290px, 130px" className="aspect-[2/3] w-full" textoSinFoto="Afiche" />
                  <span className="font-titulos text-base font-bold group-hover:text-acento lg:sr-only">{p.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

/** Franja oscura: afiche, "Estreno", título, original y año, calificación y versiones. */
function Franja({ pelicula }: { pelicula: PeliculaCompleta }) {
  const idiomas = versiones(pelicula.idiomas, 'idioma')
  const formatos = versiones(pelicula.formatos, 'formato')
  const original = [pelicula.tituloOriginal, pelicula.anio].filter(Boolean).join(' · ')
  return (
    <section aria-labelledby="titulo-pelicula" className="bg-tinta text-blanco">
      <div className="contenedor flex gap-3.5 py-5 lg:gap-12 lg:py-12">
        <Foto
          imagen={pelicula.afiche}
          prioridad
          sizes="(min-width: 1024px) 300px, 128px"
          className="h-48 w-32 shrink-0 bg-oscuro-linea lg:h-[450px] lg:w-[300px]"
          textoSinFoto="Afiche"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-4">
          {pelicula.esEstreno && (
            <span className="self-start bg-acento px-2 py-1 text-[10px] font-extrabold tracking-[0.1em] uppercase lg:px-2.5 lg:py-1.5 lg:text-xs">
              Estreno
            </span>
          )}
          <h1
            id="titulo-pelicula"
            className="m-0 font-titulos text-[26px] leading-[1.05] font-extrabold lg:text-[64px] lg:leading-[0.98] lg:tracking-[-0.02em]"
          >
            {pelicula.titulo}
          </h1>
          {original && <span className="text-xs text-oscuro-2 lg:text-base">{original}</span>}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-[#e4e5e8] lg:gap-x-5 lg:gap-y-2.5 lg:text-base">
            <span
              title="Calificación"
              className="inline-flex h-7 min-w-7 items-center justify-center border-2 border-current px-1.5 text-xs font-extrabold lg:h-9 lg:min-w-9 lg:text-[15px]"
            >
              {calificacion(pelicula.calificacion)}
            </span>
            <span>{pelicula.genero}</span>
            <span aria-hidden className="hidden lg:inline">·</span>
            <span>{duracionPelicula(pelicula.duracion)}</span>
            {[idiomas, formatos].filter(Boolean).map((v) => (
              <span key={v} className="hidden lg:contents">
                <span aria-hidden>·</span>
                <span>{v}</span>
              </span>
            ))}
          </div>
          <span className="text-xs text-oscuro-1 lg:hidden">{[idiomas, formatos].filter(Boolean).join(' · ')}</span>
          <p className="m-0 mt-2 hidden max-w-[640px] text-lg leading-relaxed whitespace-pre-line text-[#e4e5e8] lg:block">
            {pelicula.sinopsis}
          </p>
        </div>
      </div>
    </section>
  )
}

function Ficha({ pelicula }: { pelicula: PeliculaCompleta }) {
  const c = pelicula.creditos
  const filas = [
    ['Dirección', c.direccion],
    ['Reparto', c.reparto],
    ['Guion', c.guion],
    ['País y año', [c.pais, pelicula.anio].filter(Boolean).join(' · ')],
    ['Idioma', c.idiomaOriginal],
    ['Distribuidora', c.distribuidora],
  ].filter(([, valor]) => valor)
  return (
    <dl className="m-0 lg:grid lg:grid-cols-2 lg:gap-x-12">
      {filas.map(([nombre, valor]) => (
        <div
          key={nombre}
          className="flex flex-col gap-0.5 border-b border-linea py-2.5 lg:grid lg:grid-cols-[160px_1fr] lg:gap-4 lg:py-3"
        >
          <dt className="text-[11px] font-extrabold tracking-[0.1em] text-meta uppercase lg:pt-0.5 lg:text-xs">{nombre}</dt>
          <dd className="m-0 text-[15px] lg:text-base">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}
