// Logotipo de la radio para el panel: "Visión" (Newsreader 700) y "FM 96.5", convertidos a trazos
// para no cargar la tipografía. Las mismas formas están en public/marca/logo.svg e icono.svg.

import { FM, V, VISION } from '../marca'

/**
 * Logo de la pantalla de ingreso, apilado como en el sitio: "FM 96.5" debajo de "Visión", terminando en
 * el borde de la N. Toma el color del texto, así se ve en modo claro y oscuro.
 */
export function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-1 11 125 47"
      role="img"
      aria-label="Visión FM 96.5"
      style={{ width: 164, maxWidth: '100%', height: 'auto', color: 'var(--theme-text)' }}
    >
      <path fill="currentColor" d={VISION} />
      <path fill="#C03A0B" transform="translate(-72.2 13)" d={FM} />
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
