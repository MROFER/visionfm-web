# Skills del proyecto: de dónde salen

Todas quedan **solo a pedido**: cada `SKILL.md` lleva `disable-model-invocation: true` y `.claude/settings.json` las pone en `user-invocable-only`. Claude no las usa por su cuenta; corren solo si se nombran, por ejemplo `/impeccable critique del inicio`. La regla de uso está en el `CLAUDE.md` de la raíz.

Copiadas el 2026-11-04. Cada carpeta conserva la licencia de su origen.

| Skill | Repo | Commit | Licencia | Cambios nuestros |
|---|---|---|---|---|
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) `.claude/skills/impeccable` | `9fadc41729c3` | Apache 2.0 (`LICENSE`, `NOTICE.md`) | Sin el lanzador `scripts/impeccable` (bajaba un binario de GitHub y consultaba impeccable.style), sin los scripts del modo `live` y sin las guías de `hooks` y `live`. La skill sigue por su camino "Launcher unavailable": lee `PRODUCT.md` y `DESIGN.md` directamente. |
| `emil-design-eng`, `review-animations`, `improve-animations`, `animation-performance`, `mobile-native`, `break-ui` | [emilkowalski/skills](https://github.com/emilkowalski/skills) `skills/` | `f1090bec2771` | MIT | Ninguno, salvo el modo solo a pedido. |
| `insecure-defaults` | [trailofbits/skills](https://github.com/trailofbits/skills) `plugins/insecure-defaults` | `711af095215a` | CC BY-SA 4.0 | Era un comando de plugin: se armó `SKILL.md` a partir de `commands/audit.md`, con las rutas a esta carpeta. `references/` y `workflows/audit.js` sin cambios; sin las pruebas. |
| `supply-chain-risk-auditor` | [trailofbits/skills](https://github.com/trailofbits/skills) `plugins/supply-chain-risk-auditor` | `711af095215a` | CC BY-SA 4.0 | Sin las pruebas (`scripts/test_*.py`) ni `agents/openai.yaml`. |
| `security-audit` | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) `skills/security-audit` | `c1c8a8c14710` | MIT | Sin las pruebas (`*.test.cjs`). |
| `grill-me`, `domain-modeling`, `to-questionnaire`, `diagnosing-bugs` | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/` | `4ae2317ddb22` | MIT | `grill-me` lleva adentro el texto de `grilling`, porque llamaba a otra skill y eso no anda con skills solo a pedido. Sin `agents/openai.yaml`. |
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `skills/react-best-practices` | `1a2c79d4e6c4` | MIT (según su README) | Carpeta renombrada al nombre de la skill. |
| `mp-integrate`, `mp-webhooks`, `mp-test-setup`, `mp-review` | [mercadopago/mercadopago-claude-marketplace](https://github.com/mercadopago/mercadopago-claude-marketplace) `plugins/mercadopago` | `9815b7fe3769` | Apache 2.0 (`LICENSE`, `NOTICE`) | Los scripts `validate-*.mjs`, `detect-checkout-cta.mjs` y `resolve-checkout-cta.mjs` del plugin pasaron a `mp-integrate/scripts/`, y las rutas `${CLAUDE_PLUGIN_ROOT}` a `.claude/skills/`. Sin los hooks del plugin (avisos de versión y el control de claves al editar) ni su MCP. |
