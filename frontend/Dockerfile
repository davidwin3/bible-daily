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

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy PWA files to root
COPY --from=build /app/frontend/dist/manifest.json /usr/share/nginx/html/
COPY --from=build /app/frontend/dist/sw.js /usr/share/nginx/html/

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user
RUN adduser -S nginx-user -u 1001 -G nginx-user

# Change ownership of nginx directories
RUN chown -R nginx-user:nginx-user /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
