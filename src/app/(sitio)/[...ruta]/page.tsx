import { notFound } from 'next/navigation'

// Cualquier ruta que no existe cae acá y muestra la 404 del sitio (not-found.tsx) con el encabezado y
// el pie. Sin esta ruta, Next mostraría su 404 genérica, porque el sitio y el panel tienen layouts raíz
// distintos.
export default function RutaInexistente() {
  notFound()
}
