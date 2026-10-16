import Link from 'next/link'

import type { AjustesSitio } from '../../datos'
import { Publicidad } from '../globales/Publicidad'

/**
 * Armazón de Quiero sumarme, Pedir tarifas y Contacto (design/LEEME.md, sección 7): publicidad, ruta,
 * kicker, título y bajada; debajo de la raya, la columna lateral y el formulario.
 */
export function PaginaFormulario({
  ajustes,
  miga,
  kicker,
  titulo,
  bajada,
  lateral,
  children,
}: {
  ajustes: AjustesSitio
  /** Nombre de la página en la ruta; sin él no hay ruta (Contacto) */
  miga?: string
  kicker: string
  titulo: string
  bajada: React.ReactNode
  lateral: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="pb-10 md:pb-20">
      <div className="contenedor pt-4 md:pt-7">
        <Publicidad aviso={ajustes.avisoPropio} />
      </div>
      <div className="contenedor">
        {miga ? (
          <nav aria-label="Ruta" className="pt-5 text-[13px] text-meta md:pt-8">
            <Link href="/institucional" className="text-meta md:hidden">
              ← Institucional
            </Link>
            <span className="hidden gap-2 md:flex">
              <Link href="/institucional" className="text-meta">
                Institucional
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page">{miga}</span>
            </span>
          </nav>
        ) : null}
        <div className={`flex flex-col gap-2 md:max-w-[760px] md:gap-2.5 ${miga ? 'pt-5 md:pt-8' : 'pt-5 md:pt-9'}`}>
          <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">{kicker}</span>
          <h1 className="m-0 font-titulos text-[34px] leading-[1.05] font-extrabold tracking-[-0.01em] md:text-[64px] md:leading-none md:tracking-[-0.02em]">
            {titulo}
          </h1>
          <div className="mt-1 text-[17px] leading-[1.6] text-texto-2 md:mt-2 md:text-lg [&_p]:m-0">{bajada}</div>
        </div>
        <div className="mt-6 flex flex-col gap-7 border-t border-linea pt-6 md:mt-11 md:grid md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-x-10 md:border-t-[3px] md:border-tinta md:pt-9 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-x-14">
          <div className="flex flex-col gap-6">{lateral}</div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  )
}

/** "Cómo funciona": pasos numerados de la columna lateral. */
export function Pasos({ pasos }: { pasos: { titulo: string; texto: string }[] }) {
  return (
    <section aria-labelledby="titulo-pasos">
      <h2 id="titulo-pasos" className="m-0 mb-4 hidden text-xs font-extrabold tracking-[0.1em] uppercase md:block md:text-[13px]">
        Cómo funciona
      </h2>
      <ol className="m-0 list-none p-0">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex gap-4 border-b border-linea py-4 first:pt-0 md:first:border-t md:first:pt-4">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tinta text-[15px] font-extrabold text-blanco"
            >
              {i + 1}
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-titulos text-lg leading-tight font-bold md:text-xl">{p.titulo}</span>
              <span className="text-[15px] leading-[1.55] text-texto-2">{p.texto}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
