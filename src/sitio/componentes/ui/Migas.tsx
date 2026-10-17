import { urlDelSitio } from '@/sitio/lib/compartir'
import { migas } from '@/sitio/seo/estructurados'

import { DatosEstructurados } from './DatosEstructurados'

/** La ruta de la página para los buscadores (BreadcrumbList), aunque en pantalla no se muestre. */
export function Migas({ pasos }: { pasos: { nombre: string; ruta?: string }[] }) {
  return <DatosEstructurados nodos={[migas(urlDelSitio().origin, pasos)]} />
}
