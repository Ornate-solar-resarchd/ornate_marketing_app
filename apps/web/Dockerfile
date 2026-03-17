# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS build
WORKDIR /app

# Copy dependency tree from deps stage
COPY --from=deps /app ./

# Copy all source files
COPY packages/types ./packages/types
COPY apps/web ./apps/web
COPY tsconfig.json ./

# Build args for Next.js (NEXT_PUBLIC_ vars must be present at build time)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure public dir exists (Next.js standalone needs it)
RUN mkdir -p apps/web/public

RUN cd apps/web && npx next build

# ---- Production ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (may be empty but dir must exist)
COPY --from=build /app/apps/web/public ./apps/web/public

# Copy standalone output (includes server.js + node_modules)
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
