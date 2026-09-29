# Multi-stage Dockerfile for Memora
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json package-lock.json ./
COPY server/package.json server/tsconfig.json ./server/
COPY client/package.json client/tsconfig.json client/tsconfig.app.json client/tsconfig.node.json client/vite.config.ts client/index.html ./client/

# Install dependencies
RUN npm install
RUN npm install --prefix server
RUN npm install --prefix client

# Copy source files
COPY server/src ./server/src
COPY client/src ./client/src
COPY client/public ./client/public 2>/dev/null || true

# Build server and client
RUN npm run build

# Production runtime image
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
