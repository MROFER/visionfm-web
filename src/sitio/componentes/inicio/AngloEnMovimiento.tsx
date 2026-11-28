'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const VARIANTES = {
  web: { medios: '(min-width: 1024px)', archivo: 'anglo-bucle', poster: 'anglo-bucle-inicio.png', ancho: 1280, alto: 720 },
  celular: { medios: '(max-width: 1023px)', archivo: 'anglo-bucle-celular', poster: 'anglo-bucle-celular.png', ancho: 780, alto: 336 },
} as const

/**
 * El dibujo del Anglo con el video lento de Higgsfield (ida y vuelta, 5,7 s, sin audio) que eligió Maximiliano.
 * Siempre se ve primero la imagen quieta, que es el primer cuadro del video, y queda si el video no carga.
 * El video (WebM, y MP4 para los navegadores que no leen WebM) se pide solo en el tamaño de pantalla de su
 * variante, y nunca con "reducir movimiento" ni con el ahorro de datos activado. El del celular es un recorte
 * más chico, con el mismo encuadre que tenía la imagen del celular.
 */
export function AngloEnMovimiento({ variante, prioridad }: { variante: keyof typeof VARIANTES; prioridad?: boolean }) {
  const { medios, archivo, poster, ancho, alto } = VARIANTES[variante]
  const [conVideo, setConVideo] = useState(false)

  useEffect(() => {
    const pantalla = window.matchMedia(medios)
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    const decidir = () => setConVideo(pantalla.matches && !quieto.matches && !ahorro)
    decidir()
    pantalla.addEventListener('change', decidir)
    quieto.addEventListener('change', decidir)
    return () => {
      pantalla.removeEventListener('change', decidir)
      quieto.removeEventListener('change', decidir)
    }
  }, [medios])

  return (
    <div className="relative">
      <Image src={`/hero/${poster}`} alt="" width={ancho} height={alto} priority={prioridad} className="h-auto w-full" />
      {conVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          className="absolute inset-0 h-full w-full"
          data-testid={`anglo-video-${variante}`}
        >
          <source src={`/hero/${archivo}.webm`} type="video/webm" />
          <source src={`/hero/${archivo}.mp4`} type="video/mp4" />
        </video>
      )}
    </div>
  )
}
