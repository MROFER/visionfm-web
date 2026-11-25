'use client'

import { IconoCargando, IconoPausa, IconoPlay, IconoPlayRedondo } from '../ui/iconos'
import { useRadio } from './Radio'

const TEXTOS = ['Escuchar en vivo', 'Conectando…', 'Reconectando…', 'Pausar'] as const

/**
 * Los textos de todos los estados, uno encima del otro (estilos.css, .pila): el botón mide lo que el más
 * largo y no cambia de ancho al pasar de uno a otro. Los que no se ven quedan fuera del nombre del botón.
 */
function Textos({ texto }: { texto: string }) {
  return (
    <span className="pila pila-texto">
      {TEXTOS.map((t) => (
        <span key={t} data-activo={t === texto || undefined} aria-hidden={t !== texto || undefined}>
          {t}
        </span>
      ))}
    </span>
  )
}

/** Íconos de cada estado, uno encima del otro: el cambio es un fundido corto, sin saltos. */
function Iconos({
  estado,
  tamano,
  redondo = false,
}: {
  estado: 'play' | 'cargando' | 'pausa'
  tamano?: number
  redondo?: boolean
}) {
  return (
    <span aria-hidden className="pila">
      <span data-activo={estado === 'play' || undefined}>
        {redondo ? <IconoPlayRedondo tamano={tamano} /> : <IconoPlay tamano={tamano} />}
      </span>
      <span data-activo={estado === 'cargando' || undefined}>
        <IconoCargando tamano={tamano} className={estado === 'cargando' ? '' : 'pausada'} />
      </span>
      <span data-activo={estado === 'pausa' || undefined}>
        <IconoPausa tamano={tamano} />
      </span>
    </span>
  )
}

/**
 * "Escuchar en vivo" ↔ "Conectando…" ↔ "Pausar". Todos los botones del sitio controlan el mismo audio.
 * Mientras conecta se ve una ruedita: sin ella, el toque parece no haber hecho nada. Tocar de nuevo
 * corta la conexión. Al apretarlos se achican un poco (.apretable). `compacto` es el del header en web,
 * más bajo para que la barra mida 64 px.
 */
export function BotonEnVivo({
  variante,
  compacto = false,
}: {
  variante: 'header' | 'redondo' | 'hero' | 'inicio'
  compacto?: boolean
}) {
  const { sonando, cargando, reconectando, alternar } = useRadio()
  const activo = sonando || cargando
  const texto = reconectando
    ? 'Reconectando…'
    : cargando
      ? 'Conectando…'
      : sonando
        ? 'Pausar'
        : 'Escuchar en vivo'
  const estado = cargando ? 'cargando' : sonando ? 'pausa' : 'play'

  if (variante === 'redondo') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-label={activo ? 'Pausar la radio en vivo' : 'Escuchar la radio en vivo'}
        aria-pressed={activo}
        aria-busy={cargando}
        className="apretable relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-acento text-blanco hover:bg-acento-hover"
      >
        <Iconos estado={estado} />
        {sonando && !cargando && (
          <span className="absolute top-0 right-0 size-3 rounded-full border-2 border-blanco bg-vivo" />
        )}
      </button>
    )
  }

  if (variante === 'hero') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={activo}
        aria-busy={cargando}
        className="apretable flex min-h-[60px] cursor-pointer items-center justify-center gap-3 bg-acento px-7 text-sm font-extrabold tracking-[0.1em] text-blanco uppercase hover:bg-acento-hover md:min-h-16 md:justify-start md:gap-3.5 md:pl-[22px] md:text-[15px]"
      >
        <Iconos estado={estado} tamano={22} />
        <Textos texto={texto} />
      </button>
    )
  }

  // Hero del Inicio: puntas apenas redondeadas y el play redondeado
  if (variante === 'inicio') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={activo}
        aria-busy={cargando}
        className="apretable flex min-h-[54px] cursor-pointer items-center justify-center gap-3 rounded-[3px] bg-acento px-7 text-[13px] font-extrabold tracking-[0.1em] text-blanco uppercase hover:bg-acento-hover md:justify-start md:pl-6"
      >
        <Iconos estado={estado} tamano={18} redondo />
        <Textos texto={texto} />
      </button>
    )
  }

  // Header: triángulo de play y puntas apenas redondeadas
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={activo}
      aria-busy={cargando}
      className={`etiqueta apretable flex cursor-pointer items-center gap-2.5 rounded-[3px] bg-acento text-blanco hover:bg-acento-hover ${
        compacto ? 'min-h-10 px-[15px] text-[10px]' : 'min-h-12 px-[18px]'
      }`}
    >
      <Iconos estado={estado} tamano={13} redondo />
      <Textos texto={texto} />
    </button>
  )
}
