'use client'

import { useRadio } from './Radio'

/**
 * El cuadrito naranja de "Al aire". Mientras la radio suena en la página se vuelve tres barritas que se
 * mueven, y al pausar vuelve a ser el cuadrito (estilos.css, .indicador-al-aire). El tamaño va en
 * `className`.
 */
export function IndicadorAlAire({ className }: { className: string }) {
  const { sonando, cargando, reconectando } = useRadio()
  return (
    <span
      aria-hidden
      data-sonando={(sonando && !cargando && !reconectando) || undefined}
      className={`indicador-al-aire ${className}`}
    >
      <span />
      <span />
      <span />
    </span>
  )
}
