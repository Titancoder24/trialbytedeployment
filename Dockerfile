# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_API_BASE_URL=https://trialbyte-backend.98h6kpq3ehd7c.us-east-1.cs.amazonlightsail.com
ENV EDGE_STORE_ACCESS_KEY=WsGbt6CQgaKg9rf1wI0H4kajWpMO61jS
ENV EDGE_STORE_SECRET_KEY=CGiULOMiYMXbBOD6zabKppHVi87dmho9VtRaZ3pvStaOzmac
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=https://trialbyte-backend.98h6kpq3ehd7c.us-east-1.cs.amazonlightsail.com
ENV EDGE_STORE_ACCESS_KEY=WsGbt6CQgaKg9rf1wI0H4kajWpMO61jS
ENV EDGE_STORE_SECRET_KEY=CGiULOMiYMXbBOD6zabKppHVi87dmho9VtRaZ3pvStaOzmac

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
