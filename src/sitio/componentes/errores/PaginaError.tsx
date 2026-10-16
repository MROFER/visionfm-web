import Link from 'next/link'

const SECCIONES = [
  { nombre: 'Radio', detalle: 'En vivo, programación y entrevistas', href: '/radio/en-vivo' },
  { nombre: 'Noticias', detalle: 'Lo último de Fray Bentos y la región', href: '/noticias' },
  { nombre: 'Cinevisión', detalle: 'Cartelera, estrenos y entradas', href: '/cinevision' },
  { nombre: 'Institucional', detalle: 'Quiénes somos, publicidad y contacto', href: '/institucional' },
]

/**
 * Cuerpo de la 404 y del error del servidor (docs/03-flujos.md, estados): kicker con el código, título,
 * una línea y links a las cuatro secciones. El encabezado y el pie los pone el layout del sitio.
 */
export function PaginaError({
  codigo,
  titulo,
  texto,
  accion,
}: {
  codigo: string
  titulo: string
  texto: string
  /** Botón propio (por ejemplo, "Probar de nuevo") delante de "Ir al inicio" */
  accion?: React.ReactNode
}) {
  return (
    <main className="contenedor pt-10 pb-14 md:pt-20 md:pb-24">
      <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">{codigo}</span>
      <h1 className="m-0 mt-2 max-w-[760px] font-titulos text-[34px] leading-[1.05] font-extrabold tracking-[-0.01em] md:mt-2.5 md:text-[64px] md:leading-none md:tracking-[-0.02em]">
        {titulo}
      </h1>
      <p className="m-0 mt-3 max-w-[620px] text-[17px] leading-[1.6] text-texto-2 md:mt-4 md:text-lg">{texto}</p>
      <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row">
        {accion}
        <Link
          href="/"
          className="etiqueta flex min-h-12 items-center justify-center bg-tinta px-6 text-blanco no-underline hover:bg-acento md:min-h-[52px]"
        >
          Ir al inicio →
        </Link>
      </div>
      <nav aria-label="Secciones" className="mt-10 border-t-[3px] border-tinta pt-5 md:mt-16 md:pt-6">
        <ul className="m-0 grid list-none gap-0 p-0 md:grid-cols-4 md:gap-6">
          {SECCIONES.map((s) => (
            <li key={s.href} className="border-b border-linea md:border-0">
              <Link href={s.href} className="group flex flex-col gap-1 py-3.5 no-underline md:py-0">
                <span className="font-titulos text-xl font-extrabold group-hover:text-acento md:text-2xl">{s.nombre} →</span>
                <span className="text-sm text-meta">{s.detalle}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
