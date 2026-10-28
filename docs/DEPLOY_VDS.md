# Deploy VRAV Tube Engine on a VDS (Ubuntu 22.04 / 24.04)

Production layout:

- **Frontend** — static files from `dist/` (Nginx)
- **API** — Node Express on port `8787` (systemd)
- Optional: Postgres, Stripe, YooKassa keys in `.env`

---

## 1. Server prep

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl build-essential

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
```

Optional Postgres:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser vrav
sudo -u postgres createdb vrav_tube -O vrav
sudo -u postgres psql -c "ALTER USER vrav PASSWORD 'STRONG_PASSWORD';"
```

---

## 2. Clone and build

```bash
sudo mkdir -p /var/www/vrav
sudo chown $USER:$USER /var/www/vrav
cd /var/www/vrav

git clone https://github.com/zametkikostik/vrav-tube-engine.git .
# or download Release zip: vrav-web-dist.zip and unpack into /var/www/vrav/dist

npm install
npm run build          # → dist/

cd server
npm install
cp .env.example .env
nano .env              # fill keys (see below)
npm run build          # if tsc build exists; else run with tsx
```

### `server/.env` (minimum)

```env
PORT=8787
YOUTUBE_API_KEY=
ROUTERAI_API_KEY=
# DATABASE_URL=postgres://vrav:STRONG_PASSWORD@localhost:5432/vrav_tube
# STRIPE_SECRET_KEY=
# YOOKASSA_SHOP_ID=
# YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=https://YOUR_DOMAIN/?paid=1&provider=yookassa
```

Frontend API URL (optional, if API is on another host):

```bash
# in project root before npm run build
echo 'VITE_API_URL=https://YOUR_DOMAIN' > .env
npm run build
```

If API and web are on the **same domain**, leave `VITE_API_URL` empty and proxy `/api` in Nginx.

---

## 3. systemd service for API

```bash
sudo nano /etc/systemd/system/vrav-api.service
```

```ini
[Unit]
Description=VRAV Tube Engine API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vrav/server
EnvironmentFile=/var/www/vrav/server/.env
ExecStart=/usr/bin/npx tsx src/index.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vrav-api
sudo systemctl status vrav-api
curl -s http://127.0.0.1:8787/health
```

---

## 4. Nginx

```bash
sudo nano /etc/nginx/sites-available/vrav
```

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    root /var/www/vrav/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8787/health;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/vrav /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS (Let’s Encrypt):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

---

## 5. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 6. Updates

```bash
cd /var/www/vrav
git pull
npm install && npm run build
cd server && npm install
sudo systemctl restart vrav-api
```

Or download `vrav-web-dist.zip` from the [Releases](https://github.com/zametkikostik/vrav-tube-engine/releases) page and unpack into `/var/www/vrav/dist`.

---

## Desktop / APK

- **Windows / Linux** installers: from the same Release after the **Release assets** workflow finishes (`.msi`, `.AppImage`, `.deb`).
- **Android**: debug APK from workflow artifacts or Release when attached.

VDS is for the **web + API** SaaS, not for running the Tauri desktop binary as a server.
