import { FM, V, VISION } from '../../marca'

/**
 * "Visión 96.5 FM" en trazos. El tamaño se da con la altura de la letra de "Visión" en el diseño:
 * 44 px en el header web, 34 en el celular, 40 y 32 en el pie.
 */
export function Logo({ tamano, colorFM = 'var(--color-acento)' }: { tamano: number; colorFM?: string }) {
  const escala = tamano / 44
  return (
    <svg
      viewBox="0 11 198 35"
      width={Math.round(198 * escala)}
      height={Math.round(35 * escala)}
      role="img"
      aria-label="Visión 96.5 FM"
      className="block"
    >
      <path fill="currentColor" d={VISION} />
      <path fill={colorFM} d={FM} />
    </svg>
  )
}

/**
 * El logo del encabezado: "96.5 FM" debajo de "Visión", terminando en el borde de la N. "Visión" queda del
 * mismo tamaño y en el mismo lugar que en el logo de una línea con el mismo `tamano` (34 en el celular).
 */
export function LogoApilado({ className, tamano = 34 }: { className?: string; tamano?: number }) {
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
      <path fill="var(--color-acento)" transform="translate(-72.2 13)" d={FM} />
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
