String shellQuote(String value) {
  return "'${value.replace("'", "'\"'\"'")}'"
}

void runNodeInDocker(String workspaceDir, String command) {
  String nodeImage = 'node:20'
  String cacheVolume = "splitchill-npm-cache-${workspaceDir.replaceAll('[^a-zA-Z0-9_.-]', '-')}"
  String isolatedCommand = "rm -rf /workspace/node_modules && ${command}"

  sh(
    label: "node:20 ${workspaceDir}",
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

source_dir="\$PWD/${workspaceDir}"
test -d "\$source_dir" || {
  echo "ERROR: expected directory not found: \$source_dir"
  exit 1
}

echo "Preparing Docker image: ${nodeImage}"
if ! docker image inspect ${nodeImage} >/dev/null 2>&1; then
  attempt=1
  while [ "\$attempt" -le 3 ]; do
    echo "Pulling ${nodeImage} (attempt \$attempt/3)..."
    if timeout 10m docker pull ${nodeImage}; then
      break
    fi
    attempt=\$((attempt + 1))
    if [ "\$attempt" -le 3 ]; then
      sleep \$((attempt * 5))
    fi
  done

  if ! docker image inspect ${nodeImage} >/dev/null 2>&1; then
    echo "ERROR: failed to pull ${nodeImage}"
    exit 1
  fi
fi

container_id=""
cleanup() {
  if [ -n "\$container_id" ]; then
    docker rm -f "\$container_id" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

container_id=\$(docker create \\
  --network host \\
  -e CI=true \\
  -e HOME=/tmp/node-home \\
  -e npm_config_cache=/tmp/npm-cache \\
  -e npm_config_audit=false \\
  -e npm_config_fund=false \\
  -e npm_config_progress=false \\
  -e npm_config_fetch_retries=5 \\
  -e npm_config_fetch_retry_mintimeout=20000 \\
  -e npm_config_fetch_retry_maxtimeout=120000 \\
  -e npm_config_fetch_timeout=120000 \\
  -e npm_config_network_timeout=240000 \\
  -v ${cacheVolume}:/tmp/npm-cache \\
  -w /workspace \\
  ${nodeImage} sh -lc ${shellQuote(isolatedCommand)})

echo "Copying source into container..."
docker cp "\$source_dir/." "\$container_id:/workspace"

echo "Running verification inside container..."
timeout 600 docker start -a "\$container_id"

exit_code=\$(docker inspect "\$container_id" --format '{{.State.ExitCode}}')
exit "\$exit_code"
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
    timeout(time: 30, unit: 'MINUTES')
  }

  parameters {
    string(
      name: 'CI_DOCKER_REGISTRY',
      defaultValue: '',
      description: 'Optional registry host'
    )
  }

  environment {
    APP_NAME = 'splitchill'
    SERVER_IMAGE_NAME = 'splitchill/server'
    CLIENT_IMAGE_NAME = 'splitchill/client'
    DOCKER_CLIENT_TIMEOUT = '300'
    COMPOSE_HTTP_TIMEOUT = '300'
  }

  stages {

    stage('Checkout') {
      options {
        timeout(time: 5, unit: 'MINUTES')
      }
      steps {
        sh '''
#!/bin/sh
set -eu

git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
'''

        retry(5) {
          checkout([
            $class: 'GitSCM',
            branches: [[name: '*/main']],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[$class: 'CloneOption', noTags: true, shallow: true, depth: 1]],
            submoduleCfg: [],
            userRemoteConfigs: [[url: 'https://github.com/singhharshitt/SplitChill']]
          ])
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
      options {
        timeout(time: 2, unit: 'MINUTES')
      }
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

echo "Jenkins runtime user: $(id)"
echo "DOCKER_HOST=${DOCKER_HOST:-default}"

case "${DOCKER_HOST:-}" in
  unix://*)
    docker_socket="${DOCKER_HOST#unix://}"
    if [ ! -S "$docker_socket" ]; then
      echo "ERROR: Docker socket does not exist or is not a socket: $docker_socket"
      ls -la "$(dirname "$docker_socket")" || true
      exit 1
    fi

    echo "Docker socket permissions:"
    ls -l "$docker_socket"

    if [ ! -w "$docker_socket" ]; then
      echo "ERROR: Jenkins cannot write to Docker socket: $docker_socket"
      echo "Fix docker-compose.jenkins.yml so DinD starts with --group=jenkins and recreate the Jenkins stack."
      exit 1
    fi
    ;;
esac

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

    stage('Client Verify') {
      options {
        timeout(time: 15, unit: 'MINUTES')
      }
      steps {
        script {
          retry(2) {
            runNodeInDocker(
              'client',
              'npm ci --no-audit --no-fund && npm run lint && npm run build'
            )
          }
        }
      }
    }

    stage('Server Verify') {
      options {
        timeout(time: 10, unit: 'MINUTES')
      }
      steps {
        script {
          retry(2) {
            runNodeInDocker(
              'server',
              'npm ci --no-audit --no-fund && node --check index.js && find src -name "*.js" -exec node --check {} \\; && npm test'
            )
          }
        }
      }
    }

    stage('Docker Compose Validation') {
      options {
        timeout(time: 2, unit: 'MINUTES')
      }
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
      options {
        timeout(time: 15, unit: 'MINUTES')
      }
      steps {

        sh '''
#!/bin/sh
set -eu

docker build --network host \
  --target production \
  -t "splitchill/server:ci-${IMAGE_TAG}" \
  server

docker build --network host \
  --target production \
  -t "splitchill/client:ci-${IMAGE_TAG}" \
  client
'''
      }
    }
  }

  post {

    always {
      script {
        sh '''
#!/bin/sh

if [ -n "${IMAGE_TAG:-}" ] && command -v docker >/dev/null 2>&1; then
  docker image rm \
    "splitchill/server:ci-${IMAGE_TAG}" \
    "splitchill/client:ci-${IMAGE_TAG}" \
    >/dev/null 2>&1 || true
fi
'''

        cleanWs(notFailBuild: true)
      }
    }

    failure {
      echo 'Pipeline failed before deployment completed.'
    }
  }
}