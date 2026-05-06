# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

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
CMD ["npx", "tsx", "src/index.ts"]
