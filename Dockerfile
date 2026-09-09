# ═══════════════════════════════════════════════════════════════════════════════
# PROGITPAIE — Image de production autonome Next.js 16 / Node 24
# Les artefacts sont pré-compilés sur l'hôte (deploy-local.sh) avec symlinks
# résolus. Ce Dockerfile copie uniquement les fichiers réels sans symlinks.
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:24.15-alpine AS runner
WORKDIR /app

# Sécurité & hardening
RUN apk upgrade --no-cache \
  && apk add --no-cache libc6-compat openssl \
  && rm -rf /usr/local/lib/node_modules/npm \
  && rm -rf /usr/local/bin/npm /usr/local/bin/npx \
  && rm -rf /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg \
  && rm -rf /usr/local/bin/corepack

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Les artefacts standalone sont copiés depuis l'hôte.
# Les symlinks Windows ont été résolus par deploy-local.sh avant ce COPY.
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs .build/rotation/scripts/rotate-encryption-key.js ./scripts/rotate-encryption-key.js
COPY --chown=nextjs:nodejs .build/rotation/lib/crypto.js ./lib/crypto.js
COPY --chown=nextjs:nodejs .build/rotation/lib/db.js ./lib/db.js

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
