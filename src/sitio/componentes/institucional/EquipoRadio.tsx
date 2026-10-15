import type { GrupoEquipo, Integrante } from '../../datos/institucional'
import { Foto } from '../ui/Foto'

const subtitulo = 'm-0 mb-3 text-xs font-extrabold tracking-[0.1em] uppercase md:mb-4 md:text-[13px]'

/**
 * El equipo en el orden del diseño (design/LEEME.md, sección 7): Dirección y Producción general con foto
 * grande, Conducción en grilla, Columnistas en tarjetas con borde y Equipo técnico en lista.
 */
export function EquipoRadio({ grupos }: { grupos: Record<GrupoEquipo, Integrante[]> }) {
  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <Grande titulo="Dirección" personas={grupos.direccion} />
      <Grande titulo="Producción general" personas={grupos['produccion-general']} />

      {grupos.conduccion.length > 0 && (
        <div>
          <h3 className={subtitulo}>Conducción</h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-x-3.5 gap-y-[18px] p-0 md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:gap-7">
            {grupos.conduccion.map((p) => (
              <li key={p.id} className="flex flex-col gap-1.5 md:gap-2.5">
                <Foto imagen={p.foto} sizes="(min-width: 768px) 220px, 45vw" className="aspect-square w-full" textoSinFoto="Foto" />
                <span className="font-titulos text-base font-bold md:text-[19px]">{p.nombre}</span>
                <span className="hidden text-sm text-meta md:block">{p.rol}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {grupos.columnistas.length > 0 && (
        <div>
          <h3 className={subtitulo}>Columnistas y colaboradores</h3>
          <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-5">
            {grupos.columnistas.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-2 border-tinta p-3 md:gap-3.5 md:p-4">
                <Foto imagen={p.foto} sizes="72px" className="size-14 shrink-0 md:size-[72px]" />
                <span className="flex flex-col gap-0.5 md:gap-1">
                  <span className="text-[10px] font-extrabold tracking-[0.1em] text-acento uppercase md:text-[11px]">
                    {p.rol}
                  </span>
                  <span className="font-titulos text-[17px] font-bold md:text-[19px]">{p.nombre}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {grupos.tecnico.length > 0 && (
        <div>
          <h3 className={`${subtitulo} mb-1 md:mb-4`}>Equipo técnico</h3>
          <ul className="m-0 grid list-none p-0 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-x-8">
            {grupos.tecnico.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-t border-linea py-2.5 md:gap-3.5 md:py-3.5">
                <Foto imagen={p.foto} sizes="56px" className="size-12 shrink-0 rounded-full md:size-14" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold md:text-base">{p.nombre}</span>
                  <span className="text-xs text-meta md:text-[13px]">{p.rol}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Dirección y Producción general: foto grande (4:5 en web, 4:3 en el celular), nombre y cargo. */
function Grande({ titulo, personas }: { titulo: string; personas: Integrante[] }) {
  if (!personas.length) return null
  return (
    <div>
      <h3 className={subtitulo}>{titulo}</h3>
      <ul className="m-0 flex list-none flex-col gap-5 p-0 md:flex-row md:flex-wrap md:gap-8">
        {personas.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 md:max-w-[380px] md:flex-[1_1_260px] md:gap-3">
            <Foto
              imagen={p.foto}
              sizes="(min-width: 768px) 380px, 100vw"
              className="aspect-[4/3] w-full md:aspect-[4/5]"
              textoSinFoto="Foto"
            />
            <span className="font-titulos text-[26px] leading-[1.1] font-extrabold md:text-3xl md:tracking-[-0.01em]">
              {p.nombre}
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.1em] text-acento uppercase md:text-xs">{p.rol}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
