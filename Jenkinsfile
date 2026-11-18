pipeline {
  agent any

  tools {
    nodejs 'NodeJS-22'
  }

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    DEPLOY_HOST = '138.2.102.241'
    DEPLOY_USER = 'ubuntu'
    DEPLOY_DIR = '/app/BusWeb'
    SERVICE_NAME = 'next-bus-app'
  }

  stages {
    stage('Build') {
      steps {
        sh '''
          set -eu
          npm ci
          npm run build

          mkdir -p .next/standalone/.next .next/standalone/public
          cp -R .next/static/. .next/standalone/.next/static/
          cp -R public/. .next/standalone/public/
        '''
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ['prod-server-ssh']) {
          sh '''
            set -eu

            tar -C .next/standalone -czf - . | \
              ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
                "$DEPLOY_USER@$DEPLOY_HOST" \
                "mkdir -p '$DEPLOY_DIR' && tar -xzf - -C '$DEPLOY_DIR'"

            ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
              "$DEPLOY_USER@$DEPLOY_HOST" \
              "set -eu
               sudo -n systemctl restart '$SERVICE_NAME'
               sudo -n systemctl is-active --quiet '$SERVICE_NAME'"
          '''
        }
      }
    }
  }
}