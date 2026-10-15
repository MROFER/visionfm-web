import type { Imagen } from '../../datos/formas'

/**
 * Foto con sus versiones en WebP para que el navegador baje la que necesita (srcset). Sin foto, la caja
 * gris del diseño. El tamaño lo da el contenedor: la imagen lo llena recortando (object-cover).
 */
export function Foto({
  imagen,
  sizes,
  className = '',
  prioridad = false,
  textoSinFoto = '',
}: {
  imagen: Imagen | null
  sizes: string
  className?: string
  /** La foto principal de la página: carga ya y con prioridad alta (LCP). */
  prioridad?: boolean
  textoSinFoto?: string
}) {
  if (!imagen) {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center bg-sin-foto text-sm font-semibold text-meta ${className}`}
      >
        {textoSinFoto}
      </div>
    )
  }
  const srcSet = imagen.tamanos.length
    ? imagen.tamanos.map((t) => `${t.url} ${t.ancho}w`).join(', ')
    : undefined
  return (
    // eslint-disable-next-line @next/next/no-img-element -- las versiones ya las genera Payload al subir
    <img
      src={imagen.tamanos.at(-1)?.url ?? imagen.url}
      srcSet={srcSet}
      sizes={sizes}
      alt={imagen.alt}
      width={imagen.ancho || undefined}
      height={imagen.alto || undefined}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchPriority={prioridad ? 'high' : undefined}
      decoding="async"
      className={`bg-sin-foto object-cover ${className}`}
    />
  )
}
