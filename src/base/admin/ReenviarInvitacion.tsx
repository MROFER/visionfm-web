'use client'

import { Button, toast, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

/** Botón en la ficha del usuario para mandarle de nuevo la invitación (por ejemplo, si venció el link). */
export function ReenviarInvitacion() {
  const { id } = useDocumentInfo()
  const {
    config: { routes, serverURL },
  } = useConfig()
  const [enviando, setEnviando] = useState(false)

  if (!id) return null

  const reenviar = async () => {
    setEnviando(true)
    try {
      const respuesta = await fetch(`${serverURL ?? ''}${routes.api}/usuarios/${id}/reenviar-invitacion`, {
        method: 'POST',
        credentials: 'include',
      })
      const cuerpo = (await respuesta.json()) as { mensaje?: string; error?: string }
      if (respuesta.ok) toast.success(cuerpo.mensaje ?? 'Invitación reenviada.')
      else toast.error(cuerpo.error ?? 'No se pudo reenviar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Button buttonStyle="secondary" size="small" onClick={reenviar} disabled={enviando}>
      {enviando ? 'Enviando…' : 'Reenviar invitación'}
    </Button>
  )
}
