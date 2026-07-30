# ================================
# 1. Base Stage
# ================================
FROM node:22-slim AS base

RUN apt-get update && apt-get install -y \
    libpixman-1-0 \
    libcairo2 \
    libpango1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
WORKDIR /usr/src/app
RUN chown nodejs:nodejs /usr/src/app

# ================================
# 2. Dependencies Stage (dev + prod)
# ================================
FROM base AS dependencies

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    libpixman-1-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Install all dependencies (including dev) for the build to work properly.
RUN npm ci

# ================================
# 3. Build Stage
# ================================
FROM dependencies AS build

COPY --chown=nodejs:nodejs . .
RUN npm run build

# ================================
# 4. Production Stage
# ================================
FROM base AS production

# نسخ فقط الملفات المطلوبة لتشغيل التطبيق
COPY --from=dependencies --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /usr/src/app/package*.json ./
COPY --from=build --chown=nodejs:nodejs /usr/src/app/dist ./dist

USER nodejs

# The app listens on HTTP_PORT (3777 by default), not 3000.
EXPOSE 3777

# Hits the real /health liveness route on the correct port. start-period gives
# the migration step time to finish before health is enforced.
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.HTTP_PORT || 3777) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run pending migrations, then start. Two separate CMD lines do NOT run in
# sequence — Docker only honours the last one, so the previous migration CMD
# was dead and the schema was never migrated on deploy.
# `&&` means a failed migration aborts the boot instead of starting the app
# against a schema it does not match.
CMD ["sh", "-c", "npm run migration:run:prod && node dist/src/main.js"]
