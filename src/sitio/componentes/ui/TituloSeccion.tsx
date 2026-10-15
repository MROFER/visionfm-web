import Link from 'next/link'

/** Título de sección con la línea de 3 px abajo (design/LEEME.md, sección 4). */
export function TituloSeccion({
  titulo,
  kicker,
  nivel = 'h2',
  tamano = 'grande',
  id,
  children,
}: {
  titulo: string
  kicker?: string
  nivel?: 'h1' | 'h2'
  /** grande: 48 px en web y 34 en celular; enorme: 64 y 38 (Cinevisión del Inicio). */
  tamano?: 'grande' | 'enorme'
  id?: string
  children?: React.ReactNode
}) {
  const Etiqueta = nivel
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-tinta pb-2 md:pb-3">
      <div className="flex flex-col gap-1 md:gap-2">
        {kicker && (
          <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">
            {kicker}
          </span>
        )}
        <Etiqueta
          id={id}
          className={`m-0 font-titulos leading-none font-bold ${
            tamano === 'enorme'
              ? 'text-[38px] md:text-[64px] md:leading-[0.95] md:tracking-[-0.02em]'
              : 'text-[34px] md:text-5xl'
          }`}
        >
          {titulo}
        </Etiqueta>
      </div>
      {children}
    </div>
  )
}

/** Botón oscuro "Todas las noticias →" que acompaña a los títulos de sección. */
export function BotonOscuro({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`etiqueta flex min-h-11 items-center justify-center gap-2 bg-tinta px-[18px] text-blanco no-underline hover:bg-acento ${className}`}
    >
      {children} <span aria-hidden>→</span>
    </Link>
  )
}
