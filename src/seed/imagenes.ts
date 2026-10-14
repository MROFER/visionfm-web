import sharp from 'sharp'

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Imagen de ejemplo: un degradé con un título, del tamaño pedido. */
export function imagenDeEjemplo(ancho: number, alto: number, titulo: string, color: string) {
  const tamano = Math.round(Math.min(alto * 0.28, (ancho / Math.max(titulo.length, 8)) * 1.6))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#111"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-weight="700" font-size="${tamano}"
    text-anchor="middle" dominant-baseline="middle">${escapar(titulo)}</text>
</svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer()
}

/**
 * Un MP3 válido de unos segundos de silencio (MPEG-1 capa III, 128 kbps, 44,1 kHz),
 * para las entrevistas de ejemplo sin depender de un archivo de audio en el repo.
 */
export function silencioMp3(segundos = 5) {
  const cuadro = Buffer.alloc(417)
  cuadro.set([0xff, 0xfb, 0x90, 0x64])
  const cuadros = Math.ceil((segundos * 44100) / 1152)
  return Buffer.concat(Array.from({ length: cuadros }, () => cuadro))
}
