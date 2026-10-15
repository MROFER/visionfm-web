import type { TarjetaEntrevista } from '../../datos/formas'
import { fechaCorta, fechaDia } from '../../lib/fecha'
import { reloj } from '../../lib/formato'
import { Foto } from '../ui/Foto'
import { AvanceEntrevista, BotonEntrevista } from './BotonEntrevista'

/** Entrevista destacada: bloque oscuro con foto, resumen y reproductor con avance. */
export function EntrevistaDestacada({ entrevista: e }: { entrevista: TarjetaEntrevista }) {
  return (
    <article
      id={e.slug}
      className="mb-6 flex scroll-mt-4 flex-col gap-5 bg-tinta p-3 text-blanco md:mb-10 md:flex-row md:flex-wrap md:gap-8 md:p-8"
    >
      {e.foto && (
        <Foto
          imagen={e.foto}
          sizes="(min-width: 768px) 300px, 100vw"
          prioridad
          className="aspect-[16/10] h-auto w-full md:aspect-square md:w-[300px] md:flex-none"
        />
      )}
      <div className={`flex min-w-0 flex-col gap-2.5 px-1 pb-1 md:flex-[1_1_420px] md:gap-3.5 md:p-0 ${e.foto ? '' : 'pt-2 md:pt-0'}`}>
        <span className="text-[11px] font-extrabold tracking-[0.12em] text-vivo-claro uppercase md:text-xs">
          Destacada · {fechaDia(e.fecha)}
        </span>
        <h2 className="m-0 font-titulos text-2xl leading-[1.1] font-extrabold md:text-[40px] md:leading-[1.08]">
          {e.entrevistado}: {e.tema}
        </h2>
        {e.resumen && (
          <p className="m-0 hidden max-w-[620px] text-base leading-[1.6] text-oscuro-1 md:block">{e.resumen}</p>
        )}
        <span className="text-[13px] text-oscuro-1 md:text-sm">
          {[e.programa && `En ${e.programa.nombre}`, e.duracion && reloj(e.duracion)].filter(Boolean).join(' · ')}
        </span>
        {e.audio ? (
          <div className="mt-auto flex items-center gap-3 pt-2 md:gap-4">
            <BotonEntrevista
              entrevista={e}
              tamano={22}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-acento text-blanco hover:bg-acento-hover md:size-16"
            />
            <AvanceEntrevista entrevista={e} />
          </div>
        ) : (
          <p className="m-0 text-[13px] text-oscuro-2">El audio de esta entrevista todavía no está disponible.</p>
        )}
      </div>
    </article>
  )
}

/** Fila del archivo: play, foto (solo en web), título, programa, fecha y duración. */
export function FilaEntrevista({ entrevista: e }: { entrevista: TarjetaEntrevista }) {
  const datos = [e.programa?.nombre, fechaCorta(e.fecha), e.duracion ? reloj(e.duracion) : null]
  return (
    <li id={e.slug} className="flex scroll-mt-4 items-center gap-3 border-b border-linea py-3.5 md:gap-6 md:py-[18px]">
      <BotonEntrevista
        entrevista={e}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-blanco hover:bg-tinta hover:text-blanco md:size-12"
      />
      <Foto imagen={e.foto} sizes="64px" className="hidden size-16 shrink-0 md:block" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-titulos text-[17px] leading-[1.2] font-bold md:text-[21px]">
          {e.entrevistado}: {e.tema}
        </span>
        <span className="text-xs text-meta md:hidden">{datos.filter(Boolean).join(' · ')}</span>
        {e.programa && <span className="hidden text-sm text-meta md:block">En {e.programa.nombre}</span>}
      </span>
      <span className="hidden w-[110px] shrink-0 text-sm text-meta md:block">{fechaDia(e.fecha)}</span>
      <span className="hidden w-[70px] shrink-0 text-right text-sm font-bold tabular-nums md:block">
        {e.duracion ? reloj(e.duracion) : ''}
      </span>
    </li>
  )
}
