import type { Metadata } from 'next'
import Link from 'next/link'

import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { BandaAlAire } from '@/sitio/componentes/radio/BandaAlAire'
import { GrillaSemanal } from '@/sitio/componentes/radio/GrillaSemanal'
import { Foto } from '@/sitio/componentes/ui/Foto'
import { TituloSeccion } from '@/sitio/componentes/ui/TituloSeccion'
import { obtenerAjustes, obtenerProgramacion, obtenerVoces } from '@/sitio/datos'

export const metadata: Metadata = {
  title: 'Programación',
  description: 'Lo que suena en Visión 96.5 FM, día por día, y quiénes lo conducen.',
}

// Programación (design/LEEME.md, sección 7): banda al aire, pestañas por día y "Las voces de Visión"
export default async function Programacion() {
  const [ajustes, programas, voces] = await Promise.all([
    obtenerAjustes(),
    obtenerProgramacion(),
    obtenerVoces(),
  ])

  return (
    <main className="pb-10 md:pb-20">
      <div className="contenedor pt-4 md:pt-8">
        <Publicidad ubicacion="radio-programacion" aviso={ajustes.avisoPropio} />
      </div>
      <div className="contenedor pt-4 md:pt-9">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-6 md:border-b-[3px] md:border-tinta md:pb-5">
          <div className="flex flex-col gap-2 md:gap-2.5">
            <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">
              Radio · 96.5 FM
            </span>
            <h1 className="m-0 font-titulos text-[40px] leading-none font-extrabold tracking-[-0.02em] md:text-[64px]">
              Programación
            </h1>
            <p className="m-0 hidden text-[17px] text-texto-2 md:block">Lo que suena en Visión, día por día.</p>
          </div>
          <BandaAlAire />
        </div>
        <div className="mt-4 md:mt-0">
          <GrillaSemanal programas={programas} />
        </div>

        {voces.length > 0 && (
          <section id="conductores" aria-labelledby="titulo-voces" className="mt-8 scroll-mt-4 md:mt-16">
            <TituloSeccion titulo="Las voces de Visión" id="titulo-voces">
              <Link href="/institucional#equipo" className="etiqueta hidden text-[11px] md:block">
                Todo el equipo <span aria-hidden>→</span>
              </Link>
            </TituloSeccion>
            <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-2.5 gap-y-5 p-0 md:mt-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-6">
              {voces.map((v) => (
                <li key={v.id} className="flex flex-col gap-1">
                  <Foto
                    imagen={v.foto}
                    sizes="(min-width: 1024px) 200px, (min-width: 768px) 33vw, 50vw"
                    className="mb-2 aspect-square h-auto w-full md:mb-3"
                  />
                  <strong className="font-titulos text-base font-bold md:text-xl">{v.nombre}</strong>
                  <span className="text-xs text-meta md:text-sm">{v.rol}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
