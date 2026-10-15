import type { Metadata } from 'next'
import Link from 'next/link'

import { CarruselCine } from '@/sitio/componentes/cine/CarruselCine'
import { CarteleraDias } from '@/sitio/componentes/cine/CarteleraDias'
import { Precios } from '@/sitio/componentes/cine/Precios'
import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { Foto } from '@/sitio/componentes/ui/Foto'
import { obtenerAjustes, obtenerCartelera } from '@/sitio/datos'
import { obtenerCinevision, proximosEstrenos } from '@/sitio/datos/cinevision'
import { diasConFunciones } from '@/sitio/lib/cine'
import { fechaNumerica, hoyEnMontevideo } from '@/sitio/lib/fecha'
import { telefonoParaLink } from '@/sitio/navegacion'

export const metadata: Metadata = {
  title: 'Cinevisión',
  description: 'La cartelera de Cinevisión, el cine de Fray Bentos: funciones, estrenos, entradas y cómo llegar.',
}

const titulo = 'm-0 font-titulos leading-none font-extrabold'

// Cinevisión (design/LEEME.md, sección 7): carrusel, cartelera por día, próximos estrenos, entradas y
// cómo llegar. La publicidad va debajo de la cartelera, no arriba: primero se ven las películas.
export default async function Cinevision() {
  const hoy = hoyEnMontevideo()
  const [cine, cartelera, estrenos, ajustes] = await Promise.all([
    obtenerCinevision(),
    obtenerCartelera(hoy),
    proximosEstrenos(hoy, 5),
    obtenerAjustes(),
  ])
  const fechas = cartelera.flatMap((p) => p.funciones.map((f) => f.fechaHora)).sort()
  const rango = fechas.length ? `${fechaNumerica(fechas[0])} al ${fechaNumerica(fechas.at(-1)!)}` : ''
  const direccion = cine.comoLlegar.direccion || ajustes.direccion
  const telefono = cine.comoLlegar.telefono || ajustes.telefono

  return (
    <main className="pb-8 md:pb-20">
      <h1 className="sr-only">Cinevisión</h1>
      <CarruselCine diapositivas={cine.carrusel} />

      <div className="contenedor flex flex-col gap-8 pt-6 md:gap-16 md:pt-10">
        <section id="cartelera" aria-labelledby="titulo-cartelera" className="scroll-mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-[3px] border-tinta pb-2 md:items-end md:pb-3">
            <h2 id="titulo-cartelera" className={`${titulo} text-[30px] md:text-[44px]`}>
              Cartelera
            </h2>
            {rango && (
              <span className="text-xs font-extrabold md:text-sm md:tracking-[0.08em] md:uppercase">
                <span className="hidden md:inline">Del </span>
                {rango}
              </span>
            )}
          </div>
          {cartelera.length ? (
            <CarteleraDias
              dias={diasConFunciones(fechas)}
              peliculas={cartelera.map((p) => ({
                id: p.id,
                slug: p.slug,
                titulo: p.titulo,
                afiche: p.afiche,
                dias: diasConFunciones(p.funciones.map((f) => f.fechaHora)),
              }))}
            />
          ) : (
            <p className="text-texto-2">La cartelera de esta semana todavía no está cargada.</p>
          )}
        </section>

        <Publicidad aviso={ajustes.avisoPropio} />

        {estrenos.length > 0 && (
          <section id="estrenos" aria-labelledby="titulo-estrenos" className="scroll-mt-4">
            <h2
              id="titulo-estrenos"
              className={`${titulo} mb-3.5 border-b-[3px] border-tinta pb-2 text-[26px] md:mb-6 md:pb-3 md:text-4xl`}
            >
              Próximos estrenos
            </h2>
            <ul className="-mx-4 m-0 flex list-none gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-6 lg:grid-cols-5 md:overflow-visible md:px-0">
              {estrenos.map((p) => (
                <li key={p.id} className="w-[130px] shrink-0 md:w-auto">
                  <Link href={`/cinevision/${p.slug}`} className="group flex flex-col gap-1.5 no-underline md:gap-2">
                    <Foto
                      imagen={p.afiche}
                      sizes="(min-width: 768px) 230px, 130px"
                      className="aspect-[2/3] w-full"
                      textoSinFoto="Afiche"
                    />
                    <span className="font-titulos text-base font-bold group-hover:text-acento md:sr-only">{p.titulo}</span>
                    <span className="text-xs font-extrabold text-acento md:text-sm md:tracking-[0.04em]">
                      Estreno: {fechaNumerica(p.fechaEstreno)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid gap-8 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] md:gap-10">
          <section
            id="entradas"
            aria-labelledby="titulo-entradas"
            className="flex scroll-mt-4 flex-col gap-3 md:gap-3.5 md:border-t-[3px] md:border-tinta md:pt-3.5"
          >
            <h2
              id="titulo-entradas"
              className={`${titulo} border-b-[3px] border-tinta pb-2 text-[26px] md:border-0 md:pb-0 md:text-3xl`}
            >
              Entradas <span className="md:hidden">y cómo llegar</span>
              <span className="hidden md:inline">y precios</span>
            </h2>
            <Precios datos={cine} />
          </section>

          <section
            id="como-llegar"
            aria-labelledby="titulo-como-llegar"
            className="-mt-5 flex scroll-mt-4 flex-col gap-3 md:mt-0 md:gap-3.5 md:border-t-[3px] md:border-tinta md:pt-3.5"
          >
            <h2 id="titulo-como-llegar" className={`${titulo} sr-only md:not-sr-only md:text-3xl`}>
              Cómo llegar
            </h2>
            <Mapa imagen={cine.comoLlegar.mapa} link={cine.comoLlegar.mapaLink} direccion={direccion} />
            {(direccion || telefono) && (
              <p className="m-0 text-[15px]">
                {direccion}
                {direccion && telefono && <span className="hidden md:inline"> · </span>}
                {telefono && (
                  <a href={`tel:${telefonoParaLink(telefono)}`} className="hidden font-bold md:inline">
                    {telefono}
                  </a>
                )}
              </p>
            )}
            {telefono && (
              <a
                href={`tel:${telefonoParaLink(telefono)}`}
                className="etiqueta flex min-h-12 items-center justify-center border-2 border-tinta no-underline md:hidden"
              >
                Llamar al {telefono}
              </a>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function Mapa({ imagen, link, direccion }: { imagen: Parameters<typeof Foto>[0]['imagen']; link: string; direccion: string }) {
  const foto = (
    <Foto
      imagen={imagen}
      sizes="(min-width: 768px) 600px, 100vw"
      className="h-40 w-full md:h-[200px]"
      textoSinFoto="Mapa"
    />
  )
  if (!imagen && !link) return null
  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${direccion || 'el cine'} en el mapa`} className="block">
      {foto}
    </a>
  ) : (
    foto
  )
}
