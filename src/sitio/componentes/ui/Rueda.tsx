'use client'

import { useEffect, useState } from 'react'

/** Lo que dura la entrada del texto nuevo (estilos.css, .rueda-entra), con su demora. */
const DURACION = 700

/**
 * Texto que rueda cuando cambia, como el programa al aire: el que estaba sube y se apaga, y el nuevo
 * entra desde abajo (estilos.css, .rueda). El que sale no ocupa lugar, así lo de abajo se acomoda de una
 * vez al texto nuevo. `bloque` es para títulos que pueden ocupar dos renglones. Con "reducir movimiento"
 * cambia sin animación.
 */
export function Rueda({ texto, bloque = false }: { texto: string; bloque?: boolean }) {
  const [{ actual, saliente }, setEstado] = useState<{ actual: string; saliente: string | null }>({
    actual: texto,
    saliente: null,
  })
  if (texto !== actual) setEstado({ actual: texto, saliente: actual })

  // El viejo se saca a tiempo fijo y no al terminar la animación: donde no se ve (oculto en el celular,
  // por ejemplo) la animación no corre y no avisaría nunca
  useEffect(() => {
    if (saliente === null) return
    const espera = setTimeout(() => setEstado((e) => ({ ...e, saliente: null })), DURACION)
    return () => clearTimeout(espera)
  }, [saliente, actual])

  return (
    <span className={bloque ? 'rueda rueda-bloque' : 'rueda'}>
      {saliente !== null && (
        <span aria-hidden className="rueda-sale">
          {saliente}
        </span>
      )}
      <span key={actual} className={saliente !== null ? 'rueda-entra' : undefined}>
        {actual}
      </span>
    </span>
  )
}
