import { FM, V, VISION } from '../../marca'

/**
 * El logo de la radio en trazos: "96.5 FM" debajo de "Visión", terminando en el borde de la N. `tamano` es
 * la altura de la letra de "Visión": 34 en el celular y 40 en web, igual en el encabezado y en el pie.
 */
export function LogoApilado({
  className,
  tamano = 34,
  colorFM = 'var(--color-acento)',
}: {
  className?: string
  tamano?: number
  colorFM?: string
}) {
  const escala = tamano / 44
  return (
    <svg
      viewBox="-1 11 125 47"
      width={Math.round(125 * escala)}
      height={Math.round(47 * escala)}
      role="img"
      aria-label="Visión 96.5 FM"
      className={className}
    >
      <path fill="currentColor" d={VISION} />
      <path fill={colorFM} transform="translate(-72.2 13)" d={FM} />
    </svg>
  )
}

/**
 * El logo comprimido, del tamaño de un botón (44 px): la V y, al lado, "FM" con "96.5" debajo, los dos
 * del alto de la V. Lo usa el encabezado del celular mientras suena la radio.
 */
export function LogoCompacto({ className }: { className?: string }) {
  const texto = { fontFamily: 'var(--font-titulos)', fontWeight: 800 }
  return (
    <svg viewBox="0 0 44 44" width={44} height={44} aria-hidden className={className}>
      <path fill="currentColor" transform="translate(-1.75 6.11) scale(0.662)" d={V} />
      <text x="25.8" y="20.9" textLength="14.2" lengthAdjust="spacingAndGlyphs" fill="var(--color-acento)" style={{ ...texto, fontSize: 11 }}>
        FM
      </text>
      <text x="25.8" y="31" textLength="14.2" lengthAdjust="spacingAndGlyphs" fill="var(--color-acento)" style={{ ...texto, fontSize: 7.5 }}>
        96.5
      </text>
    </svg>
  )
}
