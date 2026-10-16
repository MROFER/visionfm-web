type Hito = { anio: number; titulo: string; texto: string }

/**
 * "Nuestra historia": línea de tiempo en la banda oscura. Horizontal en web, en dos columnas en tablet y
 * vertical en el celular. El último hito va resaltado y, si es de este año, dice "Hoy".
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
      <div className="relative">
        {/* Línea que une los hitos en web: gris y termina en naranja */}
        <span
          aria-hidden
          className="absolute top-2.5 right-0 left-[11px] hidden h-0.5 bg-[linear-gradient(90deg,var(--color-oscuro-borde)_0%,var(--color-oscuro-borde)_70%,var(--color-vivo)_100%)] lg:block"
        />
        <ol className="relative m-0 list-none p-0 md:grid md:grid-cols-2 md:gap-x-8 lg:flex lg:gap-8">
          {orden.map((h, i) => {
            const ultimo = i === orden.length - 1
            return (
              <li
                key={`${h.anio}-${h.titulo}`}
                className="relative pb-7 pl-10 lg:flex lg:w-[220px] lg:flex-1 lg:flex-col lg:gap-2.5 lg:pt-10 lg:pb-0 lg:pl-0"
              >
                {!ultimo && (
                  <span aria-hidden className="absolute top-5 -bottom-1 left-2 w-0.5 bg-oscuro-borde md:hidden" />
                )}
                <span
                  aria-hidden
                  className={`absolute top-0.5 left-0 size-[18px] rounded-full lg:top-0 lg:size-[22px] ${
                    ultimo
                      ? 'bg-vivo shadow-[0_0_0_5px_rgba(255,122,69,0.25)] lg:shadow-[0_0_0_6px_rgba(255,122,69,0.25)]'
                      : 'border-[3px] border-vivo bg-tinta'
                  }`}
                />
                <span
                  className={`block font-titulos text-4xl leading-none font-extrabold md:text-5xl lg:text-[56px] lg:tracking-[-0.02em] ${
                    ultimo ? 'text-blanco' : 'text-vivo-claro'
                  }`}
                >
                  {ultimo && h.anio >= anioActual ? 'Hoy' : h.anio}
                </span>
                <span className="mt-2 block font-titulos text-lg font-bold md:text-xl lg:mt-0">{h.titulo}</span>
                {h.texto && (
                  <span className="mt-1 block text-sm leading-[1.55] text-oscuro-1 md:text-[15px] lg:mt-0">{h.texto}</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
