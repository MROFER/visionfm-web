'use client'

import { useState } from 'react'

const abrir = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

/**
 * Compartir la nota. La dirección se toma del navegador al tocar, así sirve igual en la demo, en
 * staging y en producción. En el celular son dos botones grandes; en web, tres chicos con copiar enlace.
 */
export function Compartir({ titulo, variante }: { titulo: string; variante: 'web' | 'movil' }) {
  const [copiado, setCopiado] = useState(false)
  const whatsapp = () => abrir(`https://wa.me/?text=${encodeURIComponent(`${titulo} ${location.href}`)}`)
  const facebook = () =>
    abrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Sin permiso para el portapapeles no hay nada que hacer: el enlace sigue en la barra
    }
  }

  if (variante === 'movil') {
    const clase = 'flex min-h-12 cursor-pointer items-center justify-center text-xs font-extrabold tracking-[0.08em] uppercase'
    return (
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={whatsapp} className={`${clase} bg-tinta text-blanco`}>
          WhatsApp
        </button>
        <button type="button" onClick={facebook} className={`${clase} border-2 border-tinta bg-blanco`}>
          Facebook
        </button>
      </div>
    )
  }

  const clase =
    'flex min-h-10 cursor-pointer items-center border-2 border-tinta bg-blanco px-3.5 text-xs font-extrabold tracking-[0.08em] uppercase hover:bg-suave'
  return (
    <div className="flex gap-2">
      <button type="button" onClick={whatsapp} className={clase}>
        WhatsApp
      </button>
      <button type="button" onClick={facebook} className={clase}>
        Facebook
      </button>
      <button type="button" onClick={copiar} className={clase} aria-live="polite">
        {copiado ? 'Enlace copiado' : 'Copiar enlace'}
      </button>
    </div>
  )
}
