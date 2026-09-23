# syntax=docker/dockerfile:1
#
# Своя сборка вместо Nixpacks.
#
# Nixpacks подставлял в каждый шаг --mount=type=cache, и сборщик Railway
# падал на «error mounting /var/lib/buildkit/runc-overlayfs/...».
# Здесь кеш-монтирований нет вовсе, а версия Node задана образом,
# а не угадывается по файлам проекта.

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# openssl нужен Prisma для TLS к базе
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── Сборка ───────────────────────────────────────────────────
FROM base AS build
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

# ── Рантайм ──────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

# Только боевые зависимости. prisma лежит в dependencies намеренно:
# preDeployCommand выполняется в этом образе и вызывает prisma db push.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts next.config.ts ./
RUN npx prisma generate

COPY public ./public
COPY --from=build /app/.next ./.next

EXPOSE 3000
CMD ["npm", "run", "start"]
