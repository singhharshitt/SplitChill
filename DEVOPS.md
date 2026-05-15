# SplitChill DevOps and Release Guide

This guide describes the production-grade setup for Docker, Docker Compose, Jenkins CI/CD, and Render deployment.

## 1) Container Images

### Backend image
- File: `server/Dockerfile`
- Targets:
  - `development`: hot-reload friendly with `npm run dev`
  - `production`: minimal runtime with `npm ci --omit=dev`

### Frontend image
- File: `client/Dockerfile`
- Targets:
  - `development`: Vite dev server
  - `production`: multi-stage build + Nginx runtime
- Nginx config: `client/nginx.conf` (includes `/healthz` endpoint and SPA rewrite)

### Ignore files
- `server/.dockerignore`
- `client/.dockerignore`

## 2) Docker Compose

### Local development stack
- File: `docker-compose.yml`
- Services:
  - `mongo` (replica set enabled)
  - `redis`
  - `server` (development target, bind mount + nodemon)
  - `client` (development target, bind mount + Vite)
- Health checks:
  - Mongo replica set health
  - Redis ping
  - Server readiness (`/api/health/ready`)
  - Client availability

Run locally:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env

docker compose up --build
```

### Production-like local run
- File: `docker-compose.prod.yml`
- Uses production targets for server/client images.

Run production profile locally:

```bash
cp .env.example .env
# Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in .env

docker compose -f docker-compose.prod.yml up --build -d
```

## 3) Docker Build and Tagging

Use immutable tags for rollback-friendly releases.

```bash
set IMAGE_TAG=v1.0.0

docker build --target production -t splitchill/server:%IMAGE_TAG% server
docker build --target production -t splitchill/client:%IMAGE_TAG% client
```

Optional push:

```bash
docker tag splitchill/server:%IMAGE_TAG% my-registry/splitchill/server:%IMAGE_TAG%
docker tag splitchill/client:%IMAGE_TAG% my-registry/splitchill/client:%IMAGE_TAG%
docker push my-registry/splitchill/server:%IMAGE_TAG%
docker push my-registry/splitchill/client:%IMAGE_TAG%
```

## 4) Jenkins CI/CD

- File: `Jenkinsfile`
- Stages:
  1. Checkout and derive image tag from branch + commit SHA
  2. Lint
     - Frontend ESLint
     - Backend JS syntax checks
  3. Test (backend tests)
  4. Build (frontend production build)
  5. Docker build validation (`server` and `client` production images)
  6. Push images (main branch only, if registry is configured)
  7. Deploy (main branch only, Render deploy hook)

### Required Jenkins credentials and env
- Credentials:
  - `docker-registry-credentials` (username/password)
  - `render-deploy-hook-url` (secret text)
- Global environment variable:
  - `DOCKER_REGISTRY` (example: `ghcr.io/your-org`)

### PR vs main behavior
- Pull requests and non-main branches run validation only.
- `main` branch additionally pushes images (if registry configured) and triggers deploy.

## 5) Render Deployment

- File: `render.yaml`
- Services:
  - `splitchill-api` (Node web service)
  - `splitchill-client` (static web service)
  - `splitchill-redis` (managed Redis)
- Health check path: `/api/health/ready`
- Sensitive values are configured as Render secrets (`sync: false`), not committed.

Important: MongoDB must be provided via external connection string (`MONGO_URI`).

## 6) Environment and Secrets

### Root `.env` (Compose + CI local defaults)
- Based on `.env.example`
- Includes image tags, ports, Docker runtime variables.

### Server `.env`
- Based on `server/.env.example`
- Includes auth secrets, DB, Redis, AI/OCR/payment credentials.

### Client `.env`
- Based on `client/.env.example`
- Includes frontend API and socket URLs.

Security rules:
- Never commit real credentials.
- Keep production secrets in Jenkins credentials and Render secrets.
- Treat `.env` files as local-only unless explicitly managed by a secrets system.

## 7) Health, Readiness, and Startup Behavior

- Liveness: `GET /api/health`
- Readiness: `GET /api/health/ready`
- Compose startup waits for Mongo + Redis health before backend startup.
- Backend fails fast in production when startup dependencies (for example Mongo) are unavailable.

## 8) Troubleshooting

### Mongo container healthy but app not ready
- Ensure replica set is initialized by checking:
  - `docker compose logs mongo`
- Confirm `MONGO_URI` includes `?replicaSet=rs0`.

### Client cannot reach API in local Docker
- Verify `VITE_API_URL` and `VITE_SOCKET_URL` in root `.env`.
- Verify backend is healthy: `http://localhost:5000/api/health/ready`.

### Jenkins push stage skipped
- Expected if branch is not `main`.
- On `main`, ensure `DOCKER_REGISTRY` is set and `docker-registry-credentials` exists.

### Render deploy not triggered from Jenkins
- Ensure credential `render-deploy-hook-url` is configured in Jenkins.

## 9) Recommended Release Flow

1. Open PR -> Jenkins validates lint/test/build/docker build.
2. Merge to `main` -> Jenkins tags images with branch+SHA.
3. Jenkins pushes images and triggers Render deploy.
4. Verify `/api/health/ready` after deployment.
5. Roll back by redeploying an older immutable image tag if needed.
