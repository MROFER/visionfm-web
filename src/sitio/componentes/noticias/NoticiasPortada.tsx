import Link from 'next/link'
import type { ReactNode } from 'react'

import type { TarjetaNota } from '../../datos/formas'
import { fechaCorta, fechaDia } from '../../lib/fecha'
import { Foto } from '../ui/Foto'

/**
 * Arriba de Noticias: la destacada grande y, en web, la columna "Últimas noticias". La radio no se repite
 * acá: ya está en el encabezado. En el celular `filtro` (el de fechas) va chico, solo y a la derecha, apoyado
 * sobre la línea que separa la destacada del resto, como en Entrevistas. En la web lo muestra la fila del
 * archivo; si no hay archivo, `filtroEnWeb` lo deja acá, al lado de la fecha.
 */
export function NoticiasPortada({
  destacada,
  ultimas,
  filtro,
  filtroEnWeb = false,
}: {
  destacada: TarjetaNota
  ultimas: TarjetaNota[]
  filtro?: ReactNode
  filtroEnWeb?: boolean
}) {
  return (
    <section className="flex flex-col gap-10 border-b-[3px] border-tinta pt-5 pb-5 md:pt-8 lg:mb-2 lg:flex-row lg:pb-10">
      <article className="flex min-w-0 flex-col gap-2.5 md:gap-3.5 lg:flex-[999_1_560px]">
        <Link href={destacada.href} aria-hidden tabIndex={-1} className="block">
          <Foto
            imagen={destacada.foto}
            sizes="(min-width: 1024px) 860px, 100vw"
            prioridad
            className="h-[210px] w-full md:h-[400px]"
          />
        </Link>
        {destacada.seccion && (
          <span className="text-[11px] font-extrabold tracking-[0.1em] text-acento uppercase md:text-xs">
            {destacada.seccion.nombre}
          </span>
        )}
        <h2 className="m-0 font-titulos text-[28px] leading-[1.1] font-bold md:text-[50px] md:leading-[1.05] md:tracking-[-0.02em]">
          <Link href={destacada.href} className="no-underline hover:text-acento-hover">
            {destacada.titulo}
          </Link>
        </h2>
        <p className="m-0 hidden text-[21px] leading-normal text-texto-2 md:block">{destacada.bajada}</p>
        {(destacada.fecha || (filtro && filtroEnWeb)) && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-meta md:text-[13px]">
              {destacada.fecha ? fechaDia(destacada.fecha) : ''}
            </span>
            {filtro && filtroEnWeb && <div className="hidden md:block">{filtro}</div>}
          </div>
        )}
        {filtro && <div className="-mb-2.5 flex justify-end pt-1.5 md:hidden">{filtro}</div>}
      </article>
      {ultimas.length > 0 && (
        <aside aria-labelledby="ultimas-noticias" className="hidden min-w-0 flex-col lg:flex lg:flex-[1_1_320px]">
          <h2 id="ultimas-noticias" className="etiqueta m-0 border-b-[3px] border-tinta pb-2.5 text-[13px]">
            Últimas noticias
          </h2>
          {ultimas.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className="group flex gap-4 border-b border-linea py-4 no-underline"
            >
              <span className="w-[52px] shrink-0 text-[13px] font-bold text-meta">
                {n.fecha ? fechaCorta(n.fecha) : ''}
              </span>
              <span className="flex flex-col gap-1">
                {n.seccion && (
                  <span className="text-[11px] font-extrabold tracking-[0.1em] text-acento uppercase">
                    {n.seccion.nombre}
                  </span>
                )}
                <span className="font-titulos text-[19px] leading-[1.25] font-semibold group-hover:text-acento-hover">
                  {n.titulo}
                </span>
              </span>
            </Link>
          ))}
        </aside>
      )}
    </section>
  )
}
