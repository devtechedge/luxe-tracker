# High-Fashion Global Launch & Price Disparity Tracker

> A production-grade, containerized analytics platform that tracks regional
> pricing disparities, drop calendars, currency exposure, arbitrage windows,
> and demand signals across **Prada**, **Gucci**, **Balenciaga**, **Louis Vuitton**,
> and **Versace** — covering the EU, US, UK, Norway, and India markets.

Built with **Next.js 16**, **Prisma**, **PostgreSQL (Supabase)**, **Tailwind CSS**,
**shadcn/ui**, **Recharts**, and **Bun**.

---

## ✨ Features

### Core platform (v1)
- **Launch Calendar** — 90-day rolling grid of regional drops with status badges & countdown timers
- **Price Disparity Matrix** — sortable 5-region matrix per product with EUR-baseline disparity %, import duty impact, tax impact, and total landed cost
- **Telemetry** — bar charts for region/brand price averages, currency conversion table, import duty bars, stock overview cards

### Advanced intelligence (v2.0) — 10 theme-tight features
1. **Price History & Trend Charts** — 90-day time series with anomaly flags for >3% daily moves
2. **Arbitrage Opportunity Detector** — net profit after duties, taxes, and shipping per region pair
3. **Competitive Brand Comparison Engine** — equivalent product matching across brands by category
4. **Launch Conflict Radar** — detects overlapping drop windows that cannibalize demand
5. **Currency Volatility Hedge Calculator** — 90-day FX history with what-if scenario revaluation
6. **Resale Value Predictor** — projected secondary-market value based on resale index × retail
7. **Geographic Heat Map** — regional price intensity visualization
8. **Brand Pulse Radar** — 5-dimensional radar (prestige, hype, scarcity, FX risk, resale)
9. **Stock-Out Risk Index** — sell-out probability based on inventory fill × hype × days-to-launch
10. **Landed-Cost Optimizer** — recommends the cheapest buying region per product

### Architecture
- **Frontend** — Next.js App Router, server components + client islands, Recharts visualizations
- **API** — Embedded Next.js API routes (no external service needed for Vercel)
- **Database** — PostgreSQL via Supabase (transaction pooler for runtime, session pooler for migrations)
- **Mini-service** — Optional Bun-based analytics engine on port 3030 for Docker composition
- **Docker** — Multi-stage builds, health checks, shared volume for SQLite alternative

---

## 🚀 Quick start (local dev with Supabase)

