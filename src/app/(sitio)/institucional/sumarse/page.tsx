import type { Metadata } from 'next'

import { Adjunto, Casillas, Fila, Formulario, Texto } from '@/sitio/componentes/formularios/Formulario'
import { PaginaFormulario, Pasos } from '@/sitio/componentes/formularios/PaginaFormulario'
import { obtenerAjustes } from '@/sitio/datos'
import { AREAS_SUMARSE } from '@/sitio/formularios/campos'

export const metadata: Metadata = {
  title: 'Quiero sumarme',
  description: 'Columnas, conducción, producción, pasantías y propuestas de programas: sumate a Visión 96.5 FM.',
}

// Quiero sumarme (design/LEEME.md, sección 7)
export default async function Sumarse() {
  const ajustes = await obtenerAjustes()
  return (
    <PaginaFormulario
      ajustes={ajustes}
      miga="Ser parte"
      kicker="Ser parte"
      titulo="Quiero sumarme"
      bajada={<p>Buscamos voces, ideas y manos para hacer radio, noticias y cine en Fray Bentos.</p>}
      lateral={
        <Pasos
          pasos={[
            {
              titulo: 'Mandás tu propuesta',
              texto: 'Completá el formulario y, si querés, adjuntá un CV o una muestra de tu trabajo.',
            },
            { titulo: 'La leemos', texto: 'El equipo de producción revisa cada propuesta.' },
            { titulo: 'Te contactamos', texto: 'Si hay un lugar para vos, te escribimos para conversar.' },
          ]}
        />
      }
    >
      <Formulario tipo="sumarse" boton="Enviar propuesta" turnstile={process.env.TURNSTILE_SITE_KEY}>
        <Fila>
          <Texto nombre="nombre" etiqueta="Nombre y apellido" autoComplete="name" />
          <Texto nombre="email" etiqueta="Email" tipo="email" autoComplete="email" />
          <Texto nombre="telefono" etiqueta="Teléfono" tipo="tel" autoComplete="tel" />
          <Texto nombre="ciudad" etiqueta="Ciudad" opcional autoComplete="address-level2" />
        </Fila>
        <Casillas nombre="areas" etiqueta="¿Cómo te gustaría sumarte?" opciones={AREAS_SUMARSE} />
        <Texto
          nombre="mensaje"
          etiqueta="Contanos sobre vos"
          lineas={5}
          placeholder="Qué hacés, qué te gustaría hacer en Visión, experiencia previa…"
        />
        <Texto nombre="link" etiqueta="Link a redes o portfolio" tipo="url" opcional autoComplete="url" />
        <Adjunto texto="CV, audio o video de muestra, o tu propuesta · hasta 10 MB" />
      </Formulario>
    </PaginaFormulario>
  )
}
