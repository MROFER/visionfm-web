'use client'

// Último recurso: falló el layout del sitio (por ejemplo, la base no responde). No puede usar los estilos
// del sitio, así que repite la página 500 estática (public/errores/500.html) con estilos en línea.
export default function ErrorGlobal({ reset }: { reset: () => void }) {
  return (
    <html lang="es-UY">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', color: '#13161d', background: '#fff' }}>
        <main style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 16px' }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#c03a0b' }}>
            Error 500
          </span>
          <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(34px, 7vw, 64px)', lineHeight: 1.02, fontWeight: 800, letterSpacing: '-.02em' }}>
            Volvemos enseguida
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.6, color: '#3b3f48', maxWidth: 620 }}>
            El sitio tiene un problema técnico y ya estamos trabajando para resolverlo. Probá de nuevo en unos minutos.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 28, minHeight: 52, padding: '0 24px', border: 0, background: '#c03a0b', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Probar de nuevo
          </button>
        </main>
      </body>
    </html>
  )
}
