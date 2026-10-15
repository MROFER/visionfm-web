'use client'

import { aContinuacion } from '../../lib/grilla'
import { AlAireTexto } from '../reproductor/AlAire'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { useRadio } from '../reproductor/Radio'

/** Caja oscura "Al aire" de la columna de Noticias, con lo que viene después y el botón de escuchar. */
export function AlAireCaja() {
  const { grilla, ahora } = useRadio()
  const despues = aContinuacion(grilla, ahora, 1)[0]
  return (
    <div className="mt-5 flex flex-col items-start gap-2 bg-tinta p-5 text-blanco">
      <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase">
        <span aria-hidden className="size-2 bg-vivo" />
        Al aire
      </span>
      <strong className="font-titulos text-2xl leading-[1.15] font-bold">
        <AlAireTexto conConduccion={false} />
      </strong>
      {despues && (
        <span className="text-[13px] text-oscuro-2">
          Después: {despues.programa.nombre} · {despues.inicio}
        </span>
      )}
      <div className="mt-2">
        <BotonEnVivo variante="header" />
      </div>
    </div>
  )
}
