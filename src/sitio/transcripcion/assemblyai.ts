// Transcripción de audio con AssemblyAI (https://www.assemblyai.com/docs): se sube el audio, se pide la
// transcripción en español con quién habla, y se espera a que termine. La clave va en
// ASSEMBLYAI_API_KEY, en el .env del servidor; sin clave no se transcribe nada.

const API = 'https://api.assemblyai.com/v2'

export type Frase = { hablante: string; texto: string }
export type Resultado = { frases: Frase[]; segundos: number | null }

type Opciones = {
  /** Entre consulta y consulta mientras transcribe. */
  espera?: number
  /** Cuánto esperar como mucho a que termine. */
  limite?: number
  fetch?: typeof fetch
}

export const claveDeTranscripcion = () => process.env.ASSEMBLYAI_API_KEY?.trim() || ''

/** El audio va como una URL que el servicio puede bajar (la firmada de R2) o como los bytes. */
export async function transcribir(
  audio: { url: string } | { datos: Uint8Array },
  clave: string,
  { espera = 5000, limite = 60 * 60_000, fetch: pedir = fetch }: Opciones = {},
): Promise<Resultado> {
  const llamar = async (ruta: string, init?: RequestInit) => {
    const respuesta = await pedir(`${API}${ruta}`, {
      ...init,
      headers: { authorization: clave, ...init?.headers },
    })
    const cuerpo = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok) {
      throw new Error(`AssemblyAI respondió ${respuesta.status}: ${cuerpo.error ?? 'sin detalle'}`)
    }
    return cuerpo
  }

  const audioUrl =
    'url' in audio
      ? audio.url
      : (
          await llamar('/upload', {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream' },
            body: audio.datos as BodyInit,
          })
        ).upload_url
  const { id } = await llamar('/transcript', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ audio_url: audioUrl, language_code: 'es', speaker_labels: true }),
  })

  const hasta = Date.now() + limite
  for (;;) {
    const t = await llamar(`/transcript/${id}`)
    if (t.status === 'completed') {
      const frases: Frase[] = (t.utterances ?? []).map((u: { speaker: string; text: string }) => ({
        hablante: u.speaker,
        texto: u.text,
      }))
      if (!frases.length && t.text) frases.push({ hablante: 'A', texto: t.text })
      return { frases, segundos: typeof t.audio_duration === 'number' ? t.audio_duration : null }
    }
    if (t.status === 'error')
      throw new Error(`AssemblyAI no pudo transcribir: ${t.error ?? 'sin detalle'}`)
    if (Date.now() > hasta) throw new Error('AssemblyAI tardó demasiado en transcribir.')
    await new Promise((r) => setTimeout(r, espera))
  }
}
