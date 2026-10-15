import type { AjustesSitio } from '../../datos'
import { linkWhatsapp } from '../../navegacion'
import { IconoEnlace, IconoFacebook, IconoInstagram, IconoWhatsapp } from './iconos'

const NOMBRE_RED: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
}

/** Íconos redondos de las redes de la radio, con el WhatsApp al final. Oscuro en el pie, claro en el contenido. */
export function Redes({
  ajustes,
  className,
  claro = false,
}: {
  ajustes: AjustesSitio
  className: string
  claro?: boolean
}) {
  const redes = ajustes.redes.filter((r) => r.red !== 'whatsapp')
  if (ajustes.whatsapp) redes.push({ red: 'whatsapp', url: linkWhatsapp(ajustes.whatsapp) })
  return (
    <div className={`gap-2.5 py-1.5 ${className}`}>
      {redes.map((r) => {
        const Icono =
          r.red === 'instagram'
            ? IconoInstagram
            : r.red === 'facebook'
              ? IconoFacebook
              : r.red === 'whatsapp'
                ? IconoWhatsapp
                : IconoEnlace
        return (
          <a
            key={r.red}
            href={r.url}
            aria-label={`${NOMBRE_RED[r.red] ?? r.red} de Visión`}
            className={`flex size-11 items-center justify-center rounded-full border-2 no-underline ${
              claro
                ? 'border-tinta text-tinta hover:bg-tinta hover:text-blanco'
                : 'border-oscuro-borde text-blanco hover:border-blanco'
            }`}
          >
            <Icono />
          </a>
        )
      })}
    </div>
  )
}
