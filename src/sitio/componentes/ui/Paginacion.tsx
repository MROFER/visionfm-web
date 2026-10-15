import Link from 'next/link'

/** Páginas a mostrar: la primera, la última y las vecinas de la actual, con "…" en los saltos. */
export function paginasVisibles(actual: number, total: number): (number | '…')[] {
  const numeros = [...new Set([1, actual - 1, actual, actual + 1, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b)
  return numeros.flatMap((n, i) => (i > 0 && n - numeros[i - 1] > 1 ? ['…' as const, n] : [n]))
}

const boton = 'flex min-h-12 items-center justify-center px-[18px] text-xs font-extrabold tracking-[0.1em] uppercase no-underline'

/**
 * Paginación numerada. En web: Anterior, números y Siguiente en una fila; en el celular, los números
 * arriba y Anterior/Siguiente en dos columnas abajo.
 */
export function Paginacion({
  actual,
  total,
  href,
}: {
  actual: number
  total: number
  /** Arma el link de una página. */
  href: (pagina: number) => string
}) {
  if (total <= 1) return null
  return (
    <nav
      aria-label="Paginación"
      className="grid grid-cols-2 gap-2 pt-6 md:flex md:flex-wrap md:items-center md:justify-center md:pt-10"
    >
      <div className="order-first col-span-2 flex justify-center gap-2 md:order-none">
        {paginasVisibles(actual, total).map((n, i) =>
          n === '…' ? (
            <span key={`s${i}`} aria-hidden className="flex h-12 min-w-12 items-center justify-center font-extrabold text-meta">
              …
            </span>
          ) : (
            <Link
              key={n}
              href={href(n)}
              aria-current={n === actual ? 'page' : undefined}
              aria-label={`Página ${n}`}
              className={`flex h-12 min-w-12 items-center justify-center border-2 border-tinta px-2 text-[15px] font-extrabold no-underline ${
                n === actual ? 'bg-tinta text-blanco' : 'hover:bg-suave'
              }`}
            >
              {n}
            </Link>
          ),
        )}
      </div>
      {actual > 1 ? (
        <Link href={href(actual - 1)} rel="prev" className={`${boton} border-2 border-tinta hover:bg-suave md:-order-1`}>
          ← Anterior
        </Link>
      ) : (
        <span aria-disabled className={`${boton} border-2 border-tinta opacity-35 md:-order-1`}>
          ← Anterior
        </span>
      )}
      {actual < total ? (
        <Link href={href(actual + 1)} rel="next" className={`${boton} bg-tinta text-blanco hover:bg-acento`}>
          Siguiente →
        </Link>
      ) : (
        <span aria-disabled className={`${boton} bg-tinta text-blanco opacity-35`}>
          Siguiente →
        </span>
      )}
      <p className="col-span-2 m-0 text-center text-[13px] text-meta md:hidden">
        Página {actual} de {total}
      </p>
    </nav>
  )
}
