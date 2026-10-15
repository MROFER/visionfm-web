'use client'

import { AlAireTexto } from '../reproductor/AlAire'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'

/** Banda oscura "Al aire ahora" con el botón de escuchar: grande en web, redondo en el celular. */
export function BandaAlAire() {
  return (
    <div className="flex items-center gap-3 bg-tinta py-3.5 pr-3.5 pl-4 text-blanco md:gap-4 md:pr-4 md:pl-5">
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase md:gap-2 md:text-[11px]">
          <span aria-hidden className="size-1.5 bg-vivo md:size-2" />
          Al aire ahora
        </span>
        <span className="font-titulos text-lg font-bold md:text-xl">
          <AlAireTexto conConduccion={false} />
        </span>
      </span>
      <span className="md:hidden">
        <BotonEnVivo variante="redondo" />
      </span>
      <span className="hidden md:block">
        <BotonEnVivo variante="header" />
      </span>
    </div>
  )
}
