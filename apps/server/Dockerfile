# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm ci --only=production
# ts-node + typescript are now production deps (needed for seed at runtime)

# Stage 2: Build — cache-bust: 088c359
FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm ci
COPY apps/server/tsconfig.json ./
COPY apps/server/src ./src
COPY apps/server/prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules and compiled output
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# On every deploy: apply schema changes, seed questions (idempotent), then start server.
# --transpile-only --skip-project avoids tsconfig rootDir rejection of prisma/seed.ts
CMD ["sh", "-c", "node_modules/.bin/prisma db push --accept-data-loss && node_modules/.bin/ts-node --transpile-only --skip-project prisma/seed.ts && node dist/index.js"]
