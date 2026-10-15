'use client'

import { useState } from 'react'

/**
 * Tráiler de YouTube que se carga recién al tocarlo: antes es solo la miniatura, así la página no baja
 * el reproductor de YouTube ni sus cookies si nadie lo mira. Usa el dominio sin cookies de YouTube.
 */
export function Trailer({ video, titulo }: { video: string; titulo: string }) {
  const [abierto, setAbierto] = useState(false)

  if (abierto) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`}
        title={`Tráiler de ${titulo}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="aspect-video w-full border-0 bg-tinta"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      aria-label={`Reproducir el tráiler de ${titulo}`}
      className="group relative flex aspect-video w-full cursor-pointer items-center justify-center bg-oscuro-linea p-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube */}
      <img
        src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        onError={(e) => e.currentTarget.remove()}
        className="absolute inset-0 size-full object-cover"
      />
      <span
        aria-hidden
        className="relative flex size-14 items-center justify-center rounded-full bg-blanco/92 transition-transform group-hover:scale-105 lg:size-[84px]"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 size-[23px] text-tinta lg:size-[35px]">
          <path d="M7 4l14 8-14 8z" />
        </svg>
      </span>
    </button>
  )
}
