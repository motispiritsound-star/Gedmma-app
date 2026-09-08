# The API image. Built from the repository root because the API depends on
# @buurklus/shared through the npm workspace: a build context of apps/api alone
# cannot see the package it imports.
#
#   docker build -t buurklus-api .
#   docker run -p 4000:4000 --env-file .env buurklus-api

FROM node:20-slim AS build
WORKDIR /app

# openssl is what Prisma links against when it generates its query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# The manifests first, so a change to the source does not invalidate the
# dependency layer.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --workspace @buurklus/shared --workspace @buurklus/api --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run db:generate --workspace @buurklus/api \
    && npm run build --workspace @buurklus/shared \
    && npm run build --workspace @buurklus/api

# Drop everything the running server does not need: the TypeScript compiler,
# the test runner, the sources. The Prisma CLI stays — it is a dependency, not
# a devDependency, because the container runs the migrations itself on boot.
RUN npm prune --omit=dev

FROM node:20-slim AS run
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/package.json package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/prisma apps/api/prisma

# The image runs as an unprivileged user. node:20-slim ships one.
USER node
EXPOSE 4000

# Migrations run at boot rather than in the build, because the build has no
# database to talk to. `migrate deploy` only applies migrations that already
# exist — it never invents one and never drops a column.
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/server.js"]
