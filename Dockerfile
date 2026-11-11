FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public migrations
# These non-secret values only satisfy env validation while Next compiles;
# runtime settings come from .env.production through Compose.
RUN DATABASE_URI=postgres://build:build@localhost:5432/build \
    PAYLOAD_SECRET=build-only-placeholder-secret-not-for-runtime \
    ADMIN_EMAIL=admin@build.invalid \
    ADMIN_PASSWORD=build-only-placeholder-password \
    NEXT_PUBLIC_SITE_URL=https://dev.akarun.site \
    NODE_ENV=production pnpm build

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && mkdir -p /app/media /app/.next \
    && chown -R nextjs:nodejs /app/media /app/.next

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Keep the Payload CLI/config available for one-off migration commands.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/seed-assets ./seed-assets

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
