FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install server dependencies
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/
RUN cd server && npm install && npx prisma generate

# 2. Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# 3. Copy source and build
COPY client/ ./client/
COPY server/ ./server/
RUN cd client && npm run build
RUN cd server && npm run build

# 4. Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

WORKDIR /app/server

EXPOSE 4000

CMD ["node", "dist/index.js"]
