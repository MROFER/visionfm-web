import Link from 'next/link'

import type { TarjetaEntrevista } from '../../datos/formas'
import { fechaDia } from '../../lib/fecha'
import { AvanceEntrevista, BotonEntrevista } from '../radio/BotonEntrevista'

/**
 * La entrevista de la radio que acompaña una nota, arriba del texto (opción A de bocetos/nota-audio):
 * el bloque oscuro de la entrevista destacada, en chico. Suena en el reproductor del sitio, así que sigue
 * sonando si la persona pasa a otra página. El título lleva a la página de la entrevista.
 */
export function EntrevistaEnNota({ entrevista: e }: { entrevista: TarjetaEntrevista }) {
  const datos = [e.programa && `En ${e.programa.nombre}`, fechaDia(e.fecha)].filter(Boolean).join(' · ')
  return (
    <aside
      aria-label="Entrevista de la nota"
      className="flex flex-col gap-1.5 bg-tinta px-4 pt-4 pb-3.5 text-blanco md:gap-2 md:px-7 md:pt-[22px] md:pb-5"
    >
      <span className="text-[11px] leading-[1.3] font-extrabold tracking-[0.12em] text-vivo-claro uppercase">
        Escuchá la entrevista
      </span>
      <Link
        href={`/radio/entrevistas/${e.slug}`}
        className="font-titulos text-lg leading-[1.15] font-bold text-blanco no-underline hover:text-vivo-claro md:text-[22px]"
      >
        {e.entrevistado}: {e.tema}
      </Link>
      <span className="text-[13px] leading-normal text-oscuro-1">{datos}</span>
      {e.audio ? (
        <div className="mt-1.5 flex items-center gap-3 md:mt-2 md:gap-4">
          <BotonEntrevista
            entrevista={e}
            tamano={20}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-acento text-blanco hover:bg-acento-hover"
          />
          <AvanceEntrevista entrevista={e} />
        </div>
      ) : (
        <p className="mt-1 text-[13px] leading-normal text-oscuro-2">
          El audio de esta entrevista todavía no está disponible.
        </p>
      )}
    </aside>
  )
}
