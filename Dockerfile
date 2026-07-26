# STAGE 1: Dependency Installation & Application Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate

# Copy package manifests and lockfile
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy application source files
COPY . .

# Build production Angular distribution bundle
RUN pnpm run build

# STAGE 2: Lightweight Production Web Server
FROM nginx:alpine-slim

# Copy custom nginx static server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist/nidhiFlow-frontend/browser /usr/share/nginx/html

# Grant ownership to non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
