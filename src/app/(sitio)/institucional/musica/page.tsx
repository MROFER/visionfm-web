import type { Metadata } from 'next'

import { Adjunto, Casilla, Fila, Formulario, Texto } from '@/sitio/componentes/formularios/Formulario'
import { PaginaFormulario, Pasos } from '@/sitio/componentes/formularios/PaginaFormulario'
import { obtenerAjustes } from '@/sitio/datos'

export const metadata: Metadata = {
  title: 'Enviá tu música',
  description: '¿Sos artista o tenés una banda? Mandale tu música a Visión 96.5 FM para una posible difusión.',
}

// Enviá tu música (design/LEEME.md, sección 7): la puerta de los artistas, con su sección en Institucional
export default async function EnviarMusica() {
  const ajustes = await obtenerAjustes()
  return (
    <PaginaFormulario
      ajustes={ajustes}
      miga="Tu música"
      kicker="Tu música"
      titulo="Enviá tu música"
      bajada={
        <p>
          ¿Sos artista o tenés una banda? Queremos escuchar tu material. Compartilo con nosotros para una posible difusión
          en el 96.5.
        </p>
      }
      lateral={
        <Pasos
          pasos={[
            { titulo: 'Mandás tu música', texto: 'Un link para escucharla y, si querés, el tema en MP3.' },
            { titulo: 'La escuchamos', texto: 'El equipo de programación escucha todo lo que llega.' },
            { titulo: 'Te avisamos', texto: 'Si va a sonar en el 96.5, te escribimos.' },
          ]}
        />
      }
    >
      <Formulario
        tipo="musica"
        boton="Enviar mi música"
        confirmacion="Recibimos tu música. Si va a sonar en el 96.5, te avisamos."
        turnstile={process.env.TURNSTILE_SITE_KEY}
      >
        <Fila>
          <Texto nombre="artista" etiqueta="Artista o banda" />
          <Texto nombre="nombre" etiqueta="Tu nombre" autoComplete="name" />
          <Texto nombre="email" etiqueta="Email" tipo="email" autoComplete="email" />
          <Texto nombre="telefono" etiqueta="Teléfono" tipo="tel" opcional autoComplete="tel" />
          <Texto nombre="ciudad" etiqueta="Ciudad" opcional autoComplete="address-level2" />
          <Texto nombre="genero" etiqueta="Género o estilo" opcional />
        </Fila>
        <Texto
          nombre="escuchar"
          etiqueta="Link para escucharla"
          tipo="url"
          autoComplete="url"
          placeholder="Spotify, YouTube, SoundCloud o Drive"
        />
        <Adjunto rotulo="Adjuntar el tema" texto="Tu tema en MP3 · hasta 10 MB" />
        <Texto
          nombre="mensaje"
          etiqueta="Contanos sobre tu música"
          opcional
          lineas={4}
          placeholder="Quiénes son, de dónde, qué tema nos mandás…"
        />
        <Casilla nombre="autorizacion">
          Tengo derecho a compartir este material y autorizo a Visión a pasarlo en la radio.
        </Casilla>
      </Formulario>
    </PaginaFormulario>
  )
}
