# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY apps/server/package*.json ./
RUN npm ci
COPY apps/server/tsconfig.json ./
COPY apps/server/src ./src
COPY apps/server/prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules and compiled output
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Run prisma db push on every deploy to apply schema changes, then start server.
# prisma binary is in production deps so it's available in this stage.
CMD ["sh", "-c", "node_modules/.bin/prisma db push && node dist/index.js"]
