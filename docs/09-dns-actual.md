# DNS actual de `visionfm.com.uy`

Inventario de la fase 4 (docs/05-plan.md): lo que hoy responde el dominio, para que ningún registro se pierda en el cambio de la fase 6. Consultado el 17 de octubre de 2026 con el DNS público de Google (`dns.google`); no es la zona completa, solo los nombres que se pueden preguntar desde afuera.

## Lo que encontramos

| Nombre | Tipo | Valor | Para qué |
|---|---|---|---|
| `visionfm.com.uy` | NS | `nia.ns.cloudflare.com`, `lakas.ns.cloudflare.com` | La zona **ya está en Cloudflare**, en una cuenta que no sabemos de quién es |
| `visionfm.com.uy` | A | `172.67.202.233`, `104.21.14.114` | Sitio actual, pasando por el proxy de Cloudflare (no es la IP real del hosting) |
| `visionfm.com.uy` | AAAA | `2606:4700:3035::ac43:cae9`, `2606:4700:3034::6815:e72` | Ídem, IPv6 |
| `www.visionfm.com.uy` | A | las mismas dos IP | Sitio actual |
| `visionfm.com.uy` | MX | `0 _dc-mx.008a28fc133a.visionfm.com.uy` | Correo: lo recibe el hosting actual |
| `_dc-mx.008a28fc133a.visionfm.com.uy` | A | `216.246.47.9` | Servidor de correo del hosting |
| `mail.visionfm.com.uy` | A | `216.246.47.9` | Correo (IMAP/SMTP) |
| `webmail.visionfm.com.uy` | A | `216.246.47.9` | Webmail del hosting |
| `visionfm.com.uy` | TXT | `v=spf1 +a +mx include:relay.mailchannels.net ~all` | SPF: autoriza al hosting y a MailChannels |
| `default._domainkey.visionfm.com.uy` | TXT | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzYRMdia1VV6BwdBrC5qoVQ5etaUTnis…` (clave completa en el panel) | DKIM del correo del hosting |

No existen: `_dmarc` (no hay DMARC), CAA, `autodiscover`. El TXT de la raíz no tiene verificaciones de Google ni de Facebook; si Search Console está verificado, es por archivo HTML, etiqueta o Google Analytics (Site Kit).

## Qué cambia en la fase 6

1. **Quién maneja la zona.** Antes del cambio hay que saber qué cuenta de Cloudflare tiene hoy `visionfm.com.uy` (probablemente el hosting o quien hizo el sitio). Si la radio no la controla, el paso 4 de la guía de cuentas (docs/08) la agrega a la cuenta nueva de la radio y Cloudflare le asigna servidores nuevos; ese cambio se hace en el registrador (nic.com.uy). Antes de cambiar, se exporta la zona entera desde el panel actual: este inventario no ve los nombres que no se preguntaron.
2. **Correo: no se toca.** `MX`, `mail`, `webmail`, `_dc-mx…`, el SPF y el DKIM se copian tal cual a la zona nueva, con el proxy de Cloudflare apagado (nube gris) en los registros de correo. Si el hosting se da de baja, el correo se muda antes y aparte.
3. **SPF.** Se suma el remitente de los avisos del panel (Resend) sin sacar lo que está: `v=spf1 +a +mx include:relay.mailchannels.net include:amazonses.com ~all` (Resend envía por Amazon SES; confirmar el valor exacto en su panel). Con el sitio nuevo, `+a` pasa a autorizar la IP del VPS, que no manda correo: se puede dejar o cambiar por `+ip4:216.246.47.9`.
4. **DMARC nuevo.** Empieza en observación: `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:<casilla de la radio>`, y se endurece después de unas semanas de informes limpios.
5. **Sitio.** `@` y `www` pasan a apuntar al túnel de Cloudflare del VPS de la radio, con el proxy encendido.
