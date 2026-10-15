import type { Metadata } from 'next'

import { Casillas, Fila, Formulario, Seleccion, Texto } from '@/sitio/componentes/formularios/Formulario'
import { PaginaFormulario, Pasos } from '@/sitio/componentes/formularios/PaginaFormulario'
import { obtenerAjustes } from '@/sitio/datos'
import { obtenerInstitucional } from '@/sitio/datos/institucional'
import { DONDE_ANUNCIAR, PLAZOS, PRESUPUESTOS } from '@/sitio/formularios/campos'

export const metadata: Metadata = {
  title: 'Pedir tarifas',
  description: 'Tu marca en la radio, en el sitio y en el cine de Fray Bentos. Pedí las tarifas de publicidad de Visión.',
}

// Pedir tarifas (design/LEEME.md, sección 7). El kit comercial se descarga de /api/kit-comercial.
export default async function PedirTarifas() {
  const [ajustes, inst] = await Promise.all([obtenerAjustes(), obtenerInstitucional()])
  return (
    <PaginaFormulario
      ajustes={ajustes}
      miga="Publicidad"
      kicker="Publicidad"
      titulo="Pedir tarifas"
      bajada={
        <p>
          Tu marca en la radio, en el sitio y en el cine de Fray Bentos. Contanos qué necesitás y te mandamos el kit
          comercial.
        </p>
      }
      lateral={
        <>
          <Pasos
            pasos={[
              { titulo: 'Contanos qué buscás', texto: 'Elegí dónde querés anunciar y dejanos los datos de tu empresa.' },
              { titulo: 'Te mandamos el kit comercial', texto: 'Con tarifas, formatos y audiencias, a tu email.' },
              { titulo: 'Armamos tu campaña', texto: 'El área comercial te acompaña para elegir la mejor combinación.' },
            ]}
          />
          {inst.hayKitComercial && (
            <>
              <a
                href="/api/kit-comercial"
                className="etiqueta flex min-h-12 items-center justify-center border-2 border-tinta px-4 text-center no-underline hover:bg-tinta hover:text-blanco md:hidden"
              >
                Descargar kit comercial (PDF) ↓
              </a>
              <div className="hidden flex-col gap-2 bg-tinta p-6 text-blanco md:flex">
                <span className="text-[11px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase">¿Lo necesitás ya?</span>
                <span className="font-titulos text-[22px] leading-tight font-extrabold">Descargá el kit comercial</span>
                <span className="text-sm text-oscuro-1">PDF con formatos y tarifas vigentes.</span>
                <a
                  href="/api/kit-comercial"
                  className="etiqueta mt-2 flex min-h-12 items-center self-start border-2 border-blanco px-4 text-blanco no-underline hover:bg-blanco hover:text-tinta"
                >
                  Descargar PDF ↓
                </a>
              </div>
            </>
          )}
        </>
      }
    >
      <Formulario tipo="tarifas" boton="Pedir tarifas" turnstile={process.env.TURNSTILE_SITE_KEY}>
        <Casillas nombre="donde" etiqueta="¿Dónde querés anunciar?" opciones={DONDE_ANUNCIAR} />
        <Fila>
          <Texto nombre="empresa" etiqueta="Empresa o marca" autoComplete="organization" />
          <Texto nombre="rubro" etiqueta="Rubro" opcional />
          <Texto nombre="nombre" etiqueta="Nombre de contacto" autoComplete="name" />
          <Texto nombre="email" etiqueta="Email" tipo="email" autoComplete="email" />
          <Texto nombre="telefono" etiqueta="Teléfono" tipo="tel" autoComplete="tel" />
          <Seleccion nombre="presupuesto" etiqueta="Presupuesto mensual estimado" opciones={PRESUPUESTOS} />
        </Fila>
        <Seleccion nombre="plazo" etiqueta="¿Cuándo querés empezar?" opciones={PLAZOS} />
        <Texto nombre="mensaje" etiqueta="Mensaje" opcional lineas={5} placeholder="Producto, fechas, público al que querés llegar…" />
      </Formulario>
    </PaginaFormulario>
  )
}
