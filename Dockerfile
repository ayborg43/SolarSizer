# syntax=docker/dockerfile:1

# ─── Stage 1: build the static site ──────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached unless the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle into /app/dist
COPY . .
RUN npm run build

# ─── Stage 2: serve the static files with nginx ──────────────────────────────
FROM nginx:alpine AS serve

# SPA-aware server config: history fallback, gzip, hashed-asset caching.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the build output.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Dokploy/Traefik route to this container; a simple GET / is enough to gate health.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null 2>&1 || exit 1

# nginx:alpine already runs `nginx -g 'daemon off;'`; stated explicitly for clarity.
CMD ["nginx", "-g", "daemon off;"]
