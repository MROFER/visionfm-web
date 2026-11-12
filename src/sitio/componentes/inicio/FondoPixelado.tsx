'use client'

import { useEffect, useRef } from 'react'

/**
 * Fondo del hero del Inicio en web (desde 1024 px): fotos de Fray Bentos pasadas a cuadritos de 6 px en
 * cuatro tonos del tinta, que se turnan cada 9 segundos. El cambio se hace cuadrito por cuadrito, en
 * orden al azar. Las imágenes ya vienen en cuadritos (public/hero), así que el navegador solo copia
 * pedazos de una sobre otra. Del lado del texto la foto se apaga para que el título se lea.
 *
 * Sin JavaScript, o hasta que carga, se ve la primera como fondo fijo. Con "reducir movimiento" queda
 * fija la que salió al azar, y con la pestaña oculta no cambia.
 */
const IMAGENES = ['/hero/mosaico-plaza.png', '/hero/mosaico-anglo.png']

/** Lado del cuadrito dentro de la imagen (las imágenes están al doble: 6 px en pantalla). */
const CELDA = 12
const PAUSA = 9000
const DURACION = 1300

export function FondoPixelado() {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = lienzo.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const web = matchMedia('(min-width: 1024px)')
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches

    const cache = new Map<string, Promise<HTMLImageElement>>()
    const cargar = (src: string) => {
      let p = cache.get(src)
      if (!p) {
        p = new Promise((ok, mal) => {
          const im = new Image()
          im.onload = () => ok(im)
          im.onerror = mal
          im.src = src
        })
        cache.set(src, p)
      }
      return p
    }

    let actual = Math.floor(Math.random() * IMAGENES.length)
    let geo = { s: 1, x: 0, y: 0, W: 0, H: 0 }
    let animando = false
    let cuadro = 0
    let vivo = true

    // Igual que background-size: cover con la imagen apoyada a la derecha
    const medir = (im: HTMLImageElement) => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(2, devicePixelRatio || 1)
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      const W = canvas.width
      const H = canvas.height
      const s = Math.max(W / im.width, H / im.height)
      return { s, x: W - im.width * s, y: (H - im.height * s) / 2, W, H }
    }
    const capa = (im: HTMLImageElement) => {
      const c = document.createElement('canvas')
      c.width = geo.W
      c.height = geo.H
      c.getContext('2d')?.drawImage(im, geo.x, geo.y, im.width * geo.s, im.height * geo.s)
      return c
    }

    const pintar = async () => {
      if (!web.matches) return
      const im = await cargar(IMAGENES[actual])
      if (!vivo) return
      cancelAnimationFrame(cuadro)
      animando = false
      geo = medir(im)
      ctx.drawImage(capa(im), 0, 0)
      canvas.style.opacity = '1'
    }

    const siguiente = async () => {
      if (animando || document.hidden || !web.matches) return
      const prox = (actual + 1) % IMAGENES.length
      const im = await cargar(IMAGENES[prox])
      if (!vivo) return
      const nueva = capa(im)
      // Los cuadritos de las dos imágenes coinciden; se revelan en un orden al azar
      const paso = CELDA * geo.s
      const x0 = (geo.x % paso) - paso
      const y0 = (geo.y % paso) - paso
      const celdas: [number, number][] = []
      for (let y = y0; y < geo.H; y += paso)
        for (let x = x0; x < geo.W; x += paso) celdas.push([x, y])
      for (let i = celdas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[celdas[i], celdas[j]] = [celdas[j], celdas[i]]
      }
      animando = true
      let hechas = 0
      const t0 = performance.now()
      const paso1 = (t: number) => {
        const p = Math.min(1, (t - t0) / DURACION)
        // Arranca y termina suave
        const hasta = Math.round(celdas.length * p * p * (3 - 2 * p))
        for (; hechas < hasta; hechas++) {
          const [x, y] = celdas[hechas]
          ctx.drawImage(nueva, x, y, paso + 1, paso + 1, x, y, paso + 1, paso + 1)
        }
        if (p < 1) cuadro = requestAnimationFrame(paso1)
        else {
          actual = prox
          animando = false
        }
      }
      cuadro = requestAnimationFrame(paso1)
    }

    void pintar()
    const reloj = quieto ? undefined : setInterval(() => void siguiente(), PAUSA)
    let espera: ReturnType<typeof setTimeout> | undefined
    const alCambiarTamano = () => {
      clearTimeout(espera)
      espera = setTimeout(() => void pintar(), 150)
    }
    addEventListener('resize', alCambiarTamano)
    web.addEventListener('change', alCambiarTamano)

    return () => {
      vivo = false
      clearInterval(reloj)
      clearTimeout(espera)
      cancelAnimationFrame(cuadro)
      removeEventListener('resize', alCambiarTamano)
      web.removeEventListener('change', alCambiarTamano)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
      <div className="absolute inset-0 bg-[url(/hero/mosaico-plaza.png)] bg-cover bg-right [mask-image:linear-gradient(90deg,transparent_18%,#000_48%)]">
        <canvas ref={lienzo} className="absolute inset-0 size-full opacity-0" />
      </div>
      {/* Velo: oscuro donde va el texto, abierto donde está la figura */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(19_22_29/0.6)_30%,rgb(19_22_29/0.25)_52%,transparent_70%)]" />
    </div>
  )
}
