// El clima de Fray Bentos para la cinta del encabezado en el celular. Open-Meteo es gratis y no pide
// clave; si no responde a tiempo, la cinta sigue sin el clima.
const URL_CLIMA =
  'https://api.open-meteo.com/v1/forecast?latitude=-33.13&longitude=-58.30&current=temperature_2m,weather_code&timezone=America%2FMontevideo'

/** Cada cuánto se vuelve a pedir, en segundos. */
const VIGENCIA = 30 * 60

export type Clima = { temperatura: number; estado: string }

/** El estado del cielo según el código WMO que devuelve Open-Meteo. */
export function estadoDelCielo(codigo: number): string {
  if (codigo === 0) return 'Despejado'
  if (codigo === 1) return 'Mayormente despejado'
  if (codigo === 2) return 'Parcialmente nublado'
  if (codigo === 3) return 'Nublado'
  if (codigo === 45 || codigo === 48) return 'Niebla'
  if (codigo >= 51 && codigo <= 57) return 'Llovizna'
  if (codigo >= 61 && codigo <= 67) return 'Lluvia'
  if (codigo >= 71 && codigo <= 77) return 'Nieve'
  if (codigo >= 80 && codigo <= 82) return 'Chaparrones'
  if (codigo >= 95) return 'Tormenta'
  return 'Variable'
}

export async function obtenerClima(buscar: typeof fetch = fetch): Promise<Clima | null> {
  try {
    const respuesta = await buscar(URL_CLIMA, {
      next: { revalidate: VIGENCIA },
      signal: AbortSignal.timeout(2500),
    } as RequestInit)
    if (!respuesta.ok) return null
    const datos = (await respuesta.json()) as {
      current?: { temperature_2m?: unknown; weather_code?: unknown }
    }
    const temperatura = datos.current?.temperature_2m
    const codigo = datos.current?.weather_code
    if (typeof temperatura !== 'number' || typeof codigo !== 'number') return null
    return { temperatura: Math.round(temperatura), estado: estadoDelCielo(codigo) }
  } catch {
    return null
  }
}
