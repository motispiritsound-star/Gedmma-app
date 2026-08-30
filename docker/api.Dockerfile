# syntax=docker/dockerfile:1
#
# De API draait TypeScript rechtstreeks op Node 22; er is geen buildstap nodig.
# De container draait als een gewone gebruiker en bevat geen ontwikkeltooling.

FROM node:22.18-bookworm-slim AS deps
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package.json package-lock.json ./
COPY packages/money/package.json packages/money/
COPY packages/accounting/package.json packages/accounting/
COPY packages/i18n/package.json packages/i18n/
COPY apps/api/package.json apps/api/
# --ignore-scripts: geen willekeurige postinstall-scripts in de bouwomgeving.
RUN npm ci --omit=dev --ignore-scripts --workspace @gedmma/api --include-workspace-root

FROM node:22.18-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN mkdir -p /data/opslag && chown -R node:node /data /app
USER node

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/src/index.ts"]
