import type { AjustesSitio } from '@/sitio/datos'
import { urlDelSitio } from '@/sitio/lib/compartir'
import { radioYSitio } from '@/sitio/seo/estructurados'

import { DatosEstructurados } from '../ui/DatosEstructurados'

/** La radio y el sitio en schema.org, en todas las páginas: los demás nodos los referencian por @id. */
export function DatosDeLaRadio({ ajustes }: { ajustes: AjustesSitio }) {
  return <DatosEstructurados nodos={radioYSitio(urlDelSitio().origin, ajustes)} />
}