### Prerequisites
- Node.js ≥ 20 (or [Bun](https://bun.sh) ≥ 1.3)
- A free [Supabase](https://supabase.com) account
- Git

### 1. Clone & install
```bash
git clone https://github.com/<your-username>/luxe-disparity-tracker.git
cd luxe-disparity-tracker
bun install   # or: npm install
```

### 2. Create a Supabase project
1. Go to <https://app.supabase.com> → **New Project**
2. Pick a name (e.g. `luxe-tracker`), generate a strong DB password, choose a region close to you
3. Wait ~2 minutes for provisioning to finish

### 3. Get your connection strings
In Supabase: **Project Settings → Database → Connection string**

You need **two** URLs:

| Variable | Pooler | Port | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Transaction | `6543` | Used by the app at runtime |
| `DIRECT_DATABASE_URL` | Session | `5432` | Used by Prisma migrations / `db push` |

Both look like:
```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:<port>/postgres
```
For `DATABASE_URL`, append `?pgbouncer=true&connection_limit=1`.

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env and paste in your real DATABASE_URL + DIRECT_DATABASE_URL
```

### 5. Push the schema + seed sample data
```bash
bun run db:push      # creates all 10 tables in Supabase
bun run db:seed      # inserts 5 brands, 25 products, 11k+ price history rows
```

### 6. Start the dev server
```bash
bun run dev
# → http://localhost:3000
```

---

## ☁️ Deploy to Vercel + Supabase (production)

### Option A — Vercel dashboard (recommended for first deploy)

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/<your-username>/luxe-disparity-tracker.git
   git push -u origin main
   ```

2. **Import on Vercel**
   - Go to <https://vercel.com/new>
   - Select your GitHub repo
   - Framework preset: **Next.js** (auto-detected)
   - Build command: `next build` (already in `vercel.json`)
   - Install command: `bun install` (already in `vercel.json`)

3. **Add environment variables** (Vercel → Project → Settings → Environment Variables)

   | Key | Value | Environments |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | Production, Preview, Development |
   | `DIRECT_DATABASE_URL` | `postgresql://...pooler.supabase.com:5432/postgres` | Production, Preview, Development |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Production |

4. **Deploy** — Vercel will:
   - Run `bun install` (triggers `postinstall: prisma generate`)
   - Run `next build`
   - Push the standalone output to the edge

5. **Initialize the database** (one-time, from your laptop):
   ```bash
   # Use your production DATABASE_URL on the command line:
   DIRECT_DATABASE_URL="postgresql://..." bun run db:push
   DIRECT_DATABASE_URL="postgresql://..." bun run db:seed
   ```
   Or paste `supabase/migrations/0001_init.sql` into the Supabase SQL Editor.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link          # link this folder to a Vercel project
vercel env add DATABASE_URL production preview development
vercel env add DIRECT_DATABASE_URL production preview development
vercel env add NEXT_PUBLIC_SITE_URL production
vercel --prod        # deploy to production
```

---

## 🐳 Alternative: self-hosted Docker

The repo ships with a Docker composition that runs everything (Next.js + Bun analytics engine + SQLite) without external services.

```bash
docker compose up --build
# Frontend → http://localhost:3000
# Analytics engine → http://localhost:3030
# Seed runs once on first start
```

To use Postgres in Docker instead of SQLite, edit `docker-compose.yml` to add a `postgres:16` service and point `DATABASE_URL` at it. The Prisma schema already targets Postgres, so no code changes are needed.

---

## 📜 NPM scripts

| Script | Description |
|---|---|
| `bun run dev` | Start Next.js dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript type check |
| `bun run db:push` | Push Prisma schema to DB (non-destructive) |
| `bun run db:migrate:dev` | Create + apply a migration (dev) |
| `bun run db:migrate:deploy` | Apply pending migrations (prod) |
| `bun run db:seed` | Seed 5 brands, 25 products, 11k+ price-history rows |
| `bun run db:studio` | Open Prisma Studio GUI on port 5555 |
| `bun run db:reset` | Drop & recreate all tables + reseed (DESTRUCTIVE) |

---

## 🗂️ Project structure

```
.
├── prisma/
│   ├── schema.prisma        # 10 models — Postgres provider
│   └── seed.ts              # 5 brands × 25 products × 5 regions
├── src/
│   ├── app/
│   │   ├── api/analytics/   # All API routes (catch-all)
│   │   ├── page.tsx         # Dashboard shell + sidebar
│   │   └── layout.tsx
│   ├── components/
│   │   ├── features/        # 10 advanced-feature panels
│   │   └── ui/              # shadcn/ui primitives
│   └── lib/
│       ├── db.ts            # Prisma singleton (Vercel-safe)
│       └── fashion-types.ts
├── supabase/
│   └── migrations/
│       └── 0001_init.sql    # Raw SQL alternative to `prisma db push`
├── mini-services/
│   └── analytics-engine/    # Optional Bun service (Docker only)
├── Dockerfile               # Multi-stage Next.js build
├── Dockerfile.seed          # One-shot DB seeder
├── docker-compose.yml       # Frontend + engine + seeder
├── vercel.json              # Vercel build config
├── .env.example             # Template — copy to .env
└── package.json
```

---

## 🔒 Security notes

- **Never commit `.env`** — `.gitignore` blocks it. Only `.env.example` is tracked.
- **Row-Level Security (RLS)** — Supabase enables RLS by default on new tables. If you enable it, you must add policies that allow the service role (used by Prisma with the connection string above) to read/write all tables. For a portfolio demo, leaving RLS disabled is fine; for a multi-tenant production app, scope policies by `auth.uid()`.
- **Connection pooling** — Supabase's PgBouncer transaction pooler is required for Vercel serverless functions. Always use port `6543` with `?pgbouncer=true&connection_limit=1` for the runtime URL.
- **CORS** — The Next.js API routes are same-origin by default. If you split the frontend and API later, add a CORS middleware.

---

## 🛠️ Troubleshooting

### `PrismaClientInitializationError: Can't reach database server`
- Double-check both URLs use the right ports (`6543` for runtime, `5432` for migrations)
- Ensure your Supabase project isn't paused (free-tier projects auto-pause after 1 week of inactivity)

### `Error: P1009: Database import failed`
- You're probably hitting the wrong pooler. `DIRECT_DATABASE_URL` must use port `5432` (session pooler), NOT `6543`.
- `prisma migrate` and `prisma db push` cannot run through PgBouncer transaction mode.

### Vercel build fails on `prisma generate`
- The `postinstall` hook in `package.json` runs `prisma generate` automatically. If it fails, ensure `prisma` and `@prisma/client` are both in `dependencies` (not `devDependencies`).

### Functions time out on Vercel
- Supabase's free tier allows 60 simultaneous connections. With `?connection_limit=1` per function instance, you should be fine up to ~60 concurrent invocations. For higher load, upgrade Supabase to Pro.

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

---

## 🙏 Acknowledgements

Brand names, product names, and prices are used for **demonstration purposes only**
and do not reflect actual retail pricing. All data is synthetically generated by the
seed script. Trademarks belong to their respective owners.
