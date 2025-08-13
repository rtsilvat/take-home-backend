FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install dependencies (includes dev deps for building)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=development
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Bring full app (sources, dist, and node_modules with dev deps)
COPY --from=builder /app .

EXPOSE 3001
CMD ["npm", "run", "start:prod"]


