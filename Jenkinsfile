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
  exit 127
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Jenkins cannot reach the Docker daemon."
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
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  parameters {
    string(
      name: 'CI_DOCKER_REGISTRY',
      defaultValue: '',
      description: 'Optional registry host'
    )

    booleanParam(
      name: 'PUSH_IMAGES',
      defaultValue: false,
      description: 'Push Docker images'
    )

    booleanParam(
      name: 'DEPLOY_RENDER',
      defaultValue: false,
      description: 'Trigger Render deployment'
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
        sh '''
#!/bin/sh
set -eu

git config --global http.lowSpeedLimit 1000
git config --global http.lowSpeedTime 60
git config --global http.version HTTP/1.1
'''

        retry(3) {
          checkout scm
        }

        script {
          String branchName = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'local'

          env.GIT_SHORT_SHA = sh(
            script: 'git rev-parse --short=12 HEAD',
            returnStdout: true
          ).trim()

          env.IMAGE_TAG = "${branchName}-${env.GIT_SHORT_SHA}"
            .replaceAll('[^a-zA-Z0-9_.-]', '-')

          env.EFFECTIVE_DOCKER_REGISTRY =
            (params.CI_DOCKER_REGISTRY ?: env.DOCKER_REGISTRY ?: '')
            .trim()
            .replaceAll('/+$', '')

          echo "Image tag: ${env.IMAGE_TAG}"
        }
      }
    }

    stage('Jenkins Runtime Preflight') {
      steps {

        sh '''
#!/bin/sh
set -eu

command -v git >/dev/null || {
  echo "ERROR: git missing"
  exit 127
}

command -v docker >/dev/null || {
  echo "ERROR: docker missing"
  exit 127
}

docker version
docker info >/dev/null

if docker compose version >/dev/null 2>&1; then
  docker compose version
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose --version
else
  echo "ERROR: docker compose missing"
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
              runNodeInDocker(
                'client',
                'npm ci && npm run lint'
              )
            }
          }
        }

        stage('Server Static Checks') {
          steps {
            script {
              runNodeInDocker(
                'server',
                'npm ci && node --check index.js'
              )
            }
          }
        }

      }
    }

    stage('Tests') {
      steps {
        script {
          runNodeInDocker(
            'server',
            'npm ci && npm test'
          )
        }
      }
    }

    stage('Frontend Build') {
      steps {
        script {
          runNodeInDocker(
            'client',
            'npm ci && npm run build'
          )
        }
      }
    }

    stage('Docker Compose Validation') {
      steps {

        sh '''
#!/bin/sh
set -eu

if docker compose version >/dev/null 2>&1; then
  docker compose -f docker-compose.yml config
  docker compose -f docker-compose.prod.yml config
else
  docker-compose -f docker-compose.yml config
  docker-compose -f docker-compose.prod.yml config
fi
'''
      }
    }

    stage('Docker Image Build') {
      steps {

        sh '''
#!/bin/sh
set -eu

docker build \
  --target production \
  -t "splitchill/server:ci-${IMAGE_TAG}" \
  server

docker build \
  --target production \
  -t "splitchill/client:ci-${IMAGE_TAG}" \
  client
'''
      }
    }

    stage('Push Images') {

      when {
        allOf {
          branch 'main'

          expression {
            return params.PUSH_IMAGES &&
              (env.EFFECTIVE_DOCKER_REGISTRY ?: '').trim()
          }
        }
      }

      steps {

        withCredentials([
          usernamePassword(
            credentialsId: env.REGISTRY_CREDS,
            passwordVariable: 'DOCKER_PASSWORD',
            usernameVariable: 'DOCKER_USERNAME'
          )
        ]) {

          sh '''
#!/bin/sh
set -eu

echo "$DOCKER_PASSWORD" |
docker login "$EFFECTIVE_DOCKER_REGISTRY" \
  -u "$DOCKER_USERNAME" \
  --password-stdin

docker tag \
  "splitchill/server:ci-${IMAGE_TAG}" \
  "${EFFECTIVE_DOCKER_REGISTRY}/${SERVER_IMAGE_NAME}:${IMAGE_TAG}"

docker tag \
  "splitchill/client:ci-${IMAGE_TAG}" \
  "${EFFECTIVE_DOCKER_REGISTRY}/${CLIENT_IMAGE_NAME}:${IMAGE_TAG}"

docker push \
  "${EFFECTIVE_DOCKER_REGISTRY}/${SERVER_IMAGE_NAME}:${IMAGE_TAG}"

docker push \
  "${EFFECTIVE_DOCKER_REGISTRY}/${CLIENT_IMAGE_NAME}:${IMAGE_TAG}"

docker logout "$EFFECTIVE_DOCKER_REGISTRY" || true
'''
        }
      }
    }

    stage('Deploy Render Hook') {

      when {
        allOf {
          branch 'main'

          expression {
            return params.DEPLOY_RENDER
          }
        }
      }

      steps {

        withCredentials([
          string(
            credentialsId: env.RENDER_DEPLOY_HOOK_CREDS,
            variable: 'RENDER_DEPLOY_HOOK_URL'
          )
        ]) {

          sh '''
#!/bin/sh
set -eu

curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
'''
        }
      }
    }
  }

  post {

    always {
      script {
        node {
          sh '''
#!/bin/sh

if command -v docker >/dev/null 2>&1; then
  docker image rm \
    "splitchill/server:ci-${IMAGE_TAG}" \
    "splitchill/client:ci-${IMAGE_TAG}" \
    >/dev/null 2>&1 || true
fi
'''

          deleteDir()
        }
      }
    }

    failure {
      echo 'Pipeline failed before deployment completed.'
    }
  }
}
