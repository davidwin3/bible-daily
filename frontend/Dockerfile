# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10

# Set working directory
WORKDIR /app

# Copy workspace configuration and lock file from root
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files
COPY package.json ./
COPY frontend/package.json ./frontend/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY frontend/ ./frontend/
WORKDIR /app/frontend
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# Build stage
FROM base AS build

# Copy source code
COPY frontend/ ./frontend/

# Change to frontend directory and build
WORKDIR /app/frontend
RUN pnpm build

# Production stage - using nginx to serve static files
FROM nginx:alpine AS production

# Install curl for health checks and gettext for envsubst
RUN apk add --no-cache curl gettext

# Copy nginx configuration template
COPY frontend/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy built application from build stage
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy PWA files to root
COPY --from=build /app/frontend/dist/manifest.json /usr/share/nginx/html/
COPY --from=build /app/frontend/dist/sw.js /usr/share/nginx/html/

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user
RUN adduser -S nginx-user -u 1001 -G nginx-user

# Create necessary directories first (before switching to non-root user)
RUN mkdir -p /var/www/certbot /etc/ssl/certs /etc/ssl/private

# Create startup script
RUN cat > /docker-entrypoint.sh << 'EOF'
#!/bin/sh
set -e

# Set default values for environment variables
export DOMAIN=${DOMAIN:-"_"}
export ADDITIONAL_DOMAINS=${ADDITIONAL_DOMAINS:-""}
export SSL_CERT_PATH=${SSL_CERT_PATH:-"/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"}
export SSL_KEY_PATH=${SSL_KEY_PATH:-"/etc/letsencrypt/live/${DOMAIN}/privkey.pem"}
export USE_LETSENCRYPT=${USE_LETSENCRYPT:-"true"}

# Ensure directories exist (in case they were not mounted properly)
mkdir -p /var/www/certbot /etc/ssl/certs /etc/ssl/private 2>/dev/null || true

# Check if Let's Encrypt certificates exist
if [ "$USE_LETSENCRYPT" = "true" ] && [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
    echo "Using Let's Encrypt certificates..."
elif [ -f "/etc/ssl/custom/cert.pem" ] && [ -f "/etc/ssl/custom/key.pem" ]; then
    echo "Using custom certificates..."
    export SSL_CERT_PATH="/etc/ssl/custom/cert.pem"
    export SSL_KEY_PATH="/etc/ssl/custom/key.pem"
else
    echo "No valid certificates found. Generating self-signed certificate..."
    export SSL_CERT_PATH="/etc/ssl/certs/nginx-selfsigned.crt"
    export SSL_KEY_PATH="/etc/ssl/private/nginx-selfsigned.key"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_KEY_PATH" \
        -out "$SSL_CERT_PATH" \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=Bible Daily/CN=${DOMAIN}"
    chmod 600 "$SSL_KEY_PATH"
    chmod 644 "$SSL_CERT_PATH"
fi

# Substitute environment variables in nginx config
envsubst '${DOMAIN} ${ADDITIONAL_DOMAINS} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Test nginx configuration
nginx -t

# Ensure proper ownership of runtime directories
chown -R nginx-user:nginx-user /var/cache/nginx /var/run /var/log/nginx /var/www/certbot 2>/dev/null || true

# Start nginx
exec nginx -g "daemon off;"
EOF

# Make the script executable
RUN chmod +x /docker-entrypoint.sh

# Install openssl for self-signed certificate generation
RUN apk add --no-cache openssl

# Change ownership of nginx directories and certbot directory
RUN chown -R nginx-user:nginx-user /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html /var/www/certbot /etc/ssl/certs /etc/ssl/private

# Note: We don't switch to non-root user here because we need root privileges 
# to create directories and manage SSL certificates in the entrypoint script
# The nginx process itself will run as nginx-user

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || curl -k -f https://localhost:443 || exit 1

# Start nginx with environment variable substitution
CMD ["/docker-entrypoint.sh"]
