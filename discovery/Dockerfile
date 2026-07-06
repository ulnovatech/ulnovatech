# Discovery Intelligence — multi-stage production image (ARM64 + AMD64)
# Targets: web (Next.js standalone), worker (job queue), migrate (one-shot db:migrate)

FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY modules ./modules
RUN pnpm install --frozen-lockfile

FROM deps AS builder
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Satisfy env validation during `next build` (runtime uses compose env_file).
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN pnpm build

# --- Next.js production server (port 3000) ---
FROM base AS web
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
RUN mkdir -p /app/storage/uploads && chown -R nextjs:nodejs /app/storage
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/dashboard/server.js"]

# --- Background job worker (shared deps + source) ---
FROM deps AS worker
ENV NODE_ENV=production
RUN mkdir -p /app/storage/uploads
CMD ["pnpm", "jobs:worker"]
