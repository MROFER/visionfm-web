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
      {nota.fecha && (
        <span className="text-xs text-meta lg:text-[13px]">{fechaDia(nota.fecha)}</span>
      )}
    </article>
  )
}

/**
 * Nota chica. En web, foto arriba; en el celular, fila con la foto a la derecha en 128×96 (4:3), igual que
 * en la sección Noticias (8/11/2026).
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
        {nota.fecha && (
          <span className="text-xs text-meta lg:text-[13px]">{fechaCorta(nota.fecha)}</span>
        )}
      </div>
      <Link href={nota.href} aria-hidden tabIndex={-1} className="block shrink-0">
        <Foto
          imagen={nota.foto}
          sizes="(min-width: 1024px) 280px, 128px"
          className="h-24 w-32 lg:h-40 lg:w-full"
        />
      </Link>
    </article>
  )
}

/**
 * Nota del archivo de Noticias. En web, como en los diarios: la foto grande arriba y, debajo, la sección,
 * el titular y las primeras líneas de la bajada, de a tres por fila. En el celular, fila con la foto
 * chica a la derecha, para que la destacada siga mandando y la lista no se haga eterna: 128×96 (4:3), que
 * recorta menos la foto de web que el cuadrado de antes sin hacer más alta la fila.
 */
export function NotaTarjeta({ nota }: { nota: Nota }) {
  return (
    <article className="flex gap-3.5 border-b border-linea py-4 md:flex-col md:gap-2 md:border-0 md:py-0">
      <Link
        href={nota.href}
        aria-hidden
        tabIndex={-1}
        className="order-last block shrink-0 md:order-first md:mb-1.5"
      >
        <Foto
          imagen={nota.foto}
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 128px"
          className="h-24 w-32 md:aspect-[16/9] md:h-auto md:w-full"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2">
        <Seccion nota={nota} chica />
        <h3 className="m-0 font-titulos text-[19px] leading-[1.22] font-semibold md:text-xl md:leading-[1.2]">
          <Link href={nota.href} className="no-underline hover:text-acento-hover">
            {nota.titulo}
          </Link>
        </h3>
        {nota.bajada && (
          <p className="m-0 hidden text-[15px] leading-normal text-texto-2 md:line-clamp-2">
            {nota.bajada}
          </p>
        )}
        {nota.fecha && (
          <span className="text-xs text-meta md:text-[13px]">{fechaCorta(nota.fecha)}</span>
        )}
      </div>
    </article>
  )
}
