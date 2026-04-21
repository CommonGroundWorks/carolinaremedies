# Carolina Remedies — Hemp E-Commerce Starter

A production-ready Next.js 15 e-commerce template for hemp/CBD retail, backed by Supabase. Ships with **zero product data and zero secrets** — you supply your own Supabase project credentials and your own catalog.

> **Agentic SDLC Platform**: This repository is structured for autonomous development, CI/CD, and agent-driven iteration. All business logic is isolated behind service layers; all sensitive data lives exclusively in environment variables.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Local Development](#local-development)
5. [Supabase Setup](#supabase-setup)
6. [Creating the First Admin User](#creating-the-first-admin-user)
7. [Loading Your Catalog](#loading-your-catalog)
8. [Catalog Mode vs Shopping Mode](#catalog-mode-vs-shopping-mode)
9. [Admin Console Guide](#admin-console-guide)
10. [Deploy to Vercel](#deploy-to-vercel)
11. [Deploy with Docker](#deploy-with-docker)
12. [Deployment Platform Analysis & Cost Guide](#deployment-platform-analysis--cost-guide)
13. [Running Tests](#running-tests)
14. [Troubleshooting](#troubleshooting)
15. [Compliance & Disclaimer](#compliance--disclaimer)
16. [License](#license)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser / Client                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Next.js App Router (React Server Components) │   │
│  │  · Zustand stores (cart, UI, notifications)   │   │
│  │  · StorefrontProvider (catalog vs shopping)   │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────────┐
│  Supabase (your cloud project)                      │
│  · PostgreSQL  · Auth  · Storage  · Row Level Sec.  │
└─────────────────────────────────────────────────────┘
```

**Key files:**

| Path | Role |
|------|------|
| `src/app/layout.tsx` | Root server component — fetches site settings, wraps app in `StorefrontProvider` |
| `src/lib/site-settings.server.ts` | Server-only settings fetch (never ships to the browser) |
| `src/lib/site-settings.ts` | Client-safe defaults and normalisation helper |
| `src/components/layout/storefront-provider.tsx` | React context — exposes `shoppingEnabled` to all client components |
| `src/lib/supabase.ts` | Supabase client (browser-safe) |
| `src/middleware.ts` | Edge middleware — guards `/admin` routes with Supabase session validation |
| `supabase/migrations/` | All schema SQL in run-order; idempotent (`IF NOT EXISTS`) |
| `src/lib/stores/` | Zustand stores for cart, UI, notifications |
| `src/lib/services/` | Business logic (ProductService, InventoryService) |

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 LTS | `node --version` |
| npm | ≥ 10 | bundled with Node 20 |
| Supabase account | free tier works | [supabase.com](https://supabase.com) |
| Docker (optional) | any recent | only for Docker deployment |
| Vercel account (optional) | free tier works | [vercel.com](https://vercel.com) |

---

## Environment Variables

Copy the example file and fill in your values. **Never commit the filled-in file.**

```bash
cp .env.example .env.local   # local dev
cp .env.example .env         # docker / self-hosted
```

### Complete Reference

| Variable | Required | Example value | Description |
|----------|----------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `https://abcdefgh.supabase.co` | Supabase project URL. Found in **Project Settings → API**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `eyJhbGci...` (long JWT) | Supabase public anon key. Safe to expose in the browser — Row Level Security enforces access. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | `eyJhbGci...` (different JWT) | Service role key. **Never expose** to the browser. Used only in server-side scripts (seed importer). |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://your-domain.com` | Canonical public URL. Used for Open Graph, absolute URL generation, and server action CORS allowlist. |
| `NEXT_PUBLIC_APP_NAME` | No | `CarolinaRemedies` | Display name used in meta tags. |
| `PORT` | No | `7000` | HTTP port for the Node server (default `7000`). |
| `HOST` | No | `0.0.0.0` | Bind address. Use `0.0.0.0` inside Docker. |
| `SUPABASE_PRODUCT_IMAGES_BUCKET` | No | `product-images` | Supabase Storage bucket name for product photos. Created automatically by the seed importer if absent. |
| `LOCAL_SEED_PRODUCTS_CSV` | No | `local/seed-data/products.csv` | Local-only path to your products CSV (gitignored). |
| `LOCAL_SEED_IMAGE_DIR` | No | `local/seed-data/images` | Local-only folder containing product images to upload (gitignored). |
| `SENTRY_DSN` | No | `https://abc@sentry.io/123` | Optional Sentry error reporting DSN. |
| `NODE_ENV` | No | `production` | Set automatically by Next.js on `npm run build`. |

> **Which key is which?** In Supabase Dashboard → **Project Settings → API**, you will see two keys under "Project API keys": `anon` (public) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`. Keep the service role key out of version control and out of any client-side code.

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/<your-org>/<your-fork>.git carolinaremedies
cd carolinaremedies

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
#    → Edit .env.local with your Supabase URL and keys

# 4. Apply the database schema (see "Supabase Setup" below)

# 5. Start the dev server
npm run dev
```

Open [http://localhost:7000](http://localhost:7000).

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (port 7000) |
| `npm run build` | Compile production bundle |
| `npm run start` | Start production server from compiled bundle |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler (no emit) |
| `npm run seed:local` | Import local CSV + images into Supabase |
| `npm run test` | Run all unit tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:coverage` | Unit tests with coverage report |

---

## Supabase Setup

### 1. Create a Project

1. Sign in at [supabase.com](https://supabase.com) and click **New project**.
2. Choose a region close to your users.
3. Set a strong database password and save it somewhere safe (you won't need it in `.env`).
4. Wait ~2 minutes for provisioning to finish.

### 2. Copy Your Credentials

In your project dashboard go to **Project Settings → API**:

```
Project URL:     https://xxxxxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← keep secret
```

Paste these into `.env.local`.

### 3. Apply the Schema

The schema is split into two migration files. **Run them in order.**

#### Option A — Supabase Dashboard (SQL Editor)

1. Open **SQL Editor** in your Supabase project.
2. Click **New query**.
3. Paste and run [`supabase/migrations/00001_schema.sql`](supabase/migrations/00001_schema.sql).
4. Paste and run [`supabase/migrations/00002_site_settings.sql`](supabase/migrations/00002_site_settings.sql).

Both files are idempotent — safe to re-run if something goes wrong.

#### Option B — Supabase CLI

```bash
# Install the CLI (once)
npm install -g supabase

# Link to your project (get <project-ref> from the Supabase URL)
supabase login
supabase link --project-ref <project-ref>

# Push all migrations
supabase db push
```

### 4. What the Schema Creates

| Table | Purpose |
|-------|---------|
| `categories` | Product taxonomy (hierarchical) |
| `products` | Core product records |
| `product_variants` | Weight/size/SKU variants |
| `product_images` | Image URLs and alt text |
| `orders` | Customer orders (COD) |
| `order_items` | Line items per order |
| `site_settings` | Feature flags (shopping on/off) |

All tables have Row Level Security enabled. Public visitors can read `products`, `categories`, and `site_settings`. Only authenticated admins can write.

---

## Creating the First Admin User

Use the bundled bootstrap script. Make sure your `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set, then run:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npx tsx scripts/create-admin.ts
```

The script creates the user (or promotes an existing one), sets `is_admin: true` in their metadata, and confirms their email — no SQL Editor required.

3. Navigate to `/login` on your running app and sign in with those credentials. You will be redirected to `/admin`.

> **How admin access works**: The middleware at `src/middleware.ts` reads the Supabase session from `httpOnly` cookies on every request to `/admin/**`. It checks `user.user_metadata.is_admin === true`. If the session is missing, expired, or the user is not admin, the request is redirected to `/login`. The database RLS policies call `public.is_admin()`, which performs the same check, so no write operation can bypass the middleware.

---

## Loading Your Catalog

Product data and images are **not** committed to this repository. You load your own.

### CSV Import (recommended)

```bash
# 1. Create your local data directory (gitignored)
mkdir -p local/seed-data/images

# 2. Copy the column template
cp scripts/seed-data.example.csv local/seed-data/products.csv

# 3. Fill in your products and drop matching images into local/seed-data/images/

# 4. Run the importer
npm run seed:local
```

**Required CSV columns:**

```
name, slug, sku, category, base_price
```

**All supported columns:**

```
name, slug, sku, category, base_price, description, short_description,
stock_quantity, status, image_file, image_alt_text, lab_results_url,
variant_name, weight_value, weight_unit, strain_type, thc_percentage,
cbd_percentage, brand, genetics, is_featured, is_new_arrival,
is_bestseller, is_lab_tested, is_organic
```

`image_file` should be a filename only (e.g. `purple-haze.jpg`). The importer looks for it in `LOCAL_SEED_IMAGE_DIR`, uploads it to your Supabase Storage bucket, and creates the `product_images` row automatically.

### Admin UI Import

You can also import a CSV directly from the browser via **Admin → Import CSV**. This is useful for smaller updates after initial setup.

---

## Catalog Mode vs Shopping Mode

The storefront ships in **Catalog Mode by default**. In this mode:

- The cart icon is hidden from the header.
- Product cards show a "Catalog only" label instead of an add-to-cart button.
- The product detail page shows a notice instead of quantity selector and checkout button.
- The `/checkout` route returns a friendly disabled message.

This lets you build out your catalog, set prices, and upload images before accepting any orders. **No code changes are needed to enable shopping** — it is controlled from the Admin panel.

### How it works (technical)

```
root layout (server)
  └── getSiteSettings()          ← reads site_settings table, defaults to catalog mode
        └── StorefrontProvider   ← React context, propagates shoppingEnabled
              ├── Header          ← hides cart icon if !shoppingEnabled
              ├── ProductCard     ← hides add-to-cart if !shoppingEnabled
              ├── ProductDetail   ← hides purchase block if !shoppingEnabled
              ├── CartDrawer      ← returns null and closes if !shoppingEnabled
              └── CheckoutPage   ← server-side guard, shows disabled notice
```

The default is set in `src/lib/site-settings.ts`:

```ts
export const DEFAULT_SITE_SETTINGS = {
  shopping_enabled: false,   // ← catalog mode is the safe default
}
```

If the database query fails for any reason, the app falls back to catalog mode — never accidentally exposing a broken checkout.

### Enabling Shopping

1. Sign in at `/login`.
2. Go to **Admin → Settings**.
3. Check **"Enable shopping cart and checkout for the public storefront"**.
4. Click **Save Setting**.

The change is instant — no rebuild or redeploy required.

---

## Admin Console Guide

Access the console at `/admin` (requires admin login).

### Products tab

Lists all products with stock levels and status. Use the **Edit** and **Delete** actions per row.

### Add Product tab

Form to create a new product. Supports:
- Category selection (from your `categories` table)
- Multiple variants (weight/size/price)
- Image URL attachment
- Lab result URL
- Featured / new arrival / bestseller flags

### Import CSV tab

Drag-and-drop or file-select a products CSV. Runs the same importer logic as `npm run seed:local` but in the browser. Useful for smaller bulk updates.

### Settings tab

Controls the **Catalog Mode / Shopping Mode** toggle described above. Also shows the timestamp of the last change so you know when it was last toggled.

### Signing Out

Use the **Sign Out** button in the admin header. This clears the `sb-access-token` and `sb-refresh-token` cookies and redirects to `/login`.

---

## Deploy to Vercel

Vercel is the simplest deployment target for Next.js. The `vercel.json` in this repo configures the build automatically.

### Prerequisites

- A [Vercel account](https://vercel.com) (free tier is sufficient for most catalogs)
- Your Supabase project already set up with schema applied
- Vercel CLI installed: `npm install -g vercel`

### Step 1 — Link the project

```bash
vercel link
```

Follow the prompts to connect to your Vercel account and create (or link to) a project.

### Step 2 — Add environment variables

Add **three required secrets** via the Vercel dashboard (**Project → Settings → Environment Variables**) or CLI:

```bash
# Public variables (safe to expose in browser builds)
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://xxxxxxxxxxxxxxxx.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGci... (the anon key from Supabase Settings → API)

# Secret variable (server-only — never exposed to browser)
vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGci... (the service_role key from Supabase Settings → API)
```

And the canonical URL once you know your domain:

```bash
vercel env add NEXT_PUBLIC_APP_URL
# Paste: https://your-project.vercel.app   (or your custom domain)
```

> **Which environment?** When Vercel asks "which environments", select **Production**, **Preview**, and **Development** for the public variables. For `SUPABASE_SERVICE_ROLE_KEY` you may restrict it to **Production** only if you do not want it available in preview builds.

### Step 3 — Deploy

```bash
# Preview deploy (inspect before going live)
vercel

# Production deploy
vercel --prod
```

### What `vercel.json` configures

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

Environment variables are set separately via `vercel env add` (shown above) or the Vercel Dashboard → **Settings → Environment Variables**. The `@variable-name` syntax for referencing Vercel Secrets is optional; plain values added through the dashboard or CLI work identically.

### Custom Domain

In Vercel Dashboard → **Domains**, add your domain and follow the DNS instructions. Once the domain is verified, update `NEXT_PUBLIC_APP_URL` to your custom domain and redeploy:

```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL
# Paste: https://carolinaremedies.com
vercel --prod
```

---

## Deploy with Docker

The `Dockerfile` builds a standalone, stateless Next.js image. Schema migration and catalog seeding are **not** run inside the container — do those via the Supabase Dashboard or CLI before starting the container.

### Step 1 — Prepare the environment file

```bash
cp .env.example .env
```

Edit `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://your-server-ip:7000
PORT=7000
HOST=0.0.0.0
NODE_ENV=production
```

### Step 2 — Build and start

```bash
docker compose up -d --build web
```

This builds the image and starts a container bound to port `7000`.

### Step 3 — Verify

```bash
# App
curl http://localhost:7000

# Health probe
curl http://localhost:7000/api/health
```

Expected health response:
```json
{ "status": "ok", "timestamp": "2026-04-20T12:00:00.000Z" }
```

### Putting it behind a reverse proxy (recommended for production)

The Docker container serves plain HTTP on port 7000. For public deployments, place it behind **Nginx**, **Caddy**, or **Traefik** to handle TLS termination.

#### Minimal Nginx config example

```nginx
server {
    listen 80;
    server_name carolinaremedies.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name carolinaremedies.com;

    ssl_certificate     /etc/letsencrypt/live/carolinaremedies.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/carolinaremedies.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:7000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Use [Certbot](https://certbot.eff.org/) to obtain the Let's Encrypt certificate.

---

## Deployment Platform Analysis & Cost Guide

> A comprehensive comparison of hosting providers for this Next.js 15 + Supabase hemp e-commerce stack. Includes real pricing data (April 2026), cost estimates at three traffic tiers, risk assessment, and a recommended deployment path for each stage of growth.

### How This Stack Is Deployed

This application has two independently hosted layers:

| Layer | What It Does | Provider Options |
|-------|-------------|-----------------|
| **App** | Next.js 15 server — SSR, API routes, middleware, image optimization | Vercel, Railway, Render, Fly.io, Docker on VPS |
| **Database** | Supabase — Postgres, Auth, Row Level Security, Storage | Supabase (always; self-hosted is possible but complex) |

**Total monthly cost = App hosting + Supabase tier.**

---

### Traffic & Bandwidth Assumptions

Average e-commerce page weight (HTML + JS + CSS + images with Next.js optimization): ~1.5 MB.
Average pages per visit: 5.

| Monthly Visitors | Data Transfer | Concurrent Users (peak) | Recommended App RAM |
|-----------------|--------------|------------------------|---------------------|
| 100 | ~750 MB | < 5 | 512 MB |
| 1,000 | ~7.5 GB | ~10–20 | 512 MB – 1 GB |
| 10,000 | ~75 GB | ~50–150 | 1–2 GB |

---

### Supabase Tier Selector

| Plan | Cost | Best For | Caveat |
|------|------|----------|--------|
| Free | $0/mo | Development & testing only | Projects **pause after 1 week of inactivity** — not viable for live stores |
| **Pro** | **$25/mo** | **All production deployments** | Includes 250 GB egress, 8 GB DB, daily backups, no pausing |
| Team | $599/mo | SOC 2, SSO, SLAs | Enterprise use |

> **All cost estimates in this guide add $25/mo for Supabase Pro**, which is the minimum for a live production store.

The Pro plan includes a **$10/mo compute credit** that covers one Micro instance (1 GB RAM, 2-core ARM). For stores under ~50,000 MAUs and with a catalog under 8 GB, the base $25/mo plan covers everything with no overages.

---

### Platform 1 — Vercel (Recommended · Lowest Risk)

Vercel built Next.js. This repo ships with `vercel.json` and is tuned for zero-config Vercel deployment.

**Plans:**

| Plan | Price | Bandwidth | Function Invocations | Commercial Use |
|------|-------|-----------|---------------------|----------------|
| Hobby | Free | 100 GB | 1M | ❌ Prohibited for e-commerce |
| **Pro** | **$20/mo** | **100 GB** | **1M** | ✅ Required |
| Enterprise | Custom | Unlimited | Unlimited | ✅ |

The Pro plan includes $20 of usage credits, which covers most small-to-medium stores entirely. Overages are priced per unit (e.g., $0.60 per extra million invocations, $0.15/GB extra bandwidth).

**Estimated monthly cost (App + Supabase Pro):**

| Visitors/mo | Vercel Pro | Supabase Pro | **Total** | Notes |
|-------------|-----------|--------------|-----------|-------|
| 100 | $20 | $25 | **$45** | Well within all inclusions |
| 1,000 | $20 | $25 | **$45** | Still within 100 GB bandwidth |
| 10,000 | $20–25 | $25 | **$45–50** | ~75 GB bandwidth; may hit 1M invocations at very high SSR rate |

**Strengths:**
- Zero DevOps — no server, no SSL cert, no firewall configuration
- Native Next.js 15 optimizations: ISR, React Server Components, edge middleware, image CDN
- Global edge CDN (Points of Presence worldwide) — low latency everywhere
- Automatic HTTPS, DDoS mitigation, WAF, and bot management on every plan
- Git-based CI/CD with preview deployments on every pull request
- Instant rollbacks with one click
- SOC 2 Type 2, PCI DSS, ISO 27001 certified — compliance without extra work
- Automatic scaling to zero (no traffic = no wasted compute)

**Weaknesses:**
- Most expensive per-dollar relative to raw compute (you pay for the managed layer)
- No persistent file system — all assets must go through Supabase Storage or Vercel Blob
- Serverless function timeout: 60 s on Pro (sufficient for all current API routes)
- Vendor lock-in: some Vercel-specific APIs (`@vercel/kv`, streaming optimizations) don't port directly

**Risk Level: ⭐ Lowest** — fully managed, auto-scaling, PCI compliant out of the box

---

### Platform 2 — Railway (Best Value Managed PaaS)

Usage-based pricing that scales with your actual consumption. Docker-native, so it uses the existing `Dockerfile` unchanged.

**Plans:**

| Plan | Min Spend | Max CPU/service | Max RAM/service |
|------|-----------|----------------|----------------|
| Hobby | $5/mo | 48 vCPU | 48 GB |
| **Pro** | **$20/mo** | **1,000 vCPU** | **1 TB** |

**Usage rates:** Memory $0.00000386/GB·sec · CPU $0.00000772/vCPU·sec · Egress $0.05/GB

*A Next.js server at moderate load (~0.1 vCPU + 256 MB idle):*
- CPU cost: 0.1 vCPU × $0.00000772 × 2,592,000 s/mo ≈ $2.00/mo
- RAM cost: 0.256 GB × $0.00000386 × 2,592,000 s/mo ≈ $2.56/mo
- Base compute: **~$4.56/mo** — well within the $5 Hobby minimum

**Estimated monthly cost (App + Supabase Pro):**

| Visitors/mo | Railway (Hobby) | Supabase Pro | **Total** | Notes |
|-------------|----------------|--------------|-----------|-------|
| 100 | $5 | $25 | **$30** | Covered by included credits |
| 1,000 | $5–8 | $25 | **$30–33** | ~7.5 GB egress ≈ $0.38 extra |
| 10,000 | $10–20 | $25 | **$35–45** | Upgrade to Pro plan for reliability |

**Strengths:**
- Lowest total cost at low-to-medium scale
- Docker-native — `docker compose up` locally, `railway up` in production
- Autoscaling, zero-downtime deploys, global regions on Pro
- Usage-based billing — pay only for what runs
- Built-in Postgres add-on (though we use Supabase instead)

**Weaknesses:**
- No native Next.js edge CDN — assets served from a single region without a CDN layer
- ISR (Incremental Static Regeneration) runs server-side, not at the edge
- Egress charges add up at high traffic ($0.05/GB vs. Vercel's 100 GB free)
- Less mature than Vercel for complex Next.js deployments

**Risk Level: ⭐⭐ Low** — managed platform with autoscaling; occasional platform incidents are public on their status page

---

### Platform 3 — Render (Predictable Flat-Rate PaaS)

Fixed instance pricing with zero surprise bills. A solid choice for teams that dislike usage-based billing.

**Web Service plans:**

| Instance | Cost | RAM | CPU | Notes |
|----------|------|-----|-----|-------|
| Free | $0 | 512 MB | 0.1 | ❌ Sleeps after 15 min of inactivity |
| **Starter** | **$7/mo** | **512 MB** | **0.5** | ✅ Always-on; tight for Next.js builds |
| **Standard** | **$25/mo** | **2 GB** | **1** | ✅ Recommended for production |
| Pro | $85/mo | 4 GB | 2 | High-traffic or admin-heavy workloads |

Bandwidth: 100 GB/mo included on all paid plans; $0.10/GB overage.

**Estimated monthly cost (App + Supabase Pro):**

| Visitors/mo | Render Instance | Supabase Pro | **Total** | Notes |
|-------------|----------------|--------------|-----------|-------|
| 100 | $7 (Starter) | $25 | **$32** | Memory may be tight during builds |
| 1,000 | $7–25 | $25 | **$32–50** | Upgrade to Standard for reliability |
| 10,000 | $25 (Standard) | $25 | **$50** | 75 GB egress within 100 GB free |

**Strengths:**
- Completely predictable billing — no usage surprises
- Zero-downtime deploys, instant rollbacks
- Automatic TLS/SSL, custom domains, DDoS protection
- Docker support — uses existing `Dockerfile`
- SOC 2 Type 2, ISO 27001 certified

**Weaknesses:**
- Starter (512 MB) is genuinely tight for `next build` — can cause OOM during CI
- Single-region deployments without a CDN layer
- No native Next.js ISR edge support
- Free tier auto-sleep makes it unusable for e-commerce

**Risk Level: ⭐⭐ Low** — managed, predictable; single-region means slightly higher latency for geographically distributed customers

---

### Platform 4 — Fly.io (Container-Native, Multi-Region)

Deploy Docker containers to any of ~35 global regions. Best for teams comfortable with `fly.toml` configuration.

**Machine presets (shared CPU):**

| Preset | RAM | Cost/mo (always-on) | Notes |
|--------|-----|---------------------|-------|
| shared-cpu-1x | 512 MB | $1.94 | Too small for Next.js 15 |
| shared-cpu-1x | 1 GB | **$5.70** | Adequate for low traffic |
| **shared-cpu-2x** | **2 GB** | **$11.39** | Recommended |
| performance-1x | 2 GB | $31.00 | Dedicated CPU |

Egress: $0.02/GB (North America / Europe) · $0.04/GB (Asia Pacific)

**Estimated monthly cost (App + Supabase Pro):**

| Visitors/mo | Fly.io (1 GB) | Supabase Pro | **Total** | Notes |
|-------------|--------------|--------------|-----------|-------|
| 100 | $5.70 | $25 | **~$31** | ~0.75 GB egress ≈ $0.02 extra |
| 1,000 | $5.70–7 | $25 | **~$31–32** | ~7.5 GB egress ≈ $0.15 extra |
| 10,000 | $7–12 | $25 | **~$32–37** | ~75 GB egress ≈ $1.50; consider 2 GB machine |

**Strengths:**
- True global distribution — place machines closest to your customers
- Fast cold starts using snapshot-restore
- Docker-native, uses our `Dockerfile` directly
- Competitive egress pricing vs. cloud giants
- Free shared IPv4 + unlimited IPv6, $0.10/mo SSL certs

**Weaknesses:**
- Configuration requires a `fly.toml` file (not included in this repo)
- No native Next.js ISR edge caching
- More complex than Vercel or Railway for initial setup
- Managed Postgres costs extra ($82–164/mo for production HA cluster — not needed since we use Supabase)

**Risk Level: ⭐⭐ Low-Medium** — globally distributed but requires Docker + CLI familiarity for setup and updates

---

### Platform 5 — DigitalOcean Droplet (DIY VPS)

Full-control virtual machines. Use with the Docker Compose setup already included in this repo.

**Basic Droplet pricing:**

| RAM | vCPU | Included BW | Cost/mo |
|-----|------|-------------|---------|
| 1 GB | 1 | 1 TB | $6 |
| **2 GB** | **1** | **2 TB** | **$12** |
| 4 GB | 2 | 4 TB | $24 |
| 8 GB | 4 | 5 TB | $48 |

Automated weekly backups: +20% of Droplet cost ($2.40/mo on the $12 Droplet).
Managed database (if preferred over Supabase): separate pricing.

**Estimated monthly cost (App + Supabase Pro):**

| Visitors/mo | DO Droplet 2 GB + backup | Supabase Pro | **Total** | Notes |
|-------------|--------------------------|--------------|-----------|-------|
| 100 | $14.40 | $25 | **$39** | Comfortable headroom |
| 1,000 | $14.40 | $25 | **$39** | ~7.5 GB, well under 2 TB |
| 10,000 | $26.80 (4 GB) | $25 | **$52** | ~75 GB, still well under 4 TB |

**Stack you need to configure yourself:**

```
Ubuntu 24.04 LTS
└── Docker + Docker Compose (app container via existing Dockerfile)
└── Nginx (reverse proxy, rate limiting)
└── Certbot + Let's Encrypt (free TLS/SSL)
└── UFW firewall (ports 80, 443 open; 22 SSH)
└── Fail2ban (SSH brute-force protection)
└── Unattended upgrades (auto security patches)
└── DigitalOcean Monitoring (free CPU/RAM/disk alerts)
```

**Strengths:**
- Massive included bandwidth (2 TB at $12/mo vs. 100 GB on Vercel Pro)
- Full infrastructure control — configure anything
- Predictable fixed-cost pricing
- Run multiple projects on one server if needed
- DigitalOcean's UI and documentation are beginner-friendly for a VPS

**Weaknesses:**
- Setup time: 2–4 hours for initial hardening + Nginx + SSL
- Ongoing maintenance: OS patches, Docker updates, SSL renewals (Certbot auto-renews)
- No auto-scaling — a traffic spike requires manual resize or load balancer setup
- You are responsible for all security hardening

**Risk Level: ⭐⭐⭐ Medium** — requires solid Linux/DevOps knowledge; security is your responsibility

---

### Platform 6 — Hetzner Cloud (Best Price · Europe-Based)

European infrastructure at prices 3–5× cheaper than US hyperscalers. Best for EU-based operators or extremely cost-sensitive deployments.

**Shared (Intel/AMD) Cloud Servers:**

| Server | RAM | vCPU | Included Traffic | Cost/mo (incl. VAT) | Cost/mo (USD approx.) |
|--------|-----|------|-----------------|--------------------|-----------------------|
| **CX23** | **4 GB** | **2** | **20 TB** | **€4.49** | **~$5** |
| CX33 | 8 GB | 4 | 20 TB | €5.99 | ~$7 |
| CX43 | 16 GB | 8 | 20 TB | €8.99 | ~$10 |

**Dedicated vCPU (CCX series) for sustained high load:**

| Server | RAM | vCPU | Included Traffic | Cost/mo (incl. VAT) |
|--------|-----|------|-----------------|---------------------|
| CCX23 | 8 GB | 4 | 20 TB | €16.49 |

All plans include 20 TB of traffic — essentially unlimited for this use case.

**Estimated monthly cost (App + Supabase Pro):**

| Visitors/mo | Hetzner CX23 | Supabase Pro | **Total** | Notes |
|-------------|-------------|--------------|-----------|-------|
| 100 | ~$5 | $25 | **~$30** | 20 TB included — no bandwidth concerns |
| 1,000 | ~$5 | $25 | **~$30** | Same plan handles comfortably |
| 10,000 | ~$5–7 | $25 | **~$30–32** | May upgrade to CX33 for headroom |

> **US latency note:** Hetzner has servers in Ashburn, Virginia (`us-east`) and Hillsboro, Oregon (`us-west`). Pairing with a Cloudflare free CDN (which caches static assets globally) eliminates most latency concerns.

**Strengths:**
- Cheapest production hosting available — ~3–5× cheaper than AWS/GCP/DO for equivalent specs
- 20 TB monthly traffic included (vs. 100 GB on Vercel Pro)
- GDPR-compliant (German company, EU data centers, ISO 27001 certified)
- Docker one-click app available; uses existing `Dockerfile`
- Same self-managed setup as DigitalOcean Droplet

**Weaknesses:**
- EU-first company — US support response times can be longer
- DIY server management (Nginx, Certbot, firewall — same as DigitalOcean)
- No managed auto-scaling
- Not ideal without a CDN overlay for geographically distributed traffic

**Risk Level: ⭐⭐⭐ Medium** — identical risk profile to DigitalOcean Droplet; requires DevOps expertise

---

### Master Cost Comparison Table

> All figures include **Supabase Pro at $25/mo**. App hosting costs are based on typical usage patterns for a hemp e-commerce catalog. Rounded to nearest dollar.

| Platform | 100 visitors/mo | 1,000 visitors/mo | 10,000 visitors/mo | DevOps Effort | Risk Level |
|----------|----------------|-------------------|--------------------|---------------|------------|
| **Vercel Pro** | **$45** | **$45** | **$45–50** | None | ⭐ Lowest |
| **Railway Hobby** | **$30** | **$30–33** | **$35–45** | Minimal | ⭐⭐ Low |
| **Render Standard** | **$32** | **$32–50** | **$50** | Minimal | ⭐⭐ Low |
| **Fly.io (1 GB)** | **$31** | **$31–32** | **$32–37** | Low | ⭐⭐ Low |
| **DigitalOcean 2 GB** | **$39** | **$39** | **$52** | Medium | ⭐⭐⭐ Medium |
| **Hetzner CX23** | **~$30** | **~$30** | **~$30–32** | Medium | ⭐⭐⭐ Medium |

---

### Recommended Deployment Paths

#### Stage 1 — Getting Started (0–500 visitors/mo)

**Railway Hobby ($5) + Supabase Pro ($25) = ~$30/mo**

- Use the existing `Dockerfile` — Railway detects and builds it automatically
- Full CI/CD via GitHub integration
- Autoscales to minimum at low traffic
- Upgrade to Vercel Pro anytime as traffic grows

#### Stage 2 — Growing Store (500–5,000 visitors/mo)

**Vercel Pro ($20) + Supabase Pro ($25) = $45/mo** ← *This is the sweet spot*

- Zero DevOps overhead — the entire platform is managed
- Best-in-class Next.js 15 performance: ISR, edge middleware, image optimization CDN
- Preview deployments on every pull request
- PCI DSS and SOC 2 compliance without additional tooling
- Pricing stays flat even at 5K visitors/mo

#### Stage 3 — Established Business (5,000–20,000 visitors/mo)

**Vercel Pro ($20–30) + Supabase Pro ($25–35) = $45–65/mo**

Still well within Vercel Pro limits. If Supabase MAU count grows beyond 100K, upgrade Supabase to Small compute ($15/mo add-on). The Next.js edge cache dramatically reduces function invocations.

#### Stage 4 — High Volume (20,000+ visitors/mo)

**Vercel Pro ($30–60) + Supabase Pro Large ($135) = $165–195/mo**

At this level, ISR and static generation should serve most product pages without triggering function invocations. Alternatively, migrate the app to a dedicated 4 GB Hetzner server ($7/mo + Cloudflare) and keep Supabase Pro, reducing total to ~$168/mo.

#### Budget-Conscious (Any Traffic Level)

**Hetzner CX23 (~$5) + Cloudflare (Free CDN) + Supabase Pro ($25) = ~$30/mo**

Maximum value for technically capable teams. Requires:
1. Provision a Hetzner CX23 in `us-east-1` (Ashburn, VA) or `us-west-1` (Hillsboro, OR)
2. Run `docker compose up -d --build web` (existing `Dockerfile` works as-is)
3. Configure Nginx reverse proxy + Certbot SSL (see Docker deployment section above)
4. Add site to Cloudflare free tier (proxies and caches static assets globally)

---

### Hemp / CBD Industry Considerations

#### Platform Terms of Service

All platforms evaluated permit hemp-derived products (<0.3% THC, 2018 Farm Bill compliant). Always review the current ToS before deploying, as policies can change.

| Platform | Hemp E-Commerce | Notes |
|----------|----------------|-------|
| Vercel | ✅ Permitted | Review [Acceptable Use Policy](https://vercel.com/legal/acceptable-use) |
| Railway | ✅ Permitted | Review [Acceptable Use Policy](https://railway.com/legal/acceptable-use) |
| Render | ✅ Permitted | Review [Acceptable Use Policy](https://render.com/acceptable-use) |
| Fly.io | ✅ Permitted | Review [Acceptable Use Policy](https://fly.io/legal/acceptable-use-policy/) |
| DigitalOcean | ✅ Permitted | Review [ToS](https://www.digitalocean.com/legal/terms-of-service-agreement) |
| Hetzner | ✅ Permitted | Review [ToS](https://www.hetzner.com/legal/terms-and-conditions/) |

> **Payment processing:** This platform uses Cash on Delivery (COD). There is no credit card processing integration, which sidesteps the payment processor restrictions common in the hemp/cannabis industry.

#### Jurisdiction & Region Selection

| Scenario | Recommended Region |
|----------|--------------------|
| US-focused store | Vercel (auto-routes), Railway US, Fly.io `iad` (Ashburn VA), DO NYC/SFO, Hetzner `us-east-1` |
| EU-focused store | Hetzner (Germany/Finland), Vercel (EU), Fly.io `ams`/`fra` |
| Global store | Vercel Pro (global edge CDN) or Fly.io with multi-region machines |

#### Data Privacy

- If serving EU customers, ensure your host processes data in the EU or holds a valid EU–U.S. Data Privacy Framework certification
- Vercel: DPF certified, GDPR compliant ✅
- Hetzner: GDPR compliant, EU-headquartered ✅
- All other platforms: check their current DPA agreements

---

### Pre-Launch Security Checklist

Complete this before enabling Shopping Mode in Admin → Settings.

**Environment & Secrets**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set **only** as a server-side environment variable — never exposed in browser builds or public repo
- [ ] `.env`, `.env.local`, and `.env.production` are in `.gitignore` (already configured)
- [ ] All three required env vars set in your host's secret store before first deploy
- [ ] `NEXT_PUBLIC_APP_URL` set to your actual domain (affects CORS and Open Graph)

**Database & Auth**
- [ ] Supabase RLS policies confirmed active: run `SELECT schemaname, tablename, policyname FROM pg_policies;` in SQL Editor and verify all app tables have policies
- [ ] Admin user has `is_admin: true` in `raw_user_meta_data` (see Creating the First Admin User)
- [ ] Supabase Dashboard: enable **Email confirmations** and **Secure email change** under Auth → Settings
- [ ] Supabase Dashboard: enable **2FA** on all Supabase admin accounts
- [ ] Product images bucket is set to **public read, private write** — not fully public write

**Application**
- [ ] HTTPS enforced: automatic on Vercel/Railway/Render/Fly.io; use Certbot + Nginx `return 301 https://` redirect on VPS
- [ ] Admin route protected by edge middleware (`src/middleware.ts`) — verified by attempting to access `/admin` without a session
- [ ] Shopping Mode starts **disabled** (catalog mode default) — only enable after full QA
- [ ] Run `npm audit --audit-level=moderate` and resolve critical/high findings before launch

**VPS-Specific (DigitalOcean / Hetzner only)**
- [ ] UFW firewall configured: allow only ports 22 (SSH), 80 (HTTP redirect), 443 (HTTPS)
- [ ] SSH key-based authentication only — password auth disabled in `/etc/ssh/sshd_config`
- [ ] Fail2ban installed and active (blocks repeated SSH failures)
- [ ] Unattended-upgrades enabled for automatic OS security patches
- [ ] Docker daemon not exposed on a TCP socket (use Unix socket only)
- [ ] Nginx `limit_req_zone` configured to rate-limit `/api/` routes

---

## Running Tests

```bash
# Type-check (no compilation artefacts)
npm run type-check

# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# End-to-end (requires a running dev server on port 7000)
npm run dev &
npm run test:e2e
```

Tests live in `tests/`:

```
tests/
  unit/          Vitest + React Testing Library component tests
  e2e/           Playwright browser tests (user flows)
  integration/   Service-level integration tests
  mocks/         MSW mock handlers
  fixtures/      Static test data (JSON)
```

---

## Troubleshooting

### "Failed to load site settings" appears in server logs

The `site_settings` table does not exist yet. Run migration `00002_site_settings.sql` in your Supabase SQL Editor. The app will fall back to catalog mode until the table is present.

### Admin login redirects back to `/login`

Check these in order:
1. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in your environment file.
2. Confirm the user has `is_admin: true` in their `raw_user_meta_data` (see [Creating the First Admin User](#creating-the-first-admin-user)).
3. Check browser dev tools → Application → Cookies. After login, `sb-access-token` and `sb-refresh-token` cookies should be present. If they are missing, the auth flow in `src/app/api/auth/` may have an issue fetching the session.

### Product images show a broken placeholder

The image URL stored in `product_images` is unreachable. If you seeded via CSV, verify:
- `SUPABASE_PRODUCT_IMAGES_BUCKET` matches the bucket name in **Supabase → Storage**.
- The bucket has a public policy that allows unauthenticated reads. In the Supabase Dashboard go to **Storage → Policies** and confirm the bucket is marked "Public".

### Shopping toggle in Admin → Settings returns an error

The most common cause is that the authenticated user's RLS `is_admin()` check is failing. Confirm:
```sql
-- Run in Supabase SQL Editor while signed in as the admin user
select public.is_admin();
-- Expected: true
```
If this returns `false`, re-run the admin-marking SQL from [Creating the First Admin User](#creating-the-first-admin-user).

### `npm run seed:local` fails with "bucket not found"

Set `SUPABASE_PRODUCT_IMAGES_BUCKET` in your `.env.local`. The seeder creates the bucket automatically if it does not exist, but the service role key (`SUPABASE_SERVICE_ROLE_KEY`) must be set for bucket creation to succeed.

### Docker container exits immediately

Run `docker compose logs web` to see the error. Most startup failures are missing environment variables. Ensure `.env` contains all three required Supabase variables before `docker compose up`.

---

## Compliance & Disclaimer

This software is a **code-only starter template**. The repository ships with **zero product data** and **no pre-configured infrastructure**.

**You are solely responsible for:**

- Provisioning and securing your own Supabase project (database, auth, storage, RLS policies)
- Compliance with all applicable federal, state, and local regulations governing hemp and cannabis commerce in your jurisdiction, including but not limited to:
  - Farm Bill (2018) compliance for hemp-derived products
  - State licensing and registration requirements
  - Age-verification laws (21+ or 18+ depending on jurisdiction)
  - Lab testing and Certificate of Analysis (COA) disclosure requirements
  - Labeling regulations
- Tax collection (sales tax, excise tax) as required by your jurisdiction
- Protecting customer data in accordance with applicable privacy laws (CCPA, GDPR, etc.)

The authors and contributors assume **no liability** for regulatory non-compliance, data breaches, or legal consequences arising from use of this software.

---

## License

[MIT License](LICENSE) — free to use, fork, and deploy for commercial, educational, and agentic testing projects.

