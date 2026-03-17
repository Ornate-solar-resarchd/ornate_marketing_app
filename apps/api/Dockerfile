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
WORKDIR /app

# Copy dependency tree from deps stage
COPY --from=deps /app ./

# Copy all source files
COPY packages/types ./packages/types
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build TypeScript
RUN cd apps/api && npx tsc

# ---- Production ----
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy node_modules (includes prisma CLI for migrations)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy shared types (needed at runtime)
COPY --from=build /app/packages/types ./packages/types

# Copy compiled JS output
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

# Copy generated Prisma client (pnpm hoists it to root node_modules)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy package files
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/tsconfig.json ./apps/api/

ENV NODE_ENV=production
EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/apps/api/src/index.js"]
