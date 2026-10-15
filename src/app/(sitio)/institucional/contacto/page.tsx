import type { Metadata } from 'next'

import { Adjunto, Fila, Formulario, Seleccion, Texto } from '@/sitio/componentes/formularios/Formulario'
import { PaginaFormulario } from '@/sitio/componentes/formularios/PaginaFormulario'
import { Redes } from '@/sitio/componentes/ui/Redes'
import { obtenerAjustes } from '@/sitio/datos'
import { MOTIVOS } from '@/sitio/formularios/campos'

export const metadata: Metadata = {
  title: 'Contacto',
  description: '¿Tenés una noticia, un aviso o querés salir al aire? Escribile a Visión 96.5 FM.',
}

// Contacto (design/LEEME.md, sección 7)
export default async function Contacto() {
  const ajustes = await obtenerAjustes()
  return (
    <PaginaFormulario
      ajustes={ajustes}
      kicker="Escribinos"
      titulo="Contacto"
      bajada={<p>¿Tenés una noticia, un aviso o querés salir al aire? Escribinos y te respondemos a la brevedad.</p>}
      lateral={
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[15px] leading-[1.6] text-meta md:text-base">Para noticias, avisos, publicidad o salir al aire.</p>
          {ajustes.direccion && <span className="text-[15px] font-bold md:text-base">{ajustes.direccion}</span>}
          <Redes ajustes={ajustes} claro className="flex" />
        </div>
      }
    >
      <Formulario tipo="contacto" boton="Enviar mensaje" oscuro turnstile={process.env.TURNSTILE_SITE_KEY}>
        <Fila>
          <Texto nombre="nombre" etiqueta="Nombre" autoComplete="name" />
          <Texto nombre="email" etiqueta="Email" tipo="email" autoComplete="email" />
        </Fila>
        <Seleccion nombre="motivo" etiqueta="Motivo" opciones={MOTIVOS} />
        <Texto nombre="mensaje" etiqueta="Mensaje" lineas={5} />
        <Adjunto texto="Elegí un archivo: foto, audio, video o documento · hasta 10 MB" />
      </Formulario>
    </PaginaFormulario>
  )
}
