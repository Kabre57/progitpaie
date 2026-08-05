# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Dockerfile de Production Next.js 16 (Multi-Stage Standalone) 🚀
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Phase 1 : Installation des dépendances
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Phase 2 : Build de l'application et génération du client Prisma
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build
RUN npx tsc --project tsconfig.rotation.json

# Phase 3 : Execution Runner NGINX / Node Standalone
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.build/rotation/scripts/rotate-encryption-key.js ./scripts/rotate-encryption-key.js
COPY --from=builder --chown=nextjs:nodejs /app/.build/rotation/lib/crypto.js ./lib/crypto.js
COPY --from=builder --chown=nextjs:nodejs /app/.build/rotation/lib/db.js ./lib/db.js

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
