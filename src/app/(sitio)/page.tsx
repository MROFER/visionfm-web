import type { Metadata } from 'next'

import { CinevisionInicio } from '@/sitio/componentes/inicio/CinevisionInicio'
import { EntrevistasInicio } from '@/sitio/componentes/inicio/EntrevistasInicio'
import { HeroInicio } from '@/sitio/componentes/inicio/HeroInicio'
import { NoticiasInicio } from '@/sitio/componentes/inicio/NoticiasInicio'
import { Participa } from '@/sitio/componentes/globales/Participa'
import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import {
  obtenerAjustes,
  obtenerCartelera,
  obtenerPortada,
  obtenerSecciones,
  ultimasEntrevistas,
  ultimasNoticias,
} from '@/sitio/datos'
import { hoyEnMontevideo } from '@/sitio/lib/fecha'

// Lo que muestra Google del Inicio y la pestaña del navegador. Las vistas previas al compartir toman lo
// mismo. El título va entero: no lleva el " · Visión FM 96.5" de las demás páginas.
export const metadata: Metadata = {
  title: { absolute: 'Visión FM 96.5 · La radio de Fray Bentos, en vivo' },
  description:
    'Escuchá Visión FM 96.5 en vivo desde Fray Bentos. Noticias de Fray Bentos y Río Negro, la programación de la radio y la cartelera de Cinevisión.',
}

// Inicio (design/LEEME.md, sección 7): hero en vivo, publicidad, noticias, Cinevisión, entrevistas y Participá,
// con una publicidad entre cada bloque (docs/07-permisos-y-publicidad.md, sección 3)
export default async function Inicio() {
  const [ajustes, portada, secciones] = await Promise.all([
    obtenerAjustes(),
    obtenerPortada(),
    obtenerSecciones(),
  ])
  const [noticias, cartelera, entrevistas] = await Promise.all([
    ultimasNoticias(5, portada.notaDestacada),
    obtenerCartelera(hoyEnMontevideo()),
    ultimasEntrevistas(4),
  ])

  return (
    <main>
      <HeroInicio>
        <Publicidad ubicacion="inicio" aviso={ajustes.avisoPropio} oscuro />
      </HeroInicio>
      <div id="despues-del-hero" className="contenedor hidden py-8 md:block">
        <Publicidad ubicacion="inicio" aviso={ajustes.avisoPropio} />
      </div>
      <NoticiasInicio destacada={noticias.destacada} resto={noticias.resto} secciones={secciones} />
      <div className="contenedor py-7 md:py-12">
        <Publicidad ubicacion="inicio-noticias" aviso={ajustes.avisoPropio} />
      </div>
      <CinevisionInicio
        cartelera={cartelera}
        destacadaId={portada.peliculaDestacada}
        direccion={ajustes.direccion}
      />
      <div className="contenedor py-7 md:py-12">
        <Publicidad ubicacion="inicio-cine" aviso={ajustes.avisoPropio} />
      </div>
      <EntrevistasInicio entrevistas={entrevistas} />
      <div className="contenedor py-7 md:py-12">
        <Publicidad ubicacion="inicio-participa" aviso={ajustes.avisoPropio} />
      </div>
      <div className="contenedor mt-2 mb-8 lg:mt-12 lg:mb-20">
        <Participa whatsapp={ajustes.whatsapp} />
      </div>
    </main>
  )
}
