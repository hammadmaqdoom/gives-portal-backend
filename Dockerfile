# Production-ready multi-stage Dockerfile for NestJS backend

FROM node:22.17.1-alpine AS base
WORKDIR /app
RUN apk add --no-cache bash netcat-openbsd

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

EXPOSE 3000
CMD ["bash","-lc","until nc -z ${DATABASE_HOST:-pgbouncer} ${DATABASE_PORT:-6432}; do echo waiting for DB...; sleep 1; done; npm run migration:run && npm run start:prod"]
