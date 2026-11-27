'use client'

import { useEffect, useRef } from 'react'

import { useRadio } from '../reproductor/Radio'

/**
 * Fondo del hero del Inicio en web (desde 1024 px): fotos de Fray Bentos pasadas a cuadritos de 4 px en
 * cuatro tonos del tinta, que se turnan cada 9 segundos. El cambio se hace cuadrito por cuadrito, en
 * orden al azar. Las imágenes ya vienen en cuadritos (public/hero), así que el navegador solo copia
 * pedazos de una sobre otra. Del lado del texto la foto se apaga para que el título se lea.
 *
 * La composición está pensada para 1440 px: hasta ese ancho la imagen se achica junto con la pantalla
 * (se ve entera, con los cuadritos un poco más chicos), y en pantallas más anchas queda a 2556 × 568 y
 * centrada, así la figura cae siempre entre el título y la lista. Las imágenes se apagan solas en los
 * bordes, y el degradé del lado del texto acompaña el ancho.
 *
 * Cuando alguien da play y la radio empieza a sonar, sale del botón del hero una onda de cuadritos
 * naranja que recorre la foto y se apaga: la ciudad se enciende porque llegó la radio. Pasa una vez por
 * cada play; si la radio se reconecta sola después de un corte, no.
 *
 * Sin JavaScript, o hasta que carga, se ve la primera como fondo fijo. Con "reducir movimiento" queda
 * fija la que salió al azar y no hay onda, y con la pestaña oculta no cambia.
 */
/** Si se cambia una imagen, va con otro nombre: así el navegador y Cloudflare no muestran la vieja. */
const IMAGENES = ['/hero/plaza-4px.png', '/hero/anglo-4px.png']
const TINTA = '#031c3b'

/** Lado del cuadrito dentro de la imagen (las imágenes están al doble: 4 px en pantalla). */
const CELDA = 8
/** Las imágenes están al doble del tamaño en pantalla. */
const ESCALA = 0.5
/** Ancho para el que está armada la composición. */
const DISENO = 1440
const PAUSA = 9000
const DURACION = 1300
/** Lo que dura la onda naranja, de que sale del botón a que se apaga. */
const ONDA = 1700

/**
 * Los cuatro grises de las fotos pasados a brasa, del más claro al más oscuro: vivo-claro, acento, un
 * acento oscuro y tinta. Cada gris se reconoce por su verde (169, 113, 63 y 22).
 */
const BRASA: { verde: number; color: [number, number, number] }[] = [
  { verde: 141, color: [255, 154, 110] },
  { verde: 89, color: [192, 58, 11] },
  { verde: 43, color: [107, 36, 16] },
  { verde: 0, color: [19, 22, 29] },
]

/** Cuánto se enciende un cuadrito según lo que el anillo ya lo pasó: lleno en el frente y se apaga en la cola. */
const perfil = (u: number, frente: number, cola: number) =>
  u < 0 ? 0 : u < frente ? 1 : u < frente + cola ? 1 - (u - frente) / cola : 0
/** La onda sale rápido y frena al llegar a los bordes. */
const salida = (p: number) => 1 - Math.pow(1 - p, 2.2)

type Foto = { im: HTMLImageElement; brasa: Uint8ClampedArray }

/**
 * La foto en brasa, con un píxel por cuadrito: los cuadritos son de un solo color, así que alcanza con
 * achicarla sin suavizar. El canal alfa queda en 0; lo llena la onda en cada cuadro.
 */
function enBrasa(im: HTMLImageElement) {
  const cols = Math.ceil(im.width / CELDA)
  const filas = Math.ceil(im.height / CELDA)
  const c = document.createElement('canvas')
  c.width = cols
  c.height = filas
  const cc = c.getContext('2d', { willReadFrequently: true })
  if (!cc) return new Uint8ClampedArray(cols * filas * 4)
  cc.imageSmoothingEnabled = false
  cc.drawImage(im, 0, 0, cols, filas)
  const d = cc.getImageData(0, 0, cols, filas).data
  for (let k = 0; k < d.length; k += 4) {
    const { color } = BRASA.find(({ verde }) => d[k + 1] >= verde) ?? BRASA[BRASA.length - 1]
    d[k] = color[0]
    d[k + 1] = color[1]
    d[k + 2] = color[2]
    d[k + 3] = 0
  }
  return d
}

