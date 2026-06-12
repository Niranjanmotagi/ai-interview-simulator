# Build from the repo root:  docker build -f apps/web/Dockerfile .
# Uses Next.js standalone output for a minimal runtime image.

# ---- 1. Install all workspace dependencies ----------------------------------
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund

# ---- 2. Build ----------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/types ./packages/types
COPY apps/web ./apps/web
RUN npm run build -w packages/types && npm run build -w apps/web

# ---- 3. Runtime ----------------------------------------------------------------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

# Standalone bundle preserves the monorepo layout under .next/standalone.
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static

USER app
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
