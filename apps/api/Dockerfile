# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS build
COPY --from=deps /app ./
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build TypeScript (rootDir is ../.., so output goes to dist/apps/api/src and dist/packages/types)
RUN cd apps/api && npx tsc

# ---- Production ----
FROM node:20-alpine AS runner
WORKDIR /app

# Copy node_modules (production deps)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled JS
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema + generated client
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma

COPY apps/api/package.json ./apps/api/

ENV NODE_ENV=production
EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/apps/api/src/index.js"]
