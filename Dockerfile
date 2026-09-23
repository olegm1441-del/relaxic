# syntax=docker/dockerfile:1
#
# Своя сборка вместо Nixpacks: тот подставлял --mount=type=cache
# в каждый шаг, и сборщик Railway падал на монтировании кеша.

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
# prisma/ копируется ДО npm ci. В package.json есть postinstall,
# который вызывает prisma generate, а без схемы он падает с
# «Could not find Prisma Schema» и роняет всю установку.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev --no-audit --no-fund
COPY . .
RUN npm run build

# ── Рантайм ──────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

# Только боевые зависимости. prisma лежит в dependencies намеренно:
# схему и демо-данные накатывает scripts/start.mjs уже в этом образе.
# Порядок тот же: схема раньше установки.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY prisma.config.ts next.config.ts ./
COPY scripts ./scripts
COPY public ./public
COPY --from=build /app/.next ./.next

EXPOSE 3000
CMD ["npm", "run", "start"]
