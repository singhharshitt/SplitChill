pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    APP_NAME = 'splitchill'
    REGISTRY = "${env.DOCKER_REGISTRY ?: ''}"
    REGISTRY_CREDS = 'docker-registry-credentials'
    SERVER_IMAGE_NAME = 'splitchill/server'
    CLIENT_IMAGE_NAME = 'splitchill/client'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_SHORT_SHA = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
          env.IMAGE_TAG = "${env.BRANCH_NAME}-${env.GIT_SHORT_SHA}".replaceAll('[^a-zA-Z0-9_.-]', '-')
        }
      }
    }

    stage('Lint') {
      parallel {
        stage('Client Lint') {
          steps {
            dir('client') {
              sh 'npm ci'
              sh 'npm run lint'
            }
          }
        }

        stage('Server Static Checks') {
          steps {
            dir('server') {
              sh 'npm ci'
              sh 'node --check index.js'
              sh "find src -name '*.js' -print0 | xargs -0 -n1 node --check"
            }
          }
        }
      }
    }

    stage('Test') {
      steps {
        dir('server') {
          sh 'npm test'
        }
      }
    }

    stage('Build') {
      steps {
        dir('client') {
          sh 'npm run build'
        }
      }
    }

    stage('Docker Build Validation') {
      steps {
        sh 'docker build --target production -t splitchill/server:ci-${IMAGE_TAG} server'
        sh 'docker build --target production -t splitchill/client:ci-${IMAGE_TAG} client'
      }
    }

    stage('Push Images') {
      when {
        allOf {
          branch 'main'
          expression { return (env.REGISTRY ?: '').trim() }
        }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.REGISTRY_CREDS, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
          sh 'echo "$DOCKER_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_USERNAME" --password-stdin'
          sh 'docker tag splitchill/server:ci-${IMAGE_TAG} ${REGISTRY}/${SERVER_IMAGE_NAME}:${IMAGE_TAG}'
          sh 'docker tag splitchill/server:ci-${IMAGE_TAG} ${REGISTRY}/${SERVER_IMAGE_NAME}:latest'
          sh 'docker tag splitchill/client:ci-${IMAGE_TAG} ${REGISTRY}/${CLIENT_IMAGE_NAME}:${IMAGE_TAG}'
          sh 'docker tag splitchill/client:ci-${IMAGE_TAG} ${REGISTRY}/${CLIENT_IMAGE_NAME}:latest'
          sh 'docker push ${REGISTRY}/${SERVER_IMAGE_NAME}:${IMAGE_TAG}'
          sh 'docker push ${REGISTRY}/${SERVER_IMAGE_NAME}:latest'
          sh 'docker push ${REGISTRY}/${CLIENT_IMAGE_NAME}:${IMAGE_TAG}'
          sh 'docker push ${REGISTRY}/${CLIENT_IMAGE_NAME}:latest'
          sh 'docker logout "$REGISTRY" || true'
        }
      }
    }

    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        withCredentials([string(credentialsId: 'render-deploy-hook-url', variable: 'RENDER_DEPLOY_HOOK_URL')]) {
          sh 'test -n "$RENDER_DEPLOY_HOOK_URL"'
          sh 'curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"'
        }
      }
    }
  }

  post {
    always {
      cleanWs(deleteDirs: true, disableDeferredWipeout: true)
    }
    failure {
      echo 'Pipeline failed before deployment completed. Existing production release remains unchanged.'
    }
  }
}
