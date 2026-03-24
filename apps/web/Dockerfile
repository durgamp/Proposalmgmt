FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

# Pass API URL for production build
ARG VITE_API_URL=http://localhost:3000
ARG VITE_WS_URL=ws://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN pnpm --filter @biopropose/shared-types build
RUN pnpm --filter web build

# Production: nginx to serve the built static files
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
