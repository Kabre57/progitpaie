# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Image de production autonome Next.js 16 / Node 24
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:24.15-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copie des artefacts précompilés par le script de déploiement (deploy-local.sh)
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs .build/rotation/scripts/rotate-encryption-key.js ./scripts/rotate-encryption-key.js
COPY --chown=nextjs:nodejs .build/rotation/lib/crypto.js ./lib/crypto.js
COPY --chown=nextjs:nodejs .build/rotation/lib/db.js ./lib/db.js

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
