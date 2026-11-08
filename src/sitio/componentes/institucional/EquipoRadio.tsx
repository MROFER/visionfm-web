import type { GrupoEquipo, Integrante } from '../../datos/institucional'
import { Foto } from '../ui/Foto'

/** Las áreas del equipo, en el orden del diseño (design/LEEME.md, sección 7). */
const AREAS: { grupo: GrupoEquipo; titulo: string }[] = [
  { grupo: 'direccion', titulo: 'Dirección' },
  { grupo: 'produccion-general', titulo: 'Producción general' },
  { grupo: 'conduccion', titulo: 'Conducción' },
  { grupo: 'columnistas', titulo: 'Columnistas y colaboradores' },
  { grupo: 'tecnico', titulo: 'Equipo técnico' },
]

/**
 * El equipo por áreas, cada una con su título y sus tarjetas. Todas las tarjetas son iguales: la foto
 * llena el cuadro y el nombre y el puesto van en una franja oscura sobre la parte de abajo (8/11/2026).
 */
export function EquipoRadio({ grupos }: { grupos: Record<GrupoEquipo, Integrante[]> }) {
  return (
    <div className="flex flex-col gap-7 md:gap-10">
      {AREAS.map(({ grupo, titulo }) =>
        grupos[grupo].length ? (
          <div key={grupo}>
            <h3 className="m-0 mb-3 text-[11px] font-extrabold tracking-[0.1em] uppercase md:mb-4 md:text-[13px]">
              {titulo}
            </h3>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {grupos[grupo].map((p) => (
                <Tarjeta key={p.id} persona={p} />
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  )
}

/** Foto 4:5 que llena la tarjeta (recortada hacia arriba, donde suele estar la cara) y la franja con los datos. */
function Tarjeta({ persona }: { persona: Integrante }) {
  return (
    <li className="relative aspect-[4/5] overflow-hidden bg-sin-foto">
      <Foto
        imagen={persona.foto}
        sizes="(min-width: 1024px) 292px, (min-width: 768px) 32vw, 50vw"
        className="absolute inset-0 size-full object-[center_30%]"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[3px] border-t-[3px] border-acento bg-tinta px-2.5 pt-2 pb-2.5 text-blanco md:gap-[5px] md:border-t-4 md:px-4 md:pt-3 md:pb-3.5">
        <span className="font-titulos text-[15px] leading-[1.1] font-extrabold md:text-[21px]">{persona.nombre}</span>
        <span className="text-[10px] leading-[1.3] font-extrabold tracking-[0.08em] text-vivo-claro uppercase md:text-[11px] md:tracking-[0.1em]">
          {persona.rol}
        </span>
      </div>
    </li>
  )
}
