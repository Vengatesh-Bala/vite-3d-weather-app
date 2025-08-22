pipeline {
  agent any

  environment {
    IMAGE_NAME = '3d-weather-app'
    REGISTRY = '' // set your registry like docker.io/username or leave blank for local
    TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install & Build') {
      tools { nodejs 'node20' }
      steps {
        sh 'node -v'
        sh 'npm ci || npm install'
        sh 'npm run build'
        archiveArtifacts artifacts: 'dist/**', fingerprint: true
      }
    }

    stage('Docker Build') {
      steps {
        script {
          def img = sh(script: "docker build -t ${IMAGE_NAME}:${TAG} .", returnStatus: true)
          if (img != 0) { error 'Docker build failed' }
        }
      }
    }

    stage('Docker Push') {
      when { expression { return env.REGISTRY?.trim() }
      }
      steps {
        sh "docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}"
        sh "docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}"
      }
    }

    stage('Run (Preview)') {
      when { expression { return !env.REGISTRY?.trim() } }
      steps {
        sh 'docker rm -f 3d-weather-preview || true'
        sh "docker run -d --name 3d-weather-preview -p 8080:80 ${IMAGE_NAME}:${TAG}"
      }
    }
  }

  post {
    always {
      echo 'Build finished.'
    }
  }
}
