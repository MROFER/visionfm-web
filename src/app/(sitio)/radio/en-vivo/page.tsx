import type { Metadata } from 'next'

import { HeroEnVivo } from '@/sitio/componentes/inicio/HeroEnVivo'
import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { ReproductorPantalla } from '@/sitio/componentes/radio/ReproductorPantalla'
import { obtenerAjustes } from '@/sitio/datos'

export const metadata: Metadata = {
  title: 'En vivo',
  description: 'Escuchá Visión 96.5 FM en vivo desde Fray Bentos.',
}

// En vivo (design/LEEME.md, sección 7): en el celular y la tablet es el reproductor a pantalla completa;
// en web no hay diseño propio y va el hero del Inicio.
export default async function EnVivo() {
  const ajustes = await obtenerAjustes()
  return (
    <main>
      <div className="lg:hidden">
        <ReproductorPantalla>
          <Publicidad aviso={ajustes.avisoPropio} oscuro />
        </ReproductorPantalla>
      </div>
      <div className="hidden lg:block">
        <HeroEnVivo telefono={ajustes.telefono}>
          <Publicidad aviso={ajustes.avisoPropio} oscuro />
        </HeroEnVivo>
      </div>
    </main>
  )
}
