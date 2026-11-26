# How to Install & Deploy on a VPS (Step-by-Step)

This guide walks you through deploying **FixBro Interiors** on a fresh Ubuntu/Debian Linux VPS from scratch.

---

## Prerequisites

- A Linux VPS (Ubuntu 22.04 LTS or 24.04 LTS recommended, 2 GB+ RAM)
- A domain name pointed to your VPS IPv4 address (`A` record for `@` and `www`)
- SSH access to the server (`root` or a `sudo` user)

---

## Step 1: Update Server & Install Node.js 20+

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential
node -v   # Should be v20.x or higher
npm -v
```

Install **PM2** globally to keep the Next.js server running 24/7:

```bash
sudo npm install -g pm2
```

---

## Step 2: Install & Configure MySQL

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

Create a dedicated database and user for the website (replace `YOUR_STRONG_DB_PASSWORD` with a strong password):

```bash
sudo mysql
```

Inside the MySQL shell, run:

```sql
CREATE DATABASE IF NOT EXISTS fixbro_interiors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'fixbro_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON fixbro_interiors.* TO 'fixbro_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Tip for high traffic (100,000+ visitors):** Check your MySQL `max_connections` (default is usually `151`). Ensure `maxInstances * MYSQL_CONNECTION_LIMIT` is less than `max_connections`.

---

## Step 3: Upload / Clone Your Project

Place your project files on the VPS (for example, `/var/www/fixbro`):

```bash
sudo mkdir -p /var/www/fixbro
sudo chown -R $USER:$USER /var/www/fixbro
cd /var/www/fixbro
# Upload files via SCP/SFTP or git clone into /var/www/fixbro
```

Install dependencies:

```bash
npm install
```

---

## Step 4: Configure `.env`

Copy `documents/example.env` to `.env` in the project root:

```bash
cp documents/example.env .env
nano .env
```

Update at least:
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_WEBSITE_URL` and `NEXT_PUBLIC_BASE_URL` (e.g. `https://yourdomain.com`)
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`

### Automatic `AUTH_SECRET` & Default Admin Credentials

- If `AUTH_SECRET`, `ADMIN_USERNAME`, and `DEFAULT_ADMIN_PASSWORD` are **not** set in `.env`, running `npm run init-db` will automatically generate `AUTH_SECRET` and `DEFAULT_ADMIN_PASSWORD`, set `ADMIN_USERNAME=admin`, and save them into `.env`.
- If you **already** set your own values in `.env`, `npm run init-db` will keep and use your existing values.

---

## Step 5: Initialize the Database & Build

Run the database initializer:

```bash
npm run init-db
```

This creates all required tables, performance indexes, default content, and the initial admin user. Check `.env` (or the command output) for the generated `ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD`.

Now build the production app:

```bash
npm run build
```

---

## Step 6: Start the App with PM2

Start Next.js on port `3004`:

```bash
pm2 start npm --name "fixbro" -- start
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` so the app restarts automatically if the VPS reboots.

Verify it is running locally:

```bash
pm2 status
curl -I http://127.0.0.1:3004
```

---

## Step 7: Set Up Nginx Reverse Proxy & Free SSL (Certbot)

Install Nginx and Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create an Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/fixbro
```

Paste the following (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fixbro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Enable HTTPS with Certbot:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 8: Post-Install Admin Panel Configuration

1. Visit `https://yourdomain.com/admin/login`.
2. Log in with username `admin` and the `DEFAULT_ADMIN_PASSWORD` from your `.env` file.
3. Go to **Profile** (`/admin/profile`) and immediately change your **admin email** and **password**.
4. Configure your site details in **Admin -> Settings**:
   - **General Settings**: Logo, favicon, site name, social links.
   - **Email (SMTP) Settings**: Host, port, username, password, sender email.
   - **Payment Gateway (Razorpay)**: Key ID, Key Secret, and Webhook Secret.
     - Set your Razorpay Webhook URL to: `https://yourdomain.com/api/razorpay/webhook`
     - Subscribe to `payment.captured` and `order.paid` events.
   - **SEO & GEO Settings**: Meta titles, descriptions, and canonical URLs.

---

## Useful Maintenance Commands

```bash
# View live application logs
pm2 logs fixbro

# Restart after code or .env changes
npm run build && pm2 restart fixbro

# Re-run DB schema/index check safely (skips seeding if data already exists)
npm run init-db
```
