# syntax=docker/dockerfile:1
#
# De webapp is een statische bundel achter een kleine webserver die ook de
# beveiligingsheaders zet en /api doorstuurt naar de API.

FROM node:22.18-bookworm-slim AS build
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package.json package-lock.json ./
COPY packages/money/package.json packages/money/
COPY packages/accounting/package.json packages/accounting/
COPY packages/i18n/package.json packages/i18n/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts --workspace @gedmma/web --include-workspace-root
COPY packages ./packages
COPY apps/web ./apps/web
COPY tsconfig.base.json ./
RUN npm run --workspace @gedmma/web build

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O- http://127.0.0.1:8080/ >/dev/null || exit 1
