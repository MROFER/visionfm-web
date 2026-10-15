import { Participa } from '@/sitio/componentes/globales/Participa'
import { obtenerAjustes } from '@/sitio/datos'

// Provisorio: el Inicio completo (hero en vivo, noticias, Cinevisión y entrevistas) llega en el próximo PR
export default async function Inicio() {
  const { whatsapp } = await obtenerAjustes()
  return (
    <main className="contenedor py-12 lg:py-16">
      <h1 className="m-0 font-titulos text-5xl leading-none font-bold">Visión 96.5 FM</h1>
      <p className="mt-4 mb-12 text-texto-2">Sitio en construcción.</p>
      <Participa whatsapp={whatsapp} />
    </main>
  )
}
