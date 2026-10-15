'use client'

/** Pestañas de los días de función ("Todos", "Vie 09"…), con la línea de acento en la elegida. */
export function PestanasDias({
  opciones,
  elegida,
  onElegir,
  controla,
  repartidas = false,
}: {
  opciones: { valor: string; etiqueta: string }[]
  elegida: string
  onElegir: (valor: string) => void
  /** id del panel que cambia. */
  controla: string
  /** Repartidas a lo ancho en web (la columna de Funciones). */
  repartidas?: boolean
}) {
  return (
    <div
      role="tablist"
      aria-label="Días de función"
      className={`flex gap-[18px] overflow-x-auto border-b border-linea [scrollbar-width:none] ${
        repartidas ? 'md:gap-x-7 lg:justify-between lg:gap-x-3' : 'md:gap-x-7'
      }`}
    >
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="tab"
          id={`${controla}-${o.valor}`}
          aria-selected={o.valor === elegida}
          aria-controls={controla}
          onClick={() => onElegir(o.valor)}
          className={`flex min-h-11 shrink-0 cursor-pointer items-center text-[13px] tracking-[0.08em] uppercase hover:text-acento md:min-h-12 md:text-sm ${repartidas ? 'lg:text-[13px] lg:tracking-[0.06em]' : ''} ${
            o.valor === elegida ? 'font-extrabold shadow-[inset_0_-3px_0_var(--color-acento)]' : 'font-semibold'
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}
