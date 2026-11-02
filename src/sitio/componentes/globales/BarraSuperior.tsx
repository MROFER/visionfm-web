import { telefonoParaLink } from '../../navegacion'
import { AlAireTexto } from '../reproductor/AlAire'
import type { Clima } from '../../datos/clima'
import { Cinta, type NotaCinta } from './Cinta'

/** Barra oscura de arriba en web: la cinta (fecha, destacadas y clima), qué está al aire y el teléfono. */
export function BarraSuperior({
  telefono,
  cinta,
}: {
  telefono: string
  cinta: { notas: NotaCinta[]; clima: Clima | null }
}) {
  return (
    <div className="hidden bg-tinta text-blanco lg:block">
      <div className="contenedor flex min-h-9 items-center justify-between gap-x-6 text-[12px]">
        <div className="min-w-0 flex-1">
          <Cinta notas={cinta.notas} clima={cinta.clima} oscura />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 bg-vivo" />
            <span className="text-[11px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase">Al aire</span>
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
