const ID = /^[\w-]{11}$/

/** Saca el ID de un video de YouTube de cualquier forma de link (watch, youtu.be, embed, shorts) o del ID solo. */
export function idDeYouTube(valor: string | null | undefined): string | null {
  const texto = (valor ?? '').trim()
  if (!texto) return null
  if (ID.test(texto)) return texto
  try {
    const url = new URL(texto)
    const host = url.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return ID.test(url.pathname.slice(1)) ? url.pathname.slice(1) : null
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v')
      if (v && ID.test(v)) return v
      const partes = url.pathname.split('/').filter(Boolean)
      if (['embed', 'shorts', 'live'].includes(partes[0]) && ID.test(partes[1] ?? ''))
        return partes[1]
    }
  } catch {
    return null
  }
  return null
}
