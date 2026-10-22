# VPS image for the Mamlaq web app and the ShelfAware worker.
# Secrets stay in the runtime environment. Do not copy .env or service-account.json.
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/webapp
COPY webapp/package.json webapp/package-lock.json ./
RUN npm ci
COPY webapp ./
# Placeholder so prisma generate / next build do not read a live database or a real secret.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN npx prisma generate && npm run build

FROM base AS web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]

FROM base AS worker
COPY shelfaware-agent /app/shelfaware-agent
COPY shelfaware-health /app/shelfaware-health
RUN npm ci --omit=dev --prefix /app/shelfaware-agent \
  && pip3 install --break-system-packages --no-cache-dir -r /app/shelfaware-health/requirements.txt
ENV NODE_ENV=production
ENV SHELFAWARE_AGENT_DIR=/app/shelfaware-agent
ENV SHELFAWARE_HEALTH_DIR=/app/shelfaware-health
WORKDIR /app/webapp
CMD ["npx", "tsx", "scripts/shelfaware-vps-worker.ts"]
