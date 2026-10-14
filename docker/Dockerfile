# Imagen de producción. La construye GitHub Actions y la publica en GHCR; el VPS solo la descarga (docs/02-trd.md).
FROM node:22.17.0-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# El build no se conecta a la base; estos valores solo evitan que la configuración falle al cargarse
RUN DATABASE_URL=postgres://build:build@localhost:5432/build PAYLOAD_SECRET=build pnpm build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD wget -qO- http://127.0.0.1:3000/api/salud || exit 1
# Las migraciones pendientes se aplican al arrancar (prodMigrations en payload.config.ts)
CMD ["node", "server.js"]
