import { IconoBuscar } from './iconos'

/** Buscador de una sección (no hay lupa global en el header). Envía `?q=` a la página de la sección. */
export function Buscador({
  accion,
  etiqueta,
  placeholder,
  valor,
  className = '',
}: {
  accion: string
  etiqueta: string
  placeholder: string
  valor?: string
  className?: string
}) {
  return (
    <form role="search" action={accion} className={`flex ${className}`}>
      <label className="flex min-h-12 flex-1 items-center gap-2 border-2 border-r-0 border-tinta px-3 focus-within:outline-3 focus-within:outline-acento md:gap-2.5">
        <IconoBuscar />
        <span className="sr-only">{etiqueta}</span>
        <input
          type="search"
          name="q"
          defaultValue={valor}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
        />
      </label>
      <button
        type="submit"
        className="cursor-pointer bg-tinta px-3.5 text-[11px] font-extrabold tracking-[0.1em] text-blanco uppercase hover:bg-acento md:px-4 md:text-xs"
      >
        Buscar
      </button>
    </form>
  )
}
