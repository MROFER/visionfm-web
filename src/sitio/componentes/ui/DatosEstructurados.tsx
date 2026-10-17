import { jsonLd } from '@/sitio/seo/estructurados'

/** Los datos estructurados de la página (src/sitio/seo/estructurados.ts) en un <script> JSON-LD. */
export function DatosEstructurados({ nodos }: { nodos: Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(nodos) }} />
}
