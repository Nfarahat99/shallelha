# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm ci
COPY apps/server/tsconfig.json ./
COPY apps/server/src ./src
COPY apps/server/prisma ./prisma
RUN npx prisma generate
# seed.js pre-compiled and committed — no tsc step needed here
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
# seed.js is plain CommonJS — no ts-node required, no tsconfig issues.
CMD ["sh", "-c", "node_modules/.bin/prisma db push --accept-data-loss && node prisma/seed.js && node dist/index.js"]
