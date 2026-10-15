import { telefonoParaLink } from '../../navegacion'
import { AlAireTexto } from '../reproductor/AlAire'
import { FechaHoy } from './FechaHoy'

/** Barra oscura de arriba en web: fecha, qué está al aire y teléfono de la radio. */
export function BarraSuperior({ telefono }: { telefono: string }) {
  return (
    <div className="hidden bg-tinta text-blanco lg:block">
      <div className="contenedor flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px]">
        <span className="text-oscuro-1">
          <FechaHoy /> · Fray Bentos
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 bg-vivo" />
            <span className="text-xs font-extrabold tracking-[0.1em] text-vivo-claro uppercase">Al aire</span>
            <span className="font-semibold">
              <AlAireTexto />
            </span>
          </span>
          <a href={`tel:${telefonoParaLink(telefono)}`} className="text-oscuro-1 no-underline">
            Llamá a la radio: <strong className="text-blanco">{telefono}</strong>
          </a>
        </div>
      </div>
    </div>
  )
}
