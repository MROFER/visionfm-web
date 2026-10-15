import Link from 'next/link'

import type { TarjetaNota as Nota } from '../../datos/formas'
import { fechaCorta, fechaDia } from '../../lib/fecha'
import { Foto } from './Foto'

const Seccion = ({ nota, chica }: { nota: Nota; chica?: boolean }) =>
  nota.seccion ? (
    <span
      className={`font-extrabold tracking-[0.1em] text-acento uppercase ${chica ? 'text-[10px] lg:text-[11px]' : 'text-[11px] lg:text-xs'}`}
    >
      {nota.seccion.nombre}
    </span>
  ) : null

/** Nota destacada: foto grande arriba, sección, titular y fecha. */
export function NotaDestacada({ nota, prioridad }: { nota: Nota; prioridad?: boolean }) {
  return (
    <article className="flex flex-col gap-2.5 lg:gap-3">
      <Link href={nota.href} aria-hidden tabIndex={-1} className="block lg:flex lg:flex-1">
        <Foto
          imagen={nota.foto}
          sizes="(min-width: 1024px) 600px, 100vw"
          prioridad={prioridad}
          className="aspect-[16/10] h-auto max-h-[420px] w-full lg:max-h-none lg:min-h-80 lg:flex-1"
        />
      </Link>
      <Seccion nota={nota} />
      <h3 className="m-0 font-titulos text-[28px] leading-[1.1] font-bold lg:text-4xl lg:leading-[1.08]">
        <Link href={nota.href} className="no-underline hover:text-acento-hover">
          {nota.titulo}
        </Link>
      </h3>
      {nota.fecha && <span className="text-xs text-meta lg:text-[13px]">{fechaDia(nota.fecha)}</span>}
    </article>
  )
}

/**
 * Nota chica. En web, foto arriba; en el celular, fila con la foto cuadrada a la derecha.
 */
export function NotaChica({ nota }: { nota: Nota }) {
  return (
    <article className="flex gap-3.5 border-b border-linea py-4 lg:flex-col-reverse lg:justify-end lg:gap-2.5 lg:border-0 lg:py-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:flex-none lg:gap-2.5">
        <Seccion nota={nota} chica />
        <h3 className="m-0 font-titulos text-[19px] leading-[1.22] font-semibold lg:text-[22px] lg:leading-[1.2]">
          <Link href={nota.href} className="no-underline hover:text-acento-hover">
            {nota.titulo}
          </Link>
        </h3>
        {nota.fecha && <span className="text-xs text-meta lg:text-[13px]">{fechaCorta(nota.fecha)}</span>}
      </div>
      <Link href={nota.href} aria-hidden tabIndex={-1} className="block shrink-0">
        <Foto
          imagen={nota.foto}
          sizes="(min-width: 1024px) 280px, 96px"
          className="size-24 lg:h-40 lg:w-full"
        />
      </Link>
    </article>
  )
}

/** Fila del archivo: en web, foto 160×110 a la izquierda; en el celular, cuadrada a la derecha. */
export function NotaFila({ nota }: { nota: Nota }) {
  return (
    <article className="flex gap-3.5 border-b border-linea py-4 md:gap-5 md:py-[22px]">
      <Link href={nota.href} aria-hidden tabIndex={-1} className="order-last block shrink-0 md:order-first">
        <Foto imagen={nota.foto} sizes="(min-width: 768px) 160px, 96px" className="size-24 md:h-[110px] md:w-40" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2">
        <Seccion nota={nota} chica />
        <h3 className="m-0 font-titulos text-[19px] leading-[1.22] font-semibold md:text-[22px] md:leading-[1.2]">
          <Link href={nota.href} className="no-underline hover:text-acento-hover">
            {nota.titulo}
          </Link>
        </h3>
        {nota.fecha && <span className="text-xs text-meta md:text-[13px]">{fechaCorta(nota.fecha)}</span>}
      </div>
    </article>
  )
}
