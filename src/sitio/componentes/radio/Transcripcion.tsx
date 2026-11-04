'use client'

import { useId, useState, type ReactNode } from 'react'

import { IconoFlechaAbajo } from '../ui/iconos'

/**
 * La transcripción de una entrevista, plegada si es larga: se ven los primeros párrafos y un botón la
 * despliega entera (y la vuelve a plegar). Plegada sigue estando toda en la página, así buscadores y
 * asistentes de IA la leen completa.
 */
export function Transcripcion({ larga, children }: { larga: boolean; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)
  const id = useId()
  const plegada = larga && !abierta
  return (
    <>
      <div
        id={id}
        className={`relative max-w-[728px] pt-5 md:pt-7 ${plegada ? 'max-h-[440px] overflow-hidden md:max-h-[520px]' : ''}`}
      >
        <div className="cuerpo-nota">{children}</div>
        {plegada && (
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-blanco/0 to-blanco"
          />
        )}
      </div>
      {larga && (
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={id}
          onClick={() => {
            // Al plegarla se vuelve al título, para no quedar más abajo del texto
            if (abierta)
              document.getElementById('transcripcion')?.scrollIntoView({ block: 'start' })
            setAbierta(!abierta)
          }}
          className="etiqueta mt-5 flex min-h-11 cursor-pointer items-center gap-2 border-2 border-tinta bg-blanco px-5 text-tinta hover:bg-tinta hover:text-blanco md:mt-6"
        >
          {abierta ? 'Plegar la transcripción' : 'Leer la transcripción completa'}
          <IconoFlechaAbajo className={abierta ? 'rotate-180' : ''} />
        </button>
      )}
    </>
  )
}
