type Hito = { anio: number; titulo: string; texto: string }

/**
 * "Nuestra historia": línea de tiempo en la banda oscura. Horizontal en web y vertical en el celular. El
 * último hito va resaltado y, si es de este año, dice "Hoy".
 */
export function Historia({ hitos, anioActual }: { hitos: Hito[]; anioActual: number }) {
  if (!hitos.length) return null
  const orden = [...hitos].sort((a, b) => a.anio - b.anio)
  return (
    <section aria-labelledby="titulo-historia" className="-mx-4 bg-tinta px-4 pt-7 pb-2 text-blanco md:mx-0 md:px-10 md:pt-12 md:pb-14">
      <h2
        id="titulo-historia"
        className="m-0 mb-6 text-[11px] font-extrabold tracking-[0.12em] text-vivo-claro uppercase md:mb-10 md:text-[13px]"
      >
        Nuestra historia
      </h2>
      <div className="relative md:overflow-x-auto">
        {/* Línea que une los hitos en web: gris y termina en naranja */}
        <span
          aria-hidden
          className="absolute top-2.5 right-0 left-[11px] hidden h-0.5 bg-[linear-gradient(90deg,var(--color-oscuro-borde)_0%,var(--color-oscuro-borde)_70%,var(--color-vivo)_100%)] md:block"
        />
        <ol className="relative m-0 list-none p-0 md:flex md:min-w-max md:gap-8 lg:min-w-0">
          {orden.map((h, i) => {
            const ultimo = i === orden.length - 1
            return (
              <li
                key={`${h.anio}-${h.titulo}`}
                className="relative pb-7 pl-10 md:flex md:w-[220px] md:flex-1 md:flex-col md:gap-2.5 md:pt-10 md:pb-0 md:pl-0"
              >
                {!ultimo && (
                  <span aria-hidden className="absolute top-5 -bottom-1 left-2 w-0.5 bg-oscuro-borde md:hidden" />
                )}
                <span
                  aria-hidden
                  className={`absolute top-0.5 left-0 size-[18px] rounded-full md:top-0 md:size-[22px] ${
                    ultimo
                      ? 'bg-vivo shadow-[0_0_0_5px_rgba(255,122,69,0.25)] md:shadow-[0_0_0_6px_rgba(255,122,69,0.25)]'
                      : 'border-[3px] border-vivo bg-tinta'
                  }`}
                />
                <span
                  className={`block font-titulos text-4xl leading-none font-extrabold md:text-[56px] md:tracking-[-0.02em] ${
                    ultimo ? 'text-blanco' : 'text-vivo-claro'
                  }`}
                >
                  {ultimo && h.anio >= anioActual ? 'Hoy' : h.anio}
                </span>
                <span className="mt-2 block font-titulos text-lg font-bold md:mt-0 md:text-xl">{h.titulo}</span>
                {h.texto && (
                  <span className="mt-1 block text-sm leading-[1.55] text-oscuro-1 md:mt-0 md:text-[15px]">{h.texto}</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
