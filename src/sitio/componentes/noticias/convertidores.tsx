import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import type { BloqueGaleria, Medio } from '@/payload-types'
import { aImagen } from '../../datos/formas'
import { Foto } from '../ui/Foto'
import { type FotoGaleria, GaleriaNota } from './GaleriaNota'

const medio = (valor: unknown) => (valor && typeof valor === 'object' ? (valor as Medio) : null)

/** El pie de una foto: el epígrafe y, si la foto lo tiene, de quién es. */
export const pieDeFoto = (epigrafe: string | null | undefined, credito: string | null | undefined) =>
  [epigrafe, credito && `Foto: ${credito}`].filter(Boolean).join(' · ')

/**
 * Cómo se dibuja el texto de una nota: las fotos que la redacción pone en el medio o al final van del
 * ancho del texto, con su proporción y su epígrafe, y las galerías con flechas (bocetos/nota-galeria).
 */
export const convertidoresNota: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    const m = medio(node.value)
    const imagen = aImagen(m)
    if (!m || !imagen) return null
    const pie = pieDeFoto((node.fields as { epigrafe?: string } | undefined)?.epigrafe, m.credito)
    return (
      <figure className="flex flex-col gap-2 md:gap-2.5">
        <Foto imagen={imagen} sizes="(min-width: 768px) 680px, calc(100vw - 32px)" className="h-auto w-full" />
        {pie && <figcaption className="text-xs text-meta md:text-[13px]">{pie}</figcaption>}
      </figure>
    )
  },
  blocks: {
    galeria: ({ node }: { node: { fields: BloqueGaleria } }) => {
      const fotos = node.fields.fotos.flatMap((f): FotoGaleria[] => {
        const m = medio(f.foto)
        const imagen = aImagen(m)
        return imagen ? [{ imagen, pie: pieDeFoto(f.epigrafe, m?.credito) }] : []
      })
      return fotos.length ? <GaleriaNota fotos={fotos} /> : null
    },
  },
})
