// `pnpm migrar:wordpress`: trae las notas y las entrevistas del WordPress viejo a la base de este entorno.
//   --seco              solo informa, no escribe nada
//   --limite=20         procesa los primeros 20 posts (para probar); las entrevistas se saltean
//   --seccion=locales   sección de las notas cuya categoría no tiene equivalente
//   --programa=slug     programa de las entrevistas subidas a una hora sin programa al aire
// WORDPRESS_URL cambia el sitio de origen (por defecto, https://visionfm.com.uy).
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { enlacesDeAudios, importarEntrevistas, leerAudios } from './entrevistas'
import { importarNotas } from './importar'
import { clienteWordpress } from './wordpress'

const opcion = (nombre: string) =>
  process.argv.find((a) => a.startsWith(`--${nombre}=`))?.split('=')[1]

const origen = process.env.WORDPRESS_URL || 'https://visionfm.com.uy'
const seco = process.argv.includes('--seco')
const limite = Number(opcion('limite')) || undefined

function csv<T extends object>(filas: T[], columnas: (keyof T)[]) {
  const celda = (v: unknown) => {
    const texto = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v)
    return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  // Con BOM, para que Excel lea bien las tildes
  const lineas = [
    columnas.join(','),
    ...filas.map((f) => columnas.map((c) => celda(f[c])).join(',')),
  ]
  return '\uFEFF' + lineas.join('\r\n')
}

const payload = await getPayload({ config })
const registrar = (m: string) => payload.logger.info(m)
const cliente = clienteWordpress(origen)
registrar(`Migrando de ${origen}${seco ? ' (en seco: no se escribe nada)' : ''}`)

const audios = limite ? [] : await leerAudios(cliente)
const notas = await importarNotas(payload, {
  cliente,
  seccionPorDefecto: opcion('seccion') || 'locales',
  seco,
  limite,
  enlaceDeAudio: enlacesDeAudios(audios),
  registrar,
})
const entrevistas = await importarEntrevistas(payload, {
  cliente,
  audios,
  programaPorDefecto: opcion('programa'),
  seco,
  registrar,
})

const columnasNotas = [
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
const carpeta = path.join(process.cwd(), 'migracion-informe')
await mkdir(carpeta, { recursive: true })
await writeFile(path.join(carpeta, 'notas.csv'), csv(notas.filas, [...columnasNotas]))
await writeFile(
  path.join(carpeta, 'spam.csv'),
  csv(
    notas.filas.filter((f) => f.resultado === 'spam'),
    [...columnasNotas],
  ),
)
await writeFile(
  path.join(carpeta, 'entrevistas.csv'),
  csv(entrevistas.filas, [
    'id',
    'resultado',
    'motivo',
    'entrevistado',
    'programa',
    'nota',
    'audio',
  ]),
)
await writeFile(path.join(carpeta, 'sin-redireccion.txt'), notas.sinRedireccion.join('\n'))
await writeFile(
  path.join(carpeta, 'resumen.json'),
  JSON.stringify({ origen, seco, notas: notas.resumen, entrevistas: entrevistas.resumen }, null, 2),
)

const contar = (resumen: Record<string, number>) =>
  Object.entries(resumen)
    .map(([r, n]) => `${n} ${r}`)
    .join(', ')
registrar(`Notas: ${contar(notas.resumen)}.`)
registrar(`Entrevistas: ${contar(entrevistas.resumen)}. Informe en migracion-informe/.`)
process.exit(notas.resumen.error || entrevistas.resumen.error ? 1 : 0)
