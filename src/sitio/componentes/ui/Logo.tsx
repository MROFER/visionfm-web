import { FM, VISION } from '../../marca'

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
