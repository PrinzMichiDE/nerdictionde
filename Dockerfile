# Stage 1: Dependencies
FROM node:20-alpine AS deps
# Update Alpine packages for security patches
RUN apk update && apk upgrade && apk add --no-cache libc6-compat && rm -rf /var/cache/apk/*
WORKDIR /app

# Install dependencies based on the preferred package manager
# Copy package files first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Update Alpine packages for security patches
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and Prisma schema for better caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install all dependencies (including devDependencies) for build
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
# Set dummy DATABASE_URL for build-time generation (not used for actual connection)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Update Alpine packages for security patches
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir -p .next && \
    chown -R nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Add labels for metadata
LABEL org.opencontainers.image.title="nerdictionde" \
      org.opencontainers.image.description="Next.js application with Prisma" \
      org.opencontainers.image.vendor="nerdictionde.de" \
      maintainer="nerdictionde.de"

# Start the application
CMD ["node", "server.js"]
