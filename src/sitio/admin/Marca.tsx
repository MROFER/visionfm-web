// Logotipo de la radio para el panel: "Visión" (Newsreader 700) y "96.5 FM", convertidos a trazos
// para no cargar la tipografía. Las mismas formas están en public/marca/logo.svg e icono.svg.

import { FM, V, VISION } from '../marca'

/** Logo de la pantalla de ingreso. Toma el color del texto, así se ve en modo claro y oscuro. */
export function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 11 198 35"
      role="img"
      aria-label="Visión 96.5 FM"
      style={{ width: 260, maxWidth: '100%', height: 'auto', color: 'var(--theme-text)' }}
    >
      <path fill="currentColor" d={VISION} />
      <path fill="#C03A0B" d={FM} />
    </svg>
  )
}

/** Ícono del menú y la barra superior del panel. */
export function Icono() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      role="img"
      aria-label="Visión"
      width={24}
      height={24}
    >
      <rect width="48" height="48" fill="#13161D" />
      <path fill="#FFFFFF" d={V} />
      <rect x="0" y="45" width="48" height="3" fill="#C03A0B" />
    </svg>
  )
}
