# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-bookworm-slim

# ---- deps: install all dependencies and generate the Prisma client ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# bcrypt is a native module — build tools cover the case where no
# prebuilt binary matches this platform and it has to compile from source.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Full install (incl. devDependencies) — the "prisma" CLI is a devDependency
# and postinstall runs `prisma generate` against prisma/schema.
RUN npm ci

# ---- runtime: minimal image that actually serves traffic ----
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Coolify's own healthcheck runs `curl`/`wget` via `docker exec`, independent
# of the HEALTHCHECK instruction below — needs to be present even though the
# app itself never calls out to it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY src ./src
# Generated Prisma client lands in src/generated/prisma (see prisma/schema/base.prisma).
# Copied after `src` so it isn't clobbered by the host's src/ (which doesn't contain it).
COPY --from=deps /app/src/generated ./src/generated
# Kept for running `prisma migrate deploy` from inside the container if needed.
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts

RUN chown -R node:node /app
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
