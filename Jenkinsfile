String shellQuote(String value) {
  return "'${value.replace("'", "'\"'\"'")}'"
}

void runNodeInDocker(String workspaceDir, String command) {
  sh(
    label: "node:20-alpine ${workspaceDir}",
    script: """#!/bin/sh
set -eu

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker CLI is not installed on this Jenkins agent."
  echo "Install Docker CLI or use the docker/jenkins image documented in DEVOPS.md."
  exit 127
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Jenkins cannot reach the Docker daemon."
  echo "Use docker-compose.jenkins.yml for the private DinD daemon, or attach an isolated Docker-capable build agent."
  exit 1
fi

if [ -n "\${DOCKER_HOST:-}" ]; then
  docker run --rm \\
    -v "\$PWD/${workspaceDir}:/workspace" \\
    --user "\$(id -u):\$(id -g)" \\
    -e CI=true \\
    -e HOME=/tmp \\
    -w /workspace \\
    node:20-alpine sh -lc ${shellQuote(command)}
elif [ -f /.dockerenv ]; then
  docker run --rm \\
    --volumes-from "\$HOSTNAME" \\
    --user "\$(id -u):\$(id -g)" \\
    -e CI=true \\
    -e HOME=/tmp \\
    -w "\$PWD/${workspaceDir}" \\
    node:20-alpine sh -lc ${shellQuote(command)}
else
  docker run --rm \\
    -v "\$PWD/${workspaceDir}:/workspace" \\
    --user "\$(id -u):\$(id -g)" \\
    -e CI=true \\
    -e HOME=/tmp \\
    -w /workspace \\
    node:20-alpine sh -lc ${shellQuote(command)}
fi
"""
  )
}

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  parameters {
    string(
      name: 'CI_DOCKER_REGISTRY',
      defaultValue: '',
      description: 'Optional registry host, for example ghcr.io/your-org. Leave empty to skip image push.'
    )
    booleanParam(
      name: 'PUSH_IMAGES',
      defaultValue: false,
      description: 'Push server/client images on main when CI_DOCKER_REGISTRY or DOCKER_REGISTRY is set.'
    )
    booleanParam(
      name: 'DEPLOY_RENDER',
      defaultValue: false,
      description: 'Trigger the Render deploy hook on main using Jenkins credential render-deploy-hook-url.'
    )
  }

  environment {
    APP_NAME = 'splitchill'
    SERVER_IMAGE_NAME = 'splitchill/server'
    CLIENT_IMAGE_NAME = 'splitchill/client'
    REGISTRY_CREDS = 'docker-registry-credentials'
    RENDER_DEPLOY_HOOK_CREDS = 'render-deploy-hook-url'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          String branchName = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'local'
          env.GIT_SHORT_SHA = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
          env.IMAGE_TAG = "${branchName}-${env.GIT_SHORT_SHA}".replaceAll('[^a-zA-Z0-9_.-]', '-')
          env.EFFECTIVE_DOCKER_REGISTRY = (params.CI_DOCKER_REGISTRY ?: env.DOCKER_REGISTRY ?: '').trim().replaceAll('/+$', '')

          echo "Image tag: ${env.IMAGE_TAG}"
          echo "Image push: ${params.PUSH_IMAGES && env.EFFECTIVE_DOCKER_REGISTRY ? 'enabled' : 'skipped'}"
          echo "Render deploy: ${params.DEPLOY_RENDER ? 'enabled' : 'skipped'}"
        }
      }
    }

    stage('Jenkins Runtime Preflight') {
      steps {
        sh '''#!/bin/sh
set -eu

echo "Checking Jenkins runtime tools..."
command -v git >/dev/null || { echo "ERROR: git is required on the Jenkins agent."; exit 127; }
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker CLI is required on the Jenkins agent."
  echo "Your log shows this Jenkins controller is still running the vanilla jenkins/jenkins:lts-jdk17 image."
  echo "Recreate Jenkins with this repo's Docker-enabled image:"
  echo "  docker compose -f docker-compose.jenkins.yml down"
  echo "  docker compose -f docker-compose.jenkins.yml up --build -d"
  exit 127
fi

docker version
docker info >/dev/null

if docker compose version >/dev/null 2>&1; then
  docker compose version
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose --version
else
  echo "ERROR: Docker Compose v2 plugin or docker-compose is required for compose validation."
  exit 127
fi
'''
      }
    }

    stage('Install, Lint, and Static Checks') {
      parallel {
        stage('Client Lint') {
          steps {
            script {
              runNodeInDocker('client', 'npm ci && npm run lint')
            }
          }
        }

        stage('Server Static Checks') {
          steps {
            script {
              runNodeInDocker('server', 'npm ci && node --check index.js && find src -name "*.js" -exec node --check {} \\;')
            }
          }
        }
      }
    }

    stage('Tests') {
      steps {
        script {
          runNodeInDocker('server', 'npm ci && npm test')
        }
      }
    }

    stage('Frontend Build') {
      steps {
        script {
          runNodeInDocker('client', 'npm ci && npm run build')
        }
      }
    }

    stage('Docker Compose Validation') {
      steps {
        sh '''#!/bin/sh
set -eu

if docker compose version >/dev/null 2>&1; then
  docker compose -f docker-compose.yml config >/tmp/splitchill-compose-dev.yml
  docker compose -f docker-compose.prod.yml config >/tmp/splitchill-compose-prod.yml
else
  docker-compose -f docker-compose.yml config >/tmp/splitchill-compose-dev.yml
  docker-compose -f docker-compose.prod.yml config >/tmp/splitchill-compose-prod.yml
fi

echo "Docker Compose files are valid."
'''
      }
    }

    stage('Docker Image Build') {
      steps {
        sh '''#!/bin/sh
set -eu

docker build --target production --label "org.opencontainers.image.revision=${GIT_COMMIT:-unknown}" -t "splitchill/server:ci-${IMAGE_TAG}" server
docker build --target production --label "org.opencontainers.image.revision=${GIT_COMMIT:-unknown}" -t "splitchill/client:ci-${IMAGE_TAG}" client
'''
      }
    }

    stage('Push Images') {
      when {
        allOf {
          branch 'main'
          expression { return params.PUSH_IMAGES && (env.EFFECTIVE_DOCKER_REGISTRY ?: '').trim() }
        }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.REGISTRY_CREDS, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
          sh '''#!/bin/sh
set -eu

echo "$DOCKER_PASSWORD" | docker login "$EFFECTIVE_DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin

docker tag "splitchill/server:ci-${IMAGE_TAG}" "${EFFECTIVE_DOCKER_REGISTRY}/${SERVER_IMAGE_NAME}:${IMAGE_TAG}"
docker tag "splitchill/server:ci-${IMAGE_TAG}" "${EFFECTIVE_DOCKER_REGISTRY}/${SERVER_IMAGE_NAME}:latest"
docker tag "splitchill/client:ci-${IMAGE_TAG}" "${EFFECTIVE_DOCKER_REGISTRY}/${CLIENT_IMAGE_NAME}:${IMAGE_TAG}"
docker tag "splitchill/client:ci-${IMAGE_TAG}" "${EFFECTIVE_DOCKER_REGISTRY}/${CLIENT_IMAGE_NAME}:latest"

docker push "${EFFECTIVE_DOCKER_REGISTRY}/${SERVER_IMAGE_NAME}:${IMAGE_TAG}"
docker push "${EFFECTIVE_DOCKER_REGISTRY}/${SERVER_IMAGE_NAME}:latest"
docker push "${EFFECTIVE_DOCKER_REGISTRY}/${CLIENT_IMAGE_NAME}:${IMAGE_TAG}"
docker push "${EFFECTIVE_DOCKER_REGISTRY}/${CLIENT_IMAGE_NAME}:latest"

docker logout "$EFFECTIVE_DOCKER_REGISTRY" || true
'''
        }
      }
    }

    stage('Deploy Render Hook') {
      when {
        allOf {
          branch 'main'
          expression { return params.DEPLOY_RENDER }
        }
      }
      steps {
        withCredentials([string(credentialsId: env.RENDER_DEPLOY_HOOK_CREDS, variable: 'RENDER_DEPLOY_HOOK_URL')]) {
          sh '''#!/bin/sh
set -eu

test -n "$RENDER_DEPLOY_HOOK_URL"
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
'''
        }
      }
    }
  }

  post {
    always {
      sh '''#!/bin/sh
docker image rm "splitchill/server:ci-${IMAGE_TAG}" "splitchill/client:ci-${IMAGE_TAG}" >/dev/null 2>&1 || true
'''
      deleteDir()
    }
    failure {
      echo 'Pipeline failed before deployment completed. Existing production release remains unchanged.'
    }
  }
}
