import type { DatosCinevision } from '../../datos/cinevision'

/** Precios de las entradas, promociones y cómo se compran, tal como los carga la radio. */
export function Precios({
  datos,
  className = '',
}: {
  datos: Pick<DatosCinevision, 'precios' | 'promociones' | 'comoSeCompran'>
  className?: string
}) {
  const { precios, promociones, comoSeCompran } = datos
  if (!precios.length && !promociones.length && !comoSeCompran) {
    return <p className={`m-0 text-sm text-texto-2 ${className}`}>Consultá precios en la boletería del cine.</p>
  }
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {precios.length > 0 && (
        <dl className="m-0 flex flex-col">
          {precios.map((p) => (
            <div key={p.concepto} className="flex justify-between gap-4 border-b border-linea py-2.5 md:py-3">
              <dt>{p.concepto}</dt>
              <dd className="m-0 font-extrabold">{p.precio}</dd>
            </div>
          ))}
        </dl>
      )}
      {promociones.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {promociones.map((p) => (
            <li key={p.titulo} className="flex flex-col gap-0.5 border-b border-linea py-2.5 md:py-3">
              <strong>{p.titulo}</strong>
              {p.detalle && <span className="text-sm text-texto-2">{p.detalle}</span>}
            </li>
          ))}
        </ul>
      )}
      {comoSeCompran && (
        <p className="m-0 text-sm leading-[1.55] whitespace-pre-line text-texto-2 md:text-[15px] md:leading-relaxed">
          {comoSeCompran}
        </p>
      )}
    </div>
  )
}
