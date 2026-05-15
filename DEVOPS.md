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
- Nginx config: `client/nginx.conf` includes `/healthz` and SPA fallback.

### Ignore files
- Root `.dockerignore`: keeps Jenkins image builds from sending local dependencies/secrets.
- `server/.dockerignore`
- `client/.dockerignore`

## 2) Docker Compose

### Local development stack
- File: `docker-compose.yml`
- Services: MongoDB replica set, Redis, Express server, Vite client.
- Health checks cover Mongo, Redis, server readiness, and client availability.

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

```bash
cp .env.example .env
# Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in .env

docker compose -f docker-compose.prod.yml up --build -d
```

## 3) Docker Build and Tagging

Use immutable tags for rollback-friendly releases.

```bash
export IMAGE_TAG=v1.0.0

docker build --target production -t splitchill/server:$IMAGE_TAG server
docker build --target production -t splitchill/client:$IMAGE_TAG client
```

Optional push:

```bash
docker tag splitchill/server:$IMAGE_TAG my-registry/splitchill/server:$IMAGE_TAG
docker tag splitchill/client:$IMAGE_TAG my-registry/splitchill/client:$IMAGE_TAG
docker push my-registry/splitchill/server:$IMAGE_TAG
docker push my-registry/splitchill/client:$IMAGE_TAG
```

## 4) Jenkins CI/CD

- File: `Jenkinsfile`
- Stages:
  1. Checkout and derive image tag from branch + commit SHA
  2. Jenkins runtime preflight (`git`, Docker CLI, Docker daemon, Docker Compose)
  3. Client lint and server static checks in `node:20-alpine`
  4. Backend tests
  5. Frontend production build
  6. Docker Compose validation
  7. Docker image build (`server` and `client` production targets)
  8. Optional image push
  9. Optional Render deploy hook

### Required Jenkins credentials and env
- Credentials:
  - `docker-registry-credentials` username/password or token, only required when `PUSH_IMAGES=true`
  - `render-deploy-hook-url` secret text, only required when `DEPLOY_RENDER=true`
- Optional global environment variable or build parameter:
  - `DOCKER_REGISTRY` / `CI_DOCKER_REGISTRY`, for example `ghcr.io/your-org`

### Jenkins runtime requirements

The Jenkinsfile intentionally does not use Jenkins' `docker.image(...).inside {}` DSL. This avoids `groovy.lang.MissingPropertyException: No such property: docker` when the Docker Pipeline plugin is missing or disabled.

Node-based steps run through Docker CLI using `node:20-alpine`, so the Jenkins executor does not need Node/npm preinstalled. Jenkins does need Docker CLI, Docker daemon access, and Docker Compose.

Supported Jenkins runtimes:
- Recommended: the included Jenkins + Docker-in-Docker Compose stack. Jenkins talks to a dedicated Docker daemon over the private Compose network and does not mount the host Docker socket.
- Production: an isolated Jenkins agent VM/container with Docker Engine installed. Treat that agent as disposable build infrastructure and do not run application workloads on it.

Recommended local Jenkins run with Docker Compose:

```bash
docker compose -f docker-compose.jenkins.yml up --build -d
```

The Compose stack includes `docker:29-dind` with a named Docker data volume. It avoids direct host socket control while still allowing Docker image builds inside CI.

Required Jenkins plugins:
- Pipeline (Workflow) and Pipeline: Groovy support
- Git Plugin
- Credentials Plugin
- Credentials Binding Plugin
- Pipeline Stage View

Optional Jenkins plugins:
- Docker Pipeline. The current Jenkinsfile does not require it, but it is safe to install.
- NodeJS. The current Jenkinsfile uses containerized Node instead.
- Workspace Cleanup. The current Jenkinsfile uses `deleteDir()` so cleanup still works without it.

Pipeline parameters:
- `CI_DOCKER_REGISTRY`: optional registry host. Overrides global `DOCKER_REGISTRY`.
- `PUSH_IMAGES`: when true on `main`, pushes immutable and `latest` tags.
- `DEPLOY_RENDER`: when true on `main`, triggers the Render deploy hook.

### PR vs main behavior
- Pull requests and non-main branches run validation only.
- `main` can additionally push images when `PUSH_IMAGES=true` and a registry is configured.
- `main` can additionally trigger Render when `DEPLOY_RENDER=true`.

## 5) Render Deployment

- File: `render.yaml`
- Services:
  - `splitchill-api` Node web service
  - `splitchill-client` static web service
  - `splitchill-redis` managed Redis
- Health check path: `/api/health/ready`
- Sensitive values are configured as Render secrets (`sync: false`), not committed.

Important: MongoDB must be provided via external connection string (`MONGO_URI`).

## 6) Environment and Secrets

### Root `.env`
- Based on `.env.example`
- Includes ports, Docker runtime values, image tags, and optional Jenkins local runner values.

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
- Backend fails fast in production when startup dependencies, for example MongoDB, are unavailable.

## 8) Troubleshooting

### Docker DSL error in Jenkins
- Symptom: `groovy.lang.MissingPropertyException: No such property: docker`.
- Fix: use the current Jenkinsfile, which uses Docker CLI instead of Docker Pipeline DSL.
- Optional: install Docker Pipeline plugin, but it is not required by this pipeline.

### Docker CLI missing in Jenkins
- Symptom: `docker: not found`.
- Fix: run Jenkins with `docker/jenkins/Dockerfile` or install Docker CLI and Docker Compose on the agent.

### Docker daemon unavailable
- Symptom: `Cannot connect to the Docker daemon`.
- Fix: use `docker-compose.jenkins.yml`, which starts a private `docker:29-dind` daemon and sets `DOCKER_HOST=tcp://docker:2375`.
- For production, use a dedicated isolated Jenkins build agent with its own Docker Engine.

### Jenkinsfile syntax validation
- Jenkins validates the declarative syntax before running the pipeline.
- For an explicit syntax check, use Jenkins' built-in linter endpoint from a configured Jenkins controller:

```bash
curl -sS -X POST -F "jenkinsfile=<Jenkinsfile" "$JENKINS_URL/pipeline-model-converter/validate"
```

### Jenkins push stage skipped
- Expected unless branch is `main`, `PUSH_IMAGES=true`, and registry is configured.

### Render deploy not triggered
- Expected unless branch is `main` and `DEPLOY_RENDER=true`.

## 9) Recommended Release Flow

1. Open PR -> Jenkins validates lint/test/build/docker build.
2. Merge to `main` -> Jenkins tags images with branch+SHA.
3. Run with `PUSH_IMAGES=true` to push release images.
4. Run with `DEPLOY_RENDER=true` to trigger Render deployment.
5. Verify `/api/health/ready` after deployment.
