import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { EquipoRadio } from '@/sitio/componentes/institucional/EquipoRadio'
import { Historia } from '@/sitio/componentes/institucional/Historia'
import { CintaConMas } from '@/sitio/componentes/ui/CintaConMas'
import { Migas } from '@/sitio/componentes/ui/Migas'
import { Redes } from '@/sitio/componentes/ui/Redes'
import { obtenerAjustes } from '@/sitio/datos'
import { obtenerEquipo, obtenerInstitucional } from '@/sitio/datos/institucional'
import { hoyEnMontevideo } from '@/sitio/lib/fecha'

export const metadata: Metadata = {
  title: 'Institucional',
  description: 'Quiénes somos, nuestra historia y el equipo de Visión 96.5 FM, la radio de Fray Bentos.',
}

const SECCIONES = [
  { id: 'nosotros', nombre: 'Quiénes somos' },
  { id: 'equipo', nombre: 'Equipo' },
  { id: 'ser-parte', nombre: 'Ser parte' },
  { id: 'musica', nombre: 'Tu música' },
  { id: 'publicidad', nombre: 'Publicidad' },
  { id: 'contacto', nombre: 'Contacto' },
]

const PRODUCTOS = [
  { tipo: 'Radio', nombre: 'Spots y auspicios', detalle: 'Tandas, menciones y auspicio de programas en el 96.5 FM.' },
  {
    tipo: 'Web',
    nombre: 'Banners en el sitio',
    detalle: 'Espacio rotativo en todas las secciones: 970 × 90 en computadora y 320 × 100 o 300 × 250 en celular.',
  },
  { tipo: 'Cine', nombre: 'Cinevisión', detalle: 'Tu aviso en la página de la cartelera de Cinevisión.' },
]

const titulo2 = 'm-0 font-titulos text-[28px] leading-none font-extrabold md:text-[40px]'
const texto = 'flex flex-col gap-3 text-base leading-[1.6] text-texto-2 md:gap-3.5 md:text-lg md:leading-[1.65] [&_p]:m-0'

