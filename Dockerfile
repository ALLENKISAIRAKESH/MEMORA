# Multi-stage Dockerfile for Memora
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json package-lock.json ./
COPY backend/package.json backend/tsconfig.json ./backend/
COPY frontend/package.json frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html ./frontend/

# Install dependencies
RUN npm install
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Copy source files
COPY backend/src ./backend/src
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public 2>/dev/null || true

# Build backend and frontend
RUN npm run build

# Production runtime image
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 4000

CMD ["node", "backend/dist/index.js"]
