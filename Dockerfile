# Production-ready multi-stage Dockerfile for NestJS backend

FROM node:22.17.1-alpine AS base
WORKDIR /app
RUN apk add --no-cache bash

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
COPY wait-for-it.sh /opt/wait-for-it.sh
RUN chmod +x /opt/wait-for-it.sh && sed -i 's/\r$//' /opt/wait-for-it.sh

EXPOSE 3000
CMD ["bash","-lc","/opt/wait-for-it.sh ${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432} && npm run migration:run && npm run start:prod"]