// Institucional (design/LEEME.md, sección 7): Quiénes somos, Nuestra historia, Equipo, Ser parte,
// Tu música, Publicidad y Contacto en una sola página, con anclas para el menú.
export default async function Institucional() {
  const [ajustes, inst, equipo] = await Promise.all([obtenerAjustes(), obtenerInstitucional(), obtenerEquipo()])

  return (
    <main className="pb-8 md:pb-20">
      <Migas pasos={[{ nombre: 'Institucional' }]} />
      <div className="contenedor pt-4 md:pt-7">
        <Publicidad ubicacion="institucional" aviso={ajustes.avisoPropio} />
      </div>

      <div className="contenedor pt-4 md:pt-9">
        <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">Institucional</span>
        <h1 className="m-0 mt-2 mb-4 font-titulos text-[34px] leading-[1.05] font-extrabold tracking-[-0.01em] md:mt-2.5 md:mb-5 md:text-[64px] md:leading-none md:tracking-[-0.02em]">
          Radio, noticias y cine en Fray Bentos
        </h1>
        {/* El mismo "+" de Noticias y Entrevistas: en el celular avisa que hay más a la derecha */}
        <CintaConMas
          etiqueta="Secciones institucionales"
          etiquetaMas="Ver más secciones"
          className="border-t-[3px] border-tinta"
          claseNav="flex gap-[18px] overflow-x-auto border-b border-linea md:flex-wrap md:gap-x-7"
        >
          {SECCIONES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex min-h-11 shrink-0 items-center text-xs font-extrabold tracking-[0.08em] uppercase no-underline hover:text-acento md:min-h-12 md:text-[13px]"
            >
              {s.nombre}
            </a>
          ))}
        </CintaConMas>

        <section id="nosotros" aria-labelledby="titulo-nosotros" className="flex scroll-mt-4 flex-col gap-3 py-6 md:max-w-[760px] md:gap-3.5 md:pt-12 md:pb-10">
          <h2 id="titulo-nosotros" className={titulo2}>
            Quiénes somos
          </h2>
          <div className={texto}>
            {inst.quienesSomos ? (
              <RichText data={inst.quienesSomos} />
            ) : (
              <p>
                Visión es un medio de Fray Bentos que reúne una radio, el 96.5 FM; una redacción de noticias locales; y
                Cinevisión, el cine que funciona en el mismo edificio.
              </p>
            )}
          </div>
        </section>

        <Historia hitos={inst.hitos} anioActual={Number(hoyEnMontevideo().slice(0, 4))} />

        <section id="equipo" aria-labelledby="titulo-equipo" className="scroll-mt-4 border-b border-linea py-6 md:pt-16 md:pb-14">
          <h2 id="titulo-equipo" className={`${titulo2} mb-3.5 md:mb-6`}>
            Equipo
          </h2>
          <EquipoRadio grupos={equipo} />
        </section>

        <section
          id="ser-parte"
          aria-labelledby="titulo-ser-parte"
          className="flex scroll-mt-4 flex-col gap-3 border-b border-linea py-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-8 md:py-14"
        >
          <div className="flex flex-col gap-3 md:flex-[1_1_480px]">
            <h2 id="titulo-ser-parte" className={titulo2}>
              Ser parte
            </h2>
            <div className={texto}>
              {inst.serParte ? (
                <RichText data={inst.serParte} />
              ) : (
                <p>Columnistas, colaboradores, pasantías y propuestas de programas: contanos qué te gustaría hacer.</p>
              )}
            </div>
          </div>
          <Boton href="/institucional/sumarse">Quiero sumarme →</Boton>
        </section>

        {/* Tu música: la puerta de los artistas, aparte de Ser parte, que es trabajar en la radio (8/11/2026) */}
        <section
          id="musica"
          aria-labelledby="titulo-musica"
          className="flex scroll-mt-4 flex-col gap-3 border-b border-linea py-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-8 md:py-14"
        >
          <div className="flex flex-col gap-3 md:flex-[1_1_480px]">
            <h2 id="titulo-musica" className={titulo2}>
              Tu música
            </h2>
            <div className={texto}>
              {inst.tuMusica ? (
                <RichText data={inst.tuMusica} />
              ) : (
                <p>
                  ¿Sos artista o tenés una banda? Queremos escuchar tu material. Compartilo con nosotros para una posible
                  difusión en el 96.5.
                </p>
              )}
            </div>
          </div>
          <Boton href="/institucional/musica">Enviar mi música →</Boton>
        </section>

        <section id="publicidad" aria-labelledby="titulo-publicidad" className="flex scroll-mt-4 flex-col gap-3 border-b border-linea py-6 md:gap-7 md:py-14">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4">
            <div className="flex flex-col gap-3 md:gap-2.5">
              <h2 id="titulo-publicidad" className={titulo2}>
                Publicidad
              </h2>
              <div className={texto}>
                {inst.publicidad ? <RichText data={inst.publicidad} /> : <p>Tu marca en la radio, en el sitio y en el cine.</p>}
              </div>
            </div>
            <Boton href="/institucional/publicidad" className="hidden md:flex">
              Pedir tarifas →
            </Boton>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 md:grid md:grid-cols-3 md:gap-4 lg:gap-6">
            {PRODUCTOS.map((p) => (
              <li key={p.tipo} className="flex flex-col gap-1 border-2 border-tinta p-4 md:gap-2.5 md:p-6">
                <span className="text-[10px] font-extrabold tracking-[0.1em] text-acento uppercase md:text-[11px]">{p.tipo}</span>
                <span className="font-titulos text-[19px] font-bold md:text-2xl">{p.nombre}</span>
                <span className="hidden text-[15px] leading-[1.55] text-texto-2 md:block">{p.detalle}</span>
              </li>
            ))}
          </ul>
          <Boton href="/institucional/publicidad" className="flex md:hidden">
            Pedir tarifas →
          </Boton>
        </section>

        <section id="contacto" aria-labelledby="titulo-contacto" className="flex scroll-mt-4 flex-col gap-3.5 pt-6 md:pt-14">
          <h2 id="titulo-contacto" className={titulo2}>
            Contacto
          </h2>
          <p className="m-0 text-[15px] leading-[1.6] text-meta md:text-base">Para noticias, avisos, publicidad o salir al aire.</p>
          {ajustes.direccion && <span className="text-[15px] font-bold md:text-base">{ajustes.direccion}</span>}
          <Redes ajustes={ajustes} claro className="flex" />
          <Boton href="/institucional/contacto">Escribinos →</Boton>
        </section>
      </div>
    </main>
  )
}

// Los tres botones (Quiero sumarme, Pedir tarifas y Escribinos) son iguales: oscuros y naranjas al pasar
// el mouse (8/11/2026)
function Boton({ href, className = 'flex', children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`etiqueta min-h-12 items-center justify-center self-stretch bg-tinta px-6 text-blanco no-underline hover:bg-acento md:min-h-[52px] md:self-start ${className}`}
    >
      {children}
    </Link>
  )
}
