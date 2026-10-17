// `pnpm migrar:wordpress`: trae las notas del WordPress viejo a la base de este entorno.
//   --seco             solo informa, no escribe nada
//   --limite=20        procesa los primeros 20 posts (para probar)
//   --seccion=locales  sección de las notas cuya categoría no tiene equivalente
// WORDPRESS_URL cambia el sitio de origen (por defecto, https://visionfm.com.uy).
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { importarNotas, type FilaInforme } from './importar'
import { clienteWordpress } from './wordpress'

const opcion = (nombre: string) =>
  process.argv.find((a) => a.startsWith(`--${nombre}=`))?.split('=')[1]

const origen = process.env.WORDPRESS_URL || 'https://visionfm.com.uy'
const seco = process.argv.includes('--seco')
const limite = Number(opcion('limite')) || undefined
const seccionPorDefecto = opcion('seccion') || 'locales'

const csv = (filas: FilaInforme[]) => {
  const columnas = [
    'id',
    'resultado',
    'motivo',
    'seccion',
    'ruta',
    'enlacesSpam',
    'avisos',
    'titulo',
    'enlace',
  ] as const
  const celda = (v: unknown) => {
    const texto = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v)
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  // Con BOM, para que Excel lea bien las tildes
  return (
    '\uFEFF' +
    [columnas.join(','), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(','))].join(
      '\r\n',
    )
  )
}

const payload = await getPayload({ config })
payload.logger.info(`Migrando notas de ${origen}${seco ? ' (en seco: no se escribe nada)' : ''}`)

const { filas, resumen, sinRedireccion } = await importarNotas(payload, {
  cliente: clienteWordpress(origen),
  seccionPorDefecto,
  seco,
  limite,
  registrar: (m) => payload.logger.info(m),
})

const carpeta = path.join(process.cwd(), 'migracion-informe')
await mkdir(carpeta, { recursive: true })
await writeFile(path.join(carpeta, 'notas.csv'), csv(filas))
await writeFile(path.join(carpeta, 'spam.csv'), csv(filas.filter((f) => f.resultado === 'spam')))
await writeFile(path.join(carpeta, 'sin-redireccion.txt'), sinRedireccion.join('\n'))
await writeFile(
  path.join(carpeta, 'resumen.json'),
  JSON.stringify({ origen, seco, resumen }, null, 2),
)

payload.logger.info(
  `Listo: ${Object.entries(resumen)
    .map(([r, n]) => `${n} ${r}`)
    .join(', ')}. Informe en migracion-informe/.`,
)
process.exit(resumen.error ? 1 : 0)
