# Build from the repo root:  docker build -f apps/api/Dockerfile .
# Multi-stage: full workspace install → compile → production-only image.

# ---- 1. Install all workspace dependencies ----------------------------------
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY apps/api/package.json apps/api/
RUN npm ci --no-audit --no-fund

# ---- 2. Compile shared types + API ------------------------------------------
FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/types ./packages/types
COPY apps/api ./apps/api
RUN npm run build -w packages/types && npm run build -w apps/api

# ---- 3. Production dependencies only ----------------------------------------
FROM node:20-alpine AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev --no-audit --no-fund

# ---- 4. Runtime --------------------------------------------------------------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /repo

# Non-root user: container compromise does not yield root.
RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY package.json ./
COPY --from=build /repo/packages/types/package.json ./packages/types/package.json
COPY --from=build /repo/packages/types/dist ./packages/types/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist

RUN mkdir -p /repo/apps/api/uploads && chown -R app:app /repo
USER app

EXPOSE 4000
WORKDIR /repo/apps/api
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/server.js"]
