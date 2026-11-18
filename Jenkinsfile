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

            release_path="$DEPLOY_DIR/releases/$BUILD_NUMBER"
            tar -C .next/standalone -czf - . | \
              ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
                "$DEPLOY_USER@$DEPLOY_HOST" \
                "mkdir -p '$release_path' && tar -xzf - -C '$release_path'"

            ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
              "$DEPLOY_USER@$DEPLOY_HOST" \
              "set -eu
               ln -sfn '$release_path' '$DEPLOY_DIR/.current-$BUILD_NUMBER'
               mv -Tf '$DEPLOY_DIR/.current-$BUILD_NUMBER' '$DEPLOY_DIR/current'
               sudo -n systemctl restart '$SERVICE_NAME'
               sudo -n systemctl is-active --quiet '$SERVICE_NAME'"
          '''
        }
      }
    }
  }
}