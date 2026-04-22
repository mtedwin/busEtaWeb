Systemd deployment for `next-bus-app`

1. Copy the project to the server (or `git clone`) and place it in the desired folder, for example `/home/youruser/next-bus-app`.

2. Edit `deploy/next-bus-app.service` and `deploy/env.production` to set `User`, `Group`, and `WorkingDirectory` to your environment.

3. On the server, install Node.js (Node 18 recommended) and install dependencies:

```bash
# example (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

cd /home/youruser/next-bus-app
npm ci
```

4. Build the app (ensure `node_modules` is present):

```bash
npm run build
```

5. Ensure `public/data.json` and `public/routeDetails.json` exist (run seeders if necessary):

```bash
npm run db:seed
npm run db:seed-routes-fast
```

6. Copy the service file into systemd, enable and start it:

```bash
sudo cp deploy/next-bus-app.service /etc/systemd/system/next-bus-app.service
sudo systemctl daemon-reload
sudo systemctl enable next-bus-app.service
sudo systemctl start next-bus-app.service
sudo journalctl -u next-bus-app -f
```

7. (Optional) Use Nginx as reverse proxy and configure SSL with Certbot.

Notes:
- The `ExecStart` uses the project's local `next` binary via Node: `/usr/bin/node ./node_modules/next/dist/bin/next start -p ${PORT}`. This avoids relying on `npm` or a global `next`.
- If you prefer to run `npm start`, change `ExecStart` to `/usr/bin/npm start` and ensure `npm` is in PATH for the service user.
