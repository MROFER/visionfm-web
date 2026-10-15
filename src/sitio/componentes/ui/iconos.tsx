// Íconos del diseño (trazos de 24×24). Decorativos: el texto o el aria-label del botón dicen qué hacen.

type Props = { tamano?: number; className?: string }

const base = (tamano: number) => ({
  width: tamano,
  height: tamano,
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
})

export const IconoPlay = ({ tamano = 16, className }: Props) => (
  <svg {...base(tamano)} className={className} fill="currentColor">
    <polygon points="7 4 20 12 7 20 7 4" />
  </svg>
)

export const IconoPausa = ({ tamano = 16, className }: Props) => (
  <svg {...base(tamano)} className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
    <line x1="8" y1="5" x2="8" y2="19" />
    <line x1="16" y1="5" x2="16" y2="19" />
  </svg>
)

export const IconoFlechaAbajo = ({ tamano = 12, className }: Props) => (
  <svg {...base(tamano)} className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const IconoMenu = ({ tamano = 20, className }: Props) => (
  <svg {...base(tamano)} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
)

export const IconoCerrar = ({ tamano = 20, className }: Props) => (
  <svg {...base(tamano)} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconoWhatsapp = ({ tamano = 20, className }: Props) => (
  <svg {...base(tamano)} className={className} {...trazo}>
    <path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
  </svg>
)

export const IconoInstagram = ({ tamano = 20, className }: Props) => (
  <svg {...base(tamano)} className={className} {...trazo}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

export const IconoFacebook = ({ tamano = 20, className }: Props) => (
  <svg {...base(tamano)} className={className} {...trazo}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16 14c3 0 5 1.5 5 4.5" />
  </svg>
)

/** Para redes sin ícono propio en el diseño (X, YouTube, TikTok): un enlace genérico. */
export const IconoEnlace = ({ tamano = 20, className }: Props) => (
  <svg {...base(tamano)} className={className} {...trazo}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
)
