pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    DEPLOY_HOST = '138.2.102.241'
    DEPLOY_USER = 'ubuntu'
    DEPLOY_DIR = '/app/BusWeb'
  }

  stages {
    stage('Deploy') {
      steps {
        sshagent(credentials: ['prod-server-ssh']) {
          sh '''
            set -eu
            if [ "$DEPLOY_HOST" = "YOUR_SERVER" ]; then
              echo "Set DEPLOY_HOST in the Jenkinsfile before deploying."
              exit 1
            fi

            ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
              "$DEPLOY_USER@$DEPLOY_HOST" \
              "set -eu
               cd '$DEPLOY_DIR'
               git pull --ff-only origin main
               npm ci
               npm run build
               sudo -n systemctl restart next-bus-app
               sudo -n systemctl is-active --quiet next-bus-app"
          '''
        }
      }
    }
  }
}