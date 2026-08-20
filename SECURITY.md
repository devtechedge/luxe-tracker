# Security Assessment — Luxe Tracker

**Date:** 2026-08-21  
**Scope:** Auth, XSS, injection, localStorage hardening, dependency risk, secrets hygiene, build config  
**Context:** Public deploy is a **pure client-side demo** ([luxe-disparity-tracker.vercel.app](https://luxe-disparity-tracker.vercel.app/)). No API routes, no database, no environment variables.

---

## Executive summary

| Area | Risk | Notes |
|------|------|--------|
| Authentication | **N/A (by design)** | No login; portfolio dashboard |
| Authorization | **N/A** | No mutating server surface |
| XSS | **Low** | One first-party `dangerouslySetInnerHTML` (theme bootstrap). React text escaping elsewhere |
| Injection (SQL) | **N/A** | No database. Prisma/Supabase were removed |
| localStorage | **Low (hardened)** | Watchlist / alerts / spend parsed through allow-lists |
| Dependency CVEs | **Low** | Lean graph — Next, React, Recharts, Lucide, Tailwind utilities only |
| Secrets in repo | **None** | Zero env vars; `.env*` gitignored |
| Build config | **Hardened** | `ignoreBuildErrors` is **false** — type errors fail CI/build |

**Overall (public Vercel demo):** Low residual risk — browser-only snapshot, no backend secrets, no auth boundary to break.

---

## 1. Authentication & session

**Findings**
- Public site requires no login (expected for a hiring-manager demo).
- Watchlist, alerts, annual-spend, and theme persist in `localStorage` keyed under `luxe-tracker:*`.
- There is no server session, cookie, or token.

**Verdict:** Auth is intentionally absent. Do not claim the demo is “secured with NextAuth / Supabase Auth”.

**If auth is added later:** any future mutating API must check a server session; never trust client-only flags or `localStorage` user ids.

---

## 2. XSS

**Findings**
- `src/app/layout.tsx` injects a **first-party constant** theme script via `dangerouslySetInnerHTML`. The string is authored in-repo, contains no user input, and only reads `luxe-tracker:theme` (`dark` / `light`) or `prefers-color-scheme`.
- Brand names, SKUs, notes, watchlist labels, and alert messages render as React text nodes → default escaping.
- No Markdown / MDX / HTML sanitizer in the dependency graph.

**Hardening applied**
- Theme bootstrap remains a static IIFE; it is not interpolated with storage values beyond an allow-listed `'dark' | 'light'` check.
- Watchlist / alert payloads are allow-listed before they enter React state (`src/lib/validation.ts`).

---

## 3. localStorage / prototype pollution

Untrusted JSON in `localStorage` is the only writeable input on the public demo (extensions, shared-device DevTools, pasted payloads).

**Hardening applied (`src/lib/validation.ts`)**
- Watch type allow-list: `product` · `brand` · `region`
- Alert type allow-list: `price_drop` · `launch_reminder` · `stock_change` · `arbitrage`
- Brand / region allow-lists match the seeded snapshot
- Product ids must match `prod_<n>`
- Entry ids restricted to `[A-Za-z0-9:_-]`
- Control characters stripped; string lengths capped
- Arrays capped at 50; unknown keys dropped; `__proto__` / non-objects rejected
- Annual spend clamped to `[0, 10_000_000]`

Malformed payloads hydrate as empty / default rather than crashing the dashboard.

---

## 4. Injection (SQL / command)

**Findings**
- No SQL, no ORM, no child processes, no server actions.
- Analytics are pure functions over `src/lib/data-snapshot.ts` (mulberry32 seed `0xc0ffee`).

**Verdict:** N/A on the public path.

---

## 5. Dependency / supply chain

### Inventory

Runtime:

- `next`, `react`, `react-dom`
- `recharts`, `lucide-react`
- `clsx`, `class-variance-authority`, `tailwind-merge`

No NextAuth, Prisma, Supabase client, Markdown, or unused Radix/shadcn widgets. Nothing to drop in this pass.

`bun audit` (2026-08-21) reports residual advisories in **Next 15.5.19** (SSRF / DoS / cache-confusion on Server Actions, Image Optimization, rewrites — this app has **no Server Actions, no rewrites, no image optimizer usage**) and transitive **sharp** / **postcss**. Dev-only: eslint → brace-expansion / js-yaml. Majors are ignored by Dependabot; patch/minor upgrades (e.g. Next 15.5.21) will arrive as grouped PRs.

### How to re-audit

```bash
bun install
bun audit
```

---

## 6. Secrets & config hygiene

**Findings**
- `.gitignore` excludes `.env`, `.env*.local`, `.vercel`, logs.
- `package.json` scripts and `README.md` state **zero environment variables**.
- Vercel production is a static-data Next.js app; the live URL stays green without secrets.

---

## 7. Next.js / HTTP surface

| Endpoint | Auth | Notes |
|----------|------|--------|
| Dashboard `/` | None | Client-side snapshot + 17 panels |
| API routes | **None** | No `src/app/api` |

`next.config.ts`: `typescript.ignoreBuildErrors` is **false**. `reactStrictMode` is off (intentional — snapshot is built once at module load).

---

## 8. Residual risk & acceptance

**Accepted for portfolio demo**
- No user authentication on the public site.
- Synthetic brand names / prices (not live boutique feeds).
- Theme script uses `dangerouslySetInnerHTML` for zero-FOUC (first-party only).

**Not accepted**
- Shipping a backend later without auth on mutations.
- Re-enabling `ignoreBuildErrors`.
- Parsing `localStorage` with raw `JSON.parse` into React state.

---

## 9. Follow-ups (ordered)

1. **Done:** SECURITY.md.  
2. **Done:** Watchlist / alerts / spend allow-lists.  
3. **Done:** Unit tests (`bun test`).  
4. **Done:** `ignoreBuildErrors: false` (already set). Lean deps (already set).  
5. **Done:** GitHub Dependabot (majors ignored) + Playwright e2e on CI.

---

## 10. How to re-test

```bash
bun install
bun test
bun run typecheck
bun run test:e2e
bun run audit
```

To report a vulnerability, open a [GitHub security advisory](https://github.com/devtechedge/luxe-tracker/security/advisories) or an issue. There are no production secrets to rotate.
