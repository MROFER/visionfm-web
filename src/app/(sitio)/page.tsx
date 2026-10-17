import { CinevisionInicio } from '@/sitio/componentes/inicio/CinevisionInicio'
import { EntrevistasInicio } from '@/sitio/componentes/inicio/EntrevistasInicio'
import { HeroEnVivo } from '@/sitio/componentes/inicio/HeroEnVivo'
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

// Inicio (design/LEEME.md, sección 7): hero en vivo, publicidad, noticias, Cinevisión, entrevistas y Participá
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
      <HeroEnVivo telefono={ajustes.telefono}>
        <Publicidad ubicacion="inicio" aviso={ajustes.avisoPropio} oscuro />
      </HeroEnVivo>
      <div className="contenedor hidden py-8 md:block">
        <Publicidad ubicacion="inicio" aviso={ajustes.avisoPropio} />
      </div>
      <NoticiasInicio destacada={noticias.destacada} resto={noticias.resto} secciones={secciones} />
      <CinevisionInicio
        cartelera={cartelera}
        destacadaId={portada.peliculaDestacada}
        direccion={ajustes.direccion}
      />
      <EntrevistasInicio entrevistas={entrevistas} />
      <div className="contenedor mt-2 mb-8 lg:mt-12 lg:mb-20">
        <Participa whatsapp={ajustes.whatsapp} />
      </div>
    </main>
  )
}
