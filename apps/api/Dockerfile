FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN pnpm --filter @biopropose/shared-types build
RUN pnpm --filter @biopropose/database build
RUN pnpm --filter api build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000 3001

CMD ["node", "apps/api/dist/index.js"]
