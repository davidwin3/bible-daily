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
COPY backend/package.json ./backend/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY backend/ ./backend/
WORKDIR /app/backend
EXPOSE 3000
CMD ["pnpm", "start:dev"]

# Build stage
FROM base AS build

# Copy source code
COPY backend/ ./backend/

# Change to backend directory and build
WORKDIR /app/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy workspace configuration and package files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY backend/package.json ./backend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --filter backend

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/backend/dist ./backend/dist

# Copy necessary files
COPY --chown=nestjs:nodejs backend/tsconfig.json ./backend/

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Change to backend directory
WORKDIR /app/backend

# Start the application
CMD ["node", "dist/main"]
