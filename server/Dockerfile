# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true

FROM base AS deps
COPY package*.json ./
RUN apk add --no-cache git
RUN npm ci

FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS prod-deps
COPY package*.json ./
RUN apk add --no-cache git
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./
COPY index.js ./
COPY src ./src
EXPOSE 5000
CMD ["npm", "start"]