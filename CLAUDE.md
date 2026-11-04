# Visión FM

La documentación del proyecto está en [`docs/`](docs/README.md) y el diseño aprobado en [`design/`](design/LEEME.md).

## Skills: solo a pedido

Las skills de [`.claude/skills/`](.claude/skills/FUENTES.md) no se usan por iniciativa propia.

- Una skill corre solo si Maximiliano la nombra en su mensaje, por ejemplo `/impeccable critique del inicio`. Si no la nombra, se sigue con el diseño aprobado y se trabaja como siempre.
- Ninguna skill corre sola ni llama a otra por su cuenta.
- Las de diseño (Impeccable y las de Emil Kowalski) primero muestran la crítica y los bocetos. El código se toca recién con el OK explícito de Maximiliano, y en un PR aparte.
- Las de seguridad y de revisión (Trail of Bits, Cloudflare, `mp-review`, `vercel-react-best-practices`) entregan una lista de hallazgos. Cada arreglo va en su propio PR, con el OK de Maximiliano.
- Impeccable va sin su hook, sin subagentes y sin su lanzador. Cuando Maximiliano pida un rediseño con Impeccable, el primer paso es `/impeccable document`, que escribe `DESIGN.md` a partir del diseño aprobado, para no inventar otro.
