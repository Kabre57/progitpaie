# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Image de production autonome Next.js 16 / Node 24
# Multi-stage build garantissant la portabilité Windows / Linux / VPS
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:24.15-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Dépendances
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# 2. Construction
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm prisma:generate
RUN pnpm build
RUN pnpm exec tsc --project tsconfig.rotation.json || true

# 3. Exécution
FROM node:24.15-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.build/rotation/scripts/rotate-encryption-key.js ./scripts/rotate-encryption-key.js
COPY --from=builder --chown=nextjs:nodejs /app/.build/rotation/lib/crypto.js ./lib/crypto.js
COPY --from=builder --chown=nextjs:nodejs /app/.build/rotation/lib/db.js ./lib/db.js

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
