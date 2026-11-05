'use client'

import { useState } from 'react'

import { IconoEnlace, IconoFacebook, IconoListo, IconoWhatsapp, IconoX } from '../ui/iconos'

const abrir = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

/**
 * Compartir la nota: WhatsApp, Facebook y X con su logo, en botones cuadrados, y "Copiar enlace" en texto.
 * La dirección se toma del navegador al tocar, así sirve igual en la demo, en staging y en producción. En
 * el celular los botones son más grandes, WhatsApp va relleno y "Copiar enlace" ocupa lo que queda de la fila.
 */
export function Compartir({ titulo, variante }: { titulo: string; variante: 'web' | 'movil' }) {
  const [copiado, setCopiado] = useState(false)
  const url = () => encodeURIComponent(location.href)
  const redes = [
    {
      nombre: 'WhatsApp',
      Icono: IconoWhatsapp,
      abrir: () => abrir(`https://wa.me/?text=${encodeURIComponent(`${titulo} ${location.href}`)}`),
    },
    {
      nombre: 'Facebook',
      Icono: IconoFacebook,
      abrir: () => abrir(`https://www.facebook.com/sharer/sharer.php?u=${url()}`),
    },
    {
      nombre: 'X',
      Icono: IconoX,
      abrir: () => abrir(`https://x.com/intent/post?text=${encodeURIComponent(titulo)}&url=${url()}`),
    },
  ]
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Sin permiso para el portapapeles no hay nada que hacer: el enlace sigue en la barra
    }
  }

  const movil = variante === 'movil'
  const borde = 'cursor-pointer items-center justify-center border-2 border-tinta'
  const claro = 'bg-blanco text-tinta hover:bg-suave'
  const Copiado = copiado ? IconoListo : IconoEnlace
  return (
    // En el celular la fila mide lo que el contenedor: con menos de 336 px "Copiar enlace" no entra
    // en una línea y queda solo el ícono, en un cuadrado como los otros
    <div className={`flex gap-2 ${movil ? '@container' : ''}`}>
      {redes.map(({ nombre, Icono, abrir }, i) => (
        <button
          key={nombre}
          type="button"
          onClick={abrir}
          aria-label={`Compartir en ${nombre}`}
          // En el celular WhatsApp sigue siendo el principal, relleno como hoy
          className={`flex shrink-0 ${borde} ${movil ? 'size-12' : 'size-10'} ${
            movil && i === 0 ? 'bg-tinta text-blanco' : claro
          }`}
        >
          <Icono tamano={movil ? 20 : 18} />
        </button>
      ))}
      <button
        type="button"
        onClick={copiar}
        aria-live="polite"
        className={`flex gap-2 text-xs font-extrabold tracking-[0.08em] uppercase ${borde} ${claro} ${
          movil
            ? 'size-12 shrink-0 @min-[336px]:w-auto @min-[336px]:flex-1 @min-[336px]:px-3.5'
            : 'min-h-10 px-3.5'
        }`}
      >
        <Copiado tamano={16} className={movil ? 'size-5 @min-[336px]:size-4' : undefined} />
        <span className={movil ? 'sr-only @min-[336px]:not-sr-only' : undefined}>
          {copiado ? 'Enlace copiado' : 'Copiar enlace'}
        </span>
      </button>
    </div>
  )
}
