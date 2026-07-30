# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --no-frozen-lockfile

# ---- Production ----
FROM base AS runner
WORKDIR /app

# Copy everything from deps (node_modules with pnpm)
COPY --from=deps /app ./

# Copy source files
COPY packages/types ./packages/types
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Generate Prisma client for linux-musl-arm64
ENV PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh
RUN cd apps/api && npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

WORKDIR /app/apps/api
# On container start, sync the Prisma schema to the DB before booting the API.
# This project uses the `prisma db push` workflow (no migration files), so this
# is the equivalent of FAT's `manage.py migrate` — schema changes apply on deploy
# automatically. If db push exits non-zero (e.g. a destructive change without
# --accept-data-loss), the container fails to start, surfacing the problem
# instead of silently drifting. Client is already generated at build time.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx src/index.ts"]
