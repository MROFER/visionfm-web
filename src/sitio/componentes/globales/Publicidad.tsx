import Link from 'next/link'

import type { AjustesSitio } from '../../datos'
import { Foto } from '../ui/Foto'

/**
 * Espacio de publicidad (970×90 en web, 320×100 en celular), uno por página y nunca en Cinevisión.
 * Por ahora muestra el aviso propio de la radio de los Ajustes; la rotación de anuncios con métricas
 * llega en la fase 3. Sin aviso propio cargado, invita a anunciar.
 */
export function Publicidad({ aviso, oscuro = false }: { aviso: AjustesSitio['avisoPropio']; oscuro?: boolean }) {
  const caja = oscuro
    ? 'border-oscuro-borde bg-oscuro-caja text-oscuro-2'
    : 'border-aviso-borde bg-aviso text-meta'
  const vacio = (clase: string) => (
    <Link
      href={aviso.link}
      className={`flex items-center justify-center border border-dashed text-[13px] font-bold no-underline ${caja} ${clase}`}
    >
      Anunciá en Visión
    </Link>
  )
  return (
    <aside aria-label="Publicidad" className="flex flex-col items-center gap-2">
      <span
        className={`text-[10px] font-extrabold tracking-[0.14em] uppercase ${oscuro ? 'text-oscuro-2' : 'text-meta'}`}
      >
        Publicidad
      </span>
      <div className="md:hidden">
        {aviso.movil ? (
          <Link href={aviso.link} className="block">
            <Foto imagen={aviso.movil} sizes="320px" className="h-[100px] w-[320px] max-w-full" />
          </Link>
        ) : (
          vacio('h-[100px] w-[320px] max-w-full')
        )}
      </div>
      <div className="hidden w-full justify-center md:flex">
        {aviso.web ? (
          <Link href={aviso.link} className="block w-[970px] max-w-full">
            <Foto imagen={aviso.web} sizes="970px" className="h-auto w-full" />
          </Link>
        ) : (
          vacio('h-[90px] w-[970px] max-w-full')
        )}
      </div>
    </aside>
  )
}
