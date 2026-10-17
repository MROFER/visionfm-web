# Guía de cuentas para la radio · Visión 96.5 FM

Para la fase 6 (traspaso). Versión visual con casillas para marcar: https://claude.ai/artifact/TpfoVgF5EWz5duiCeNh5KU

Reglas: los pasos van en orden; nunca se mandan contraseñas por WhatsApp ni email, cada cuenta invita a la agencia; todas las claves van al gestor de contraseñas del dueño.

| # | Cuenta | Quién | Costo aprox. | Nos mandan |
|---|---|---|---|---|
| 1 | Gmail de la radio para las cuentas, con verificación en dos pasos y códigos de respaldo impresos | dueño | gratis | la dirección |
| 2 | Bitwarden con ese email; contraseña maestra en papel; organización gratis compartida con el usuario de emergencia | dueño | gratis | nada |
| 3 | Acceso al registrador de `visionfm.com.uy` (WHOIS en nic.com.uy); si lo tiene un ex webmaster, pasar el contacto administrativo a la radio | dueño | renovación anual | nombre del registrador |
| 4 | Cloudflare: cuenta, sitio `visionfm.com.uy` en plan Free, invitar a la agencia como Administrator. El cambio de servidores DNS se hace juntos, después de revisar los registros (la zona ya está en otra cuenta de Cloudflare: ver `09-dns-actual.md`) | dueño + agencia | gratis | aviso de invitación |
| 5 | R2 activado en Cloudflare (pide tarjeta) | dueño | USD 0–2 | aviso |
| 6 | GitHub: cuenta con 2FA y organización Free (`visionfm-uy`); invitar a la agencia como Owner durante el traspaso | dueño | gratis | nombre de la organización |
| 7 | Hetzner Cloud: cuenta (puede pedir documento), pago, proyecto `Vision FM`, invitar a la agencia como Admin | dueño | USD 5–10/mes | aviso de invitación |
| 8 | Resend: cuenta, invitar a la agencia al equipo; la agencia carga SPF/DKIM/DMARC | dueño | gratis hasta 3.000/mes | aviso |
| 9 | Backblaze B2 con 2FA; clave compartida por Bitwarden | dueño | USD 0–1 | aviso |
| 10 | Lista de personas: Owner, usuario de emergencia, editores, periodistas, quién recibe alertas del stream, contacto del proveedor del stream | dueño | — | la lista |

Total mensual aproximado: USD 5–13 más impuestos (precios a octubre de 2026; verificarlos al hacer el traspaso).
