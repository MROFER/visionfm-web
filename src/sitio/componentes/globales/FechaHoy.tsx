'use client'

import { useEffect, useState } from 'react'

import { fechaLarga } from '../../lib/fecha'

/**
 * La fecha del día. El HTML puede salir de la caché de otro día, así que el navegador la vuelve a
 * escribir con su reloj al cargar.
 */
export function FechaHoy({ anio = true }: { anio?: boolean }) {
  const [hoy, setHoy] = useState(() => new Date())
  useEffect(() => {
    const t = setTimeout(() => setHoy(new Date()), 0)
    return () => clearTimeout(t)
  }, [])
  return <span suppressHydrationWarning>{fechaLarga(hoy, { anio })}</span>
}
