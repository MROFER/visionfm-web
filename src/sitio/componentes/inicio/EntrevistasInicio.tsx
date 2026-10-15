import Link from 'next/link'

import { fechaDia } from '../../lib/fecha'
import { duracionAudio } from '../../lib/formato'
import { Buscador } from '../ui/Buscador'
import { IconoPlay } from '../ui/iconos'
import { TituloSeccion } from '../ui/TituloSeccion'

type Entrevista = {
  id: number
  slug: string
  entrevistado: string
  tema: string
  fecha: string
  duracion: number | null
  programa: string
}

/**
 * Últimas entrevistas con buscador. El play lleva por ahora a la entrevista en su página: la
 * reproducción con el mismo motor de la radio llega en la fase 3.
 */
export function EntrevistasInicio({ entrevistas }: { entrevistas: Entrevista[] }) {
  return (
    <section id="radio" className="contenedor pt-6 pb-6 lg:border-b lg:border-linea lg:pt-12 lg:pb-10">
      <TituloSeccion titulo="Entrevistas" kicker="Escuchá de nuevo">
        <div className="hidden flex-wrap items-center gap-x-5 gap-y-3 lg:flex">
          <Buscador
            accion="/radio/entrevistas"
            etiqueta="Buscar entrevistas"
            placeholder="Buscar entrevistas, programas…"
            className="w-[380px] max-w-full"
          />
          <Link href="/radio/entrevistas" className="etiqueta tracking-[0.08em]">
            Todas las entrevistas →
          </Link>
        </div>
      </TituloSeccion>
      <Buscador
        accion="/radio/entrevistas"
        etiqueta="Buscar entrevistas"
        placeholder="Buscar entrevistas…"
        className="mt-3.5 lg:hidden"
      />
      {entrevistas.length ? (
        <ol className="m-0 list-none p-0 lg:mt-2">
          {entrevistas.map((e) => {
            const href = `/radio/entrevistas#${e.slug}`
            return (
              <li
                key={e.id}
                className="flex items-center gap-3.5 border-b border-linea py-3.5 lg:flex-wrap lg:gap-x-6 lg:gap-y-3 lg:py-[18px]"
              >
                <Link
                  href={href}
                  aria-label={`Escuchar la entrevista a ${e.entrevistado}`}
                  className="flex size-11 shrink-0 items-center justify-center border-2 border-tinta bg-blanco hover:bg-tinta hover:text-blanco lg:size-12"
                >
                  <IconoPlay tamano={14} />
                </Link>
                <span className="flex min-w-0 flex-col gap-[3px] lg:contents">
                  <span className="text-xs font-bold text-meta lg:w-40 lg:text-[13px]">{fechaDia(e.fecha)}</span>
                  <Link
                    href={href}
                    className="font-titulos text-lg leading-[1.2] font-semibold no-underline lg:min-w-60 lg:flex-1 lg:text-[22px]"
                  >
                    {e.entrevistado}: {e.tema}
                  </Link>
                  <span className="text-xs text-meta lg:text-[13px]">
                    En {e.programa}
                    {e.duracion ? ` · ${duracionAudio(e.duracion)}` : ''}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="py-6 text-texto-2">Todavía no hay entrevistas publicadas.</p>
      )}
      <Link href="/radio/entrevistas" className="etiqueta mt-4 inline-block tracking-[0.08em] lg:hidden">
        Todas las entrevistas →
      </Link>
    </section>
  )
}