export function FondoPixelado() {
  const lienzo = useRef<HTMLCanvasElement>(null)
  /** Hace salir la onda. La arma el efecto del lienzo, que es el que sabe dónde está cada cuadrito. */
  const encender = useRef(() => {})
  const pidioPlay = useRef(false)
  const { sonando, cargando, reconectando } = useRadio()

  // La onda sale cuando la radio pasa de "Conectando…" a sonar por un play de la persona. Si la primera
  // conexión quedó colgada y hubo que reintentar, sale igual al sonar; una reconexión después de un corte
  // no cuenta como play.
  useEffect(() => {
    if (cargando) {
      if (!reconectando) pidioPlay.current = true
    } else if (sonando && pidioPlay.current) {
      pidioPlay.current = false
      encender.current()
    } else {
      pidioPlay.current = false
    }
  }, [sonando, cargando, reconectando])

  useEffect(() => {
    const canvas = lienzo.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const web = matchMedia('(min-width: 1024px)')
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches

    const cache = new Map<string, Promise<Foto>>()
    const cargar = (src: string) => {
      let p = cache.get(src)
      if (!p) {
        p = new Promise<HTMLImageElement>((ok, mal) => {
          const im = new Image()
          im.onload = () => ok(im)
          im.onerror = mal
          im.src = src
        }).then((im) => ({ im, brasa: enBrasa(im) }))
        cache.set(src, p)
      }
      return p
    }

    let actual = Math.floor(Math.random() * IMAGENES.length)
    let geo = { s: 1, x: 0, y: 0, W: 0, H: 0 }
    /** Lo que se ve sin la onda: la foto actual o, mientras cambia, la mezcla de las dos. */
    let base: HTMLCanvasElement | null = null
    /**
     * La onda, con un píxel por cuadrito: el color de brasa de lo que se ve y cuánto se enciende cada uno.
     * Se agranda sin suavizar sobre la foto, así queda en cuadritos. Solo se calculan los que se ven.
     */
    let onda: {
      lienzo: HTMLCanvasElement
      datos: ImageData
      ruido: Float32Array
      cols: number
      filas: number
      i0: number
      i1: number
      j0: number
      j1: number
    } | null = null
    let cambio: {
      nueva: HTMLCanvasElement
      brasa: Uint8ClampedArray
      celdas: [number, number][]
      hechas: number
      t0: number
      prox: number
    } | null = null
    let encendida: { x: number; y: number; max: number; t0: number } | null = null
    let cuadro = 0
    let vivo = true

    // Igual que el fondo de CSS: tamaño fijo, centrada
    const medir = (im: HTMLImageElement) => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(2, devicePixelRatio || 1)
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      const W = canvas.width
      const H = canvas.height
      const s = ESCALA * dpr * Math.min(1, r.width / DISENO)
      return { s, x: (W - im.width * s) / 2, y: (H - im.height * s) / 2, W, H }
    }
    const capa = (im: HTMLImageElement) => {
      const c = document.createElement('canvas')
      c.width = geo.W
      c.height = geo.H
      const cc = c.getContext('2d')
      if (cc) {
        // Fuera de la imagen va tinta, para que no asome el fondo de CSS de abajo
        cc.fillStyle = TINTA
        cc.fillRect(0, 0, geo.W, geo.H)
        cc.drawImage(im, geo.x, geo.y, im.width * geo.s, im.height * geo.s)
      }
      return c
    }
    const prepararOnda = ({ im, brasa }: Foto) => {
      const cols = Math.ceil(im.width / CELDA)
      const filas = Math.ceil(im.height / CELDA)
      const paso = CELDA * geo.s
      const mismo = onda && onda.cols === cols && onda.filas === filas
      const c = mismo ? onda!.lienzo : document.createElement('canvas')
      c.width = cols
      c.height = filas
      onda = {
        lienzo: c,
        datos: new ImageData(new Uint8ClampedArray(brasa), cols, filas),
        ruido: mismo ? onda!.ruido : Float32Array.from({ length: cols * filas }, Math.random),
        cols,
        filas,
        i0: Math.max(0, Math.floor(-geo.x / paso)),
        i1: Math.min(cols, Math.ceil((geo.W - geo.x) / paso)),
        j0: Math.max(0, Math.floor(-geo.y / paso)),
        j1: Math.min(filas, Math.ceil((geo.H - geo.y) / paso)),
      }
    }

    const pintar = async () => {
      if (!web.matches) return
      const foto = await cargar(IMAGENES[actual])
      if (!vivo) return
      cancelAnimationFrame(cuadro)
      cuadro = 0
      cambio = null
      encendida = null
      geo = medir(foto.im)
      base = capa(foto.im)
      prepararOnda(foto)
      ctx.drawImage(base, 0, 0)
      canvas.style.opacity = '1'
    }

    // Un paso del cambio de foto: copia a la base los cuadritos que tocan en este cuadro
    const pasoCambio = (t: number) => {
      if (!cambio || !base) return
      const bc = base.getContext('2d')
      if (!bc) return
      const p = Math.min(1, (t - cambio.t0) / DURACION)
      // Arranca y termina suave
      const hasta = Math.round(cambio.celdas.length * p * p * (3 - 2 * p))
      const paso = CELDA * geo.s
      const d = onda?.datos.data
      for (; cambio.hechas < hasta; cambio.hechas++) {
        const [x, y] = cambio.celdas[cambio.hechas]
        bc.drawImage(cambio.nueva, x, y, paso + 1, paso + 1, x, y, paso + 1, paso + 1)
        // La onda también toma el color del cuadrito nuevo
        if (!onda || !d) continue
        const i = Math.round((x - geo.x) / paso)
        const j = Math.round((y - geo.y) / paso)
        if (i < 0 || j < 0 || i >= onda.cols || j >= onda.filas) continue
        const k = (j * onda.cols + i) * 4
        d[k] = cambio.brasa[k]
        d[k + 1] = cambio.brasa[k + 1]
        d[k + 2] = cambio.brasa[k + 2]
      }
      if (p >= 1) {
        actual = cambio.prox
        base = cambio.nueva
        cambio = null
      }
    }

    // Dos anillos de cuadritos que salen del botón, el segundo más tenue, y se apagan al llegar a los bordes
    const pasoOnda = (t: number) => {
      if (!encendida || !onda) return false
      const p = (t - encendida.t0) / ONDA
      if (p >= 1) {
        encendida = null
        return false
      }
      const { datos, ruido, cols, i0, i1, j0, j1 } = onda
      const d = datos.data
      const paso = CELDA * geo.s
      const r1 = encendida.max * salida(Math.min(1, p / 0.8))
      const p2 = (t - encendida.t0 - 260) / ONDA
      const r2 = p2 > 0 ? encendida.max * salida(Math.min(1, p2 / 0.8)) : -1
      const fuerza = p < 0.5 ? 1 : Math.max(0, 1 - (p - 0.5) / 0.5)
      const frente = paso * 2
      const cola = paso * 11
      // Cada cuadrito se adelanta o se atrasa un poco, para que el borde no sea un círculo perfecto
      const salto = paso * 3.5
      for (let j = j0; j < j1; j++) {
        const dy = geo.y + (j + 0.5) * paso - encendida.y
        const dy2 = dy * dy
        for (let i = i0; i < i1; i++) {
          const k = j * cols + i
          const dx = geo.x + (i + 0.5) * paso - encendida.x
          const dist = Math.sqrt(dx * dx + dy2) + (ruido[k] - 0.5) * salto
          let a = perfil(r1 - dist, frente, cola)
          if (r2 > 0) a = Math.max(a, 0.6 * perfil(r2 - dist, frente, cola))
          a *= fuerza
          // Cuatro niveles, como los tonos de la foto
          d[k * 4 + 3] = a > 0.7 ? 255 : a > 0.42 ? 170 : a > 0.16 ? 85 : 0
        }
      }
      onda.lienzo.getContext('2d')?.putImageData(datos, 0, 0)
      return true
    }

    const dibujar = (t: number) => {
      if (!base) return
      ctx.drawImage(base, 0, 0)
      if (!onda || !pasoOnda(t)) return
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(onda.lienzo, geo.x, geo.y, onda.cols * CELDA * geo.s, onda.filas * CELDA * geo.s)
    }

    const enCuadro = (t: number) => {
      cuadro = 0
      if (cambio) pasoCambio(t)
      dibujar(t)
      if (cambio || encendida) cuadro = requestAnimationFrame(enCuadro)
    }
    const mover = () => {
      if (!cuadro) cuadro = requestAnimationFrame(enCuadro)
    }

    const siguiente = async () => {
      if (cambio || document.hidden || !web.matches || !base) return
      const prox = (actual + 1) % IMAGENES.length
      const { im, brasa } = await cargar(IMAGENES[prox])
      if (!vivo || cambio || !base) return
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
      cambio = { nueva: capa(im), brasa, celdas, hechas: 0, t0: performance.now(), prox }
      mover()
    }

    encender.current = () => {
      if (quieto || !base || !onda || !web.matches || document.hidden) return
      const r = canvas.getBoundingClientRect()
      if (!r.width || r.bottom <= 0 || r.top >= innerHeight) return
      // Sale del botón de play del hero, aunque el play se haya dado desde el de arriba
      const b = canvas.closest('section')?.querySelector('button[aria-pressed]')?.getBoundingClientRect()
      const cx = b ? b.left + b.width / 2 : r.left + r.width / 4
      const cy = b ? b.top + b.height / 2 : r.top + r.height / 2
      const k = geo.W / r.width
      const x = (Math.min(Math.max(cx, r.left), r.right) - r.left) * k
      const y = (Math.min(Math.max(cy, r.top), r.bottom) - r.top) * k
      const max = Math.max(
        Math.hypot(x, y),
        Math.hypot(geo.W - x, y),
        Math.hypot(x, geo.H - y),
        Math.hypot(geo.W - x, geo.H - y),
      )
      encendida = { x, y, max, t0: performance.now() }
      mover()
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
      encender.current = () => {}
      clearInterval(reloj)
      clearTimeout(espera)
      cancelAnimationFrame(cuadro)
      removeEventListener('resize', alCambiarTamano)
      web.removeEventListener('change', alCambiarTamano)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
      <div className="absolute inset-0 bg-[url(/hero/plaza-4px.png)] bg-[length:min(177.5vw,2556px)_auto] bg-center bg-no-repeat [mask-image:linear-gradient(90deg,transparent_max(18%,calc(50%-460px)),#000_max(48%,calc(50%-30px)))]">
        <canvas ref={lienzo} className="absolute inset-0 size-full opacity-0" />
      </div>
      {/* Velo: oscuro donde va el texto, abierto donde está la figura */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(3_28_59/0.6)_max(30%,calc(50%-290px)),rgb(3_28_59/0.25)_max(52%,calc(50%+30px)),transparent_max(70%,calc(50%+290px)))]" />
    </div>
  )
}
