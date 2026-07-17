FROM node:20-alpine AS base
WORKDIR /app

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ─── Production image ────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads outputs logs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
