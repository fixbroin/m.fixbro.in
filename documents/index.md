# FixBro Interiors — Template Documentation

Welcome to the FixBro Interiors Next.js + MySQL template documentation.

## Documentation Files

- **[Installation & VPS Deployment Guide](./guide-how-to-install.md)** — Step-by-step instructions to set up MySQL, configure `.env`, initialize the database, and deploy to a Linux VPS with PM2, Nginx, and SSL.
- **[`example.env`](./example.env)** — Reference environment variables template. Copy to `.env` in the project root before running `npm run init-db`.
- **[`example.nginx.conf`](./example.nginx.conf)** — Production Nginx reverse proxy config with HTTPS, `/uploads/` direct serving, `/sw.js` no-cache, and security headers.

## Quick Overview

| Item | Details |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Database** | MySQL 8+ (`mysql2/promise` connection pool) |
| **Default Port** | `3004` (`npm run start`) |
| **Admin Panel** | `/admin/login` -> `/admin/dashboard` |
| **DB Initialization** | `npm run init-db` (creates tables, indexes, default content, and admin user) |

## First-Time Setup Checklist

1. Copy `documents/example.env` to `.env` in the project root and fill in your MySQL credentials and domain URL.
2. Leave `AUTH_SECRET`, `ADMIN_USERNAME`, and `DEFAULT_ADMIN_PASSWORD` blank (or omit them) if you want `npm run init-db` to auto-generate secure values, or set your own.
3. Run `npm install && npm run init-db`.
4. Build and start the app (`npm run build && npm run start`).
5. Log in at `https://yourdomain.com/admin/login` and immediately update your admin username and password under **Profile** (`/admin/profile`).
