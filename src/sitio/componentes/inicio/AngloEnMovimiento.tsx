'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

/**
 * El dibujo del Anglo en web, con el video lento de Higgsfield (ida y vuelta, 5,7 s) que eligió Maximiliano.
 * Primero se ve el primer cuadro quieto, y el video se pide recién cuando la pantalla es de web y la persona
 * no desactivó las animaciones: en el celular o con movimiento reducido no se descarga.
 */
export function AngloEnMovimiento() {
  const [conVideo, setConVideo] = useState(false)

  useEffect(() => {
    const web = window.matchMedia('(min-width: 1024px)')
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decidir = () => setConVideo(web.matches && !quieto.matches)
    decidir()
    web.addEventListener('change', decidir)
    quieto.addEventListener('change', decidir)
    return () => {
      web.removeEventListener('change', decidir)
      quieto.removeEventListener('change', decidir)
    }
  }, [])

  return (
    <div className="relative">
      <Image src="/hero/anglo-bucle-inicio.png" alt="" width={1280} height={720} priority className="h-auto w-full" />
      {conVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full"
          data-testid="anglo-video"
        >
          <source src="/hero/anglo-bucle.webm" type="video/webm" />
          <source src="/hero/anglo-bucle.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  )
}
