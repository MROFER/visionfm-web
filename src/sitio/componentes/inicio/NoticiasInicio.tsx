import Link from 'next/link'

import type { TarjetaNota } from '../../datos/formas'
import type { SeccionMenu } from '../../navegacion'
import { NotaChica, NotaDestacada } from '../ui/TarjetaNota'
import { TiraSecciones } from '../ui/TiraSecciones'
import { BotonOscuro, TituloSeccion } from '../ui/TituloSeccion'

/** Noticias del Inicio: destacada grande y cuatro chicas (2×2 en web, lista en el celular). */
export function NoticiasInicio({
  destacada,
  resto,
  secciones,
}: {
  destacada: TarjetaNota | null
  resto: TarjetaNota[]
  secciones: SeccionMenu[]
}) {
  return (
    <section className="contenedor pt-7 pb-6 lg:border-b lg:border-linea lg:pt-14 lg:pb-10">
      <TituloSeccion titulo="Noticias">
        <BotonOscuro href="/noticias" className="hidden lg:flex">
          Todas las noticias
        </BotonOscuro>
        <Link href="/noticias" className="etiqueta tracking-[0.08em] lg:hidden">
          Ver todas
        </Link>
      </TituloSeccion>
      <TiraSecciones secciones={secciones} />
      {destacada ? (
        <div className="lg:mt-7 lg:grid lg:grid-cols-4 lg:gap-8">
          <div className="border-b border-linea py-[18px] lg:col-span-2 lg:row-span-2 lg:flex lg:border-0 lg:py-0 [&>article]:flex-1">
            <NotaDestacada nota={destacada} prioridad />
          </div>
          {resto.slice(0, 4).map((n) => (
            <NotaChica key={n.id} nota={n} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-texto-2">Todavía no hay noticias publicadas.</p>
      )}
      <BotonOscuro href="/noticias" className="mt-5 min-h-12 lg:hidden">
        Todas las noticias
      </BotonOscuro>
    </section>
  )
}
