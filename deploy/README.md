# Jenkins deployment for `next-bus-app`

Jenkins builds the Next.js application on its Linux executor and transfers the standalone build to the app server. The app server does not need a Git checkout or package installation.

## Jenkins setup

Configure the Jenkins job to use the repository's `main` branch and `Jenkinsfile`. Install the **NodeJS** and **SSH Agent** plugins. Under **Manage Jenkins → Tools**, add a NodeJS installation named `NodeJS-22` (the name must match the `tools` block in the Jenkinsfile) and enable automatic installation. Add an **SSH Username with private key** credential with ID `prod-server-ssh`. The Jenkins executor also needs tar, SSH, and the server's verified host key in its `known_hosts`.

Set `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_DIR`, and `SERVICE_NAME` in `Jenkinsfile` to match your server. The Jenkins SSH user needs write access to `DEPLOY_DIR` and permission to restart and check only the app's systemd service without an interactive sudo prompt.

## App server setup

The example deploys files directly into `/app/BusWeb`, using SSH user `ubuntu` and service name `next-bus-app`. Create the directory and give the deploy user ownership:

```bash
sudo mkdir -p /app/BusWeb
sudo chown -R ubuntu:ubuntu /app/BusWeb
```

Install Node.js on the app server to run the standalone app. The server does not need npm or a Git checkout.

Install the systemd service template and ensure it uses the same service name and paths:

```bash
sudo cp deploy/next-bus-app.service /etc/systemd/system/next-bus-app.service
sudo systemctl daemon-reload
sudo systemctl enable next-bus-app
```

Allow the Jenkins SSH user to run only these service commands without a password. Create/edit the sudoers entry with `sudo visudo -f /etc/sudoers.d/next-bus-app-deploy`:

```text
ubuntu ALL=(root) NOPASSWD: /usr/bin/systemctl restart next-bus-app, /usr/bin/systemctl is-active --quiet next-bus-app
```

Jenkins extracts the standalone build directly into `/app/BusWeb`. The service runs `/app/BusWeb/server.js`.

After deployment, inspect logs with `sudo journalctl -u next-bus-app -f`. Use a reverse proxy such as Nginx and configure HTTPS for public access.
