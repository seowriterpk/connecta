# Grupos Hoy — Hostinger Deployment Guide (v3.0 · mysql2 edition)

**Stack:** Next.js 16 (App Router) · mysql2/promise connection pool · local MySQL · no Prisma.

> v3.0 removed Prisma completely. The app now talks to MySQL the standard,
> fast way: `mysql2/promise` + `createPool` + a **Schema Guard** that creates
> and patches tables automatically on the first request. No terminal access,
> no `prisma migrate`, no provider swapping, no remote MySQL connections.

---

## 1. What changed (v3.0)

| Before (v2.x) | Now (v3.0) |
|---|---|
| Prisma ORM (native engine binaries) | `mysql2/promise` (pure JS, shared-hosting safe) |
| Remote MySQL via `srv939.hstgr.io:3306` / public IP | **`localhost`** — app + MySQL on the same Hostinger server |
| `prisma generate` + sed provider swap in build | Plain `next build` — nothing DB-related at build time |
| Migrations via `prisma db push` (needs terminal) | **Schema Guard**: `CREATE TABLE IF NOT EXISTS` + `ALTER` guards run automatically on boot |
| Build crashed when DB unreachable | Build never touches the DB (all DB pages are `force-dynamic`) |
| bcrypt (native) | bcryptjs (pure JS) |

---

## 2. Environment variables

The app reads everything from `process.env` at runtime. Any of these three
sources works (highest priority first — a source never overrides the one
above it):

1. **Real environment variables** (hPanel → Node.js → Environment Variables)
2. **`.env.local`** in the app root
3. **`.env`** in the app root

> ✅ **Since Task 21 every `.env*` file is git-ignored and UNTRACKED.** You can
> put secrets (including `PROXY_URL`) directly in `.env` on the server —
> `git pull` can never conflict with or overwrite it again. The committed
> `.env.example` is the template; the build copies any existing `.env*`
> file into `.next/standalone/` so the production server sees it, and the
> cron scripts read the app-root files directly.

> ⚠️ **ONE-TIME migration for the next `git pull` only.** This update removes
> `.env` from git tracking. If you already created/edited a `.env` on the
> server, the pull would refuse to touch it. Run this sequence ONCE, then
> pull normally forever after:
>
> ```bash
> cp .env /tmp/env.keep    # 1. back up your .env (the one with PROXY_URL)
> git restore .env         # 2. reset it to the tracked version (may error if already clean — ignore)
> git pull                 # 3. pulls the update; .env disappears from tracking
> cp /tmp/env.keep .env    # 4. put your .env back — it's yours now, git ignores it
> ```

Full variable list (copy from `.env.example`):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=u824913874_spanish
DB_PASSWORD=<your MySQL password from hPanel — same one you use in phpMyAdmin>
DB_NAME=u824913874_spanishs

SESSION_SECRET=<any random 32+ char string>
ADMIN_USER=admin
ADMIN_PASS=<your admin panel password>

PROXY_URL=http://<dataimpulse-user>__cr.us:<dataimpulse-password>@gw.dataimpulse.com:823

BASE_URL=https://yourdomain.com
NODE_ENV=production
```

> ⚠️ **`PROXY_URL` is REQUIRED in production.** WhatsApp blocks datacenter
> IPs — every invite-link verification and group-image download must exit
> through the DataImpulse residential proxy. Without it the link checker
> reports "unknown" for everything and images can't be saved locally.
> Format: `http://USER__cr.us:PASSWORD@gw.dataimpulse.com:823` (the
> `__cr.us` suffix routes through US residential IPs).

> ⚠️ **`DB_HOST=localhost` is the critical fix.** Your MySQL server
> (`srv939.hstgr.io`) runs on the same hosting node as the Node app.
> Connecting through the public hostname/IP (`31.97.208.160:3306`) routes
> every query through external network — slow, rate-limited, and the cause of
> the lag and 503s. `localhost` connects through the internal socket — fast.

---

## 3. hPanel Node.js app settings

| Field | Value |
|---|---|
| Framework preset | **Next.js** |
| Node version | 22.x |
| Root directory | `./` |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Environment variables | See §2 |

`package.json` already contains:

```json
{
  "scripts": {
    "build": "bash scripts/build.sh",
    "start": "NODE_ENV=production node .next/standalone/server.js"
  },
  "engines": { "node": ">=20.9.0" }
}
```

`scripts/build.sh` does: `next build --webpack` (avoids the Turbopack CSS
crash) → copies `static/` + `public/` into the standalone output. It never
touches the database.

---

## 4. Database — zero manual setup

On the **first request** after deployment, the Schema Guard
(`src/lib/db.ts`) automatically:

1. Creates any missing table (`CREATE TABLE IF NOT EXISTS`) — all 15 tables
   with utf8mb4 + proper indexes.
2. Patches older tables (`ALTER TABLE ... ADD COLUMN` wrapped in try/catch) —
   duplicate-column errors are swallowed, so it's safe on every boot.

Your existing production tables (`groups`, `categories`, `countries`, …)
keep their data — the guard only adds what's missing.

**Verify:** after deploy, open `https://yourdomain.com/api/health` —
you should get:

```json
{"ok":true,"db":{"ok":true,"serverInfo":"10.x.x-MariaDB"},"version":"3.0.0-mysql2"}
```

If `db.ok` is `false`, the env vars in §2 are wrong (host/user/password/name).

---

## 5. Cron jobs (hPanel → Advanced → Cron Jobs)

The cron scripts are plain `.mjs` (Node runs them directly, no build step).
hPanel crons do **not** inherit the Node.js app's env vars, so either pass the
DB vars inline (below) or rely on the `.env` file at the app root (the scripts
read it themselves — see §2).

| Schedule | Command |
|---|---|
| Every 15 min | `cd /home/uXXXX/domains/yourdomain/nodejs && DB_HOST=localhost DB_USER=u824913874_spanish DB_PASSWORD=xxx DB_NAME=u824913874_spanishs node scripts/crons/drip-feed.mjs` |
| Every 6 hours | `... node scripts/crons/link-checker.mjs` |
| Every 10 min | `... node scripts/crons/image-refresh.mjs` |
| Daily 2:00 AM | `... BASE_URL=https://yourdomain.com node scripts/crons/sitemap-generator.mjs` |

(Replace `uXXXX` / domain with your real path — it's shown in hPanel's
Node.js app details. Each script writes logs to `logs/*.log` and uses a lock
file so runs never overlap.)

### 5.1 Drip publisher — step-by-step setup

The drip publisher (`drip-feed.mjs`) moves queued groups live gradually:
every run publishes up to `dripFeedPerRun` groups (default 5, editable in
Admin → UGC Policy panel; range 1–100), picked round-robin so consecutive
runs are diverse by category+country. Duplicate invite links are auto-killed.

**Setup in hPanel:**

1. Find your app path: **hPanel → Websites → your site → Dashboard →
   Node.js** — the "Application root" is shown there, e.g.
   `/home/u1234567/domains/gruposhoy.com/nodejs`.
2. Go to **Advanced → Cron Jobs → Add new cron job** (or edit the existing one).
3. **Schedule:** select *Common options → Every 15 minutes*
   (equivalent to `*/15 * * * *`).
4. **Command** (single line — replace path + DB password with yours):

   ```bash
   cd /home/u1234567/domains/gruposhoy.com/nodejs && DB_HOST=localhost DB_USER=u824913874_spanish DB_PASSWORD=YOUR_MYSQL_PASS DB_NAME=u824913874_spanishs BASE_URL=https://gruposhoy.com node scripts/crons/drip-feed.mjs
   ```

   If a `.env` with the DB creds already sits in the app root (recommended,
   §2), the short form works too:

   ```bash
   cd /home/u1234567/domains/gruposhoy.com/nodejs && node scripts/crons/drip-feed.mjs
   ```

5. Save. Done — no build, no restart needed.

**What happens on each run:**

- Publishes up to `dripFeedPerRun` queued groups → `status='live'`, unique SEO
  slug, `NOW()` timestamps.
- **Instant sitemap refresh:** when ≥1 group goes live, the drip publisher
  automatically spawns `sitemap-generator.mjs`, so new `/grupo/<slug>` URLs
  enter `sitemap.xml` within seconds — never wait for the nightly 2 AM cron.
  Sitemap files are written to BOTH `public/` and `.next/standalone/public/`
  (the dir the running production server actually serves from).
- Queue empty → logs "Queue empty. Nothing to publish." and exits (cheap).

**Verify it works:**

1. Wait for one scheduled run (or temporarily set the schedule to
   *Every minute* to test, then set it back to 15).
2. Check `logs/drip-feed.log` in the app root — you should see
   `Published: '<name>' [slug: …]` lines followed by
   `Sitemap refresh done (instant, post-drip).`
3. Open `https://yourdomain.com/sitemap.xml` — `lastmod` should be today.
4. Admin dashboard → Sitemap card should show **"Al día"** (fresh).

**Tuning the drip rate:** the 15-min schedule × `dripFeedPerRun` = hourly
throughput. Defaults: 5 × 4 = 20 groups/hour = 480/day. Raise
`dripFeedPerRun` in the admin panel for faster drains of big bulk uploads
(e.g. 25 × 4 = 100/hour).

**Troubleshooting:**

| Symptom | Fix |
|---|---|
| Cron mail says `node: command not found` | Use the full node path in the command (find it in hPanel Node.js details or `which node` via SSH), e.g. `/opt/alt/nodejs22/bin/node scripts/crons/drip-feed.mjs` |
| `ER_ACCESS_DENIED_ERROR` in `logs/drip-feed.log` | Wrong `DB_USER`/`DB_PASSWORD` in the cron command (or `.env` missing) — must match phpMyAdmin creds |
| Nothing publishes, queue full | Check `logs/drip-feed.log` for "Another instance is running" (stale lock — clears after 10 min) or FATAL lines |
| Groups live but sitemap old | Check `logs/sitemap-gen.log`; confirm `BASE_URL` is set so URLs use the domain, not the fallback |

---

## 6. ZIP deployment checklist

**Include:** `src/`, `public/`, `scripts/`, `package.json`, `package-lock.json`,
`next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json`,
`eslint.config.mjs`, `db/` (optional).

**Exclude:** `node_modules/` (hPanel runs `npm install`), `.env*`
(create on the server — see §2), `.next/` (rebuilt on server),
`mysql-runtime/` (sandbox-only local DB),
`db/legacy-sqlite.db` (already migrated), `logs/`.

---

## 7. Debug map

| Symptom | Meaning | Fix |
|---|---|---|
| 503 | App process not starting | Node logs → find first crash line. Usually: wrong start command, missing env var, or ESM/CJS mismatch (this app is ESM and consistent). |
| 404 | App up, route missing | Check URL spelling; SPA/Next routes are filesystem-based. |
| 500 | App up, code threw | Node logs → stack trace. Check `/api/health` → `db.ok`. |
| Slow pages | Remote DB or missing pool | Confirm `DB_HOST=localhost`. The pool (`connectionLimit: 10`) is in `src/lib/db.ts`. |
| Empty homepage | DB connected but no live groups | Check `groups` table has `status='live'` rows (phpMyAdmin or admin panel). |
| 403 after redeploy | `.htaccess` regeneration glitch | Redeploy again — hPanel regenerates it. |

**Fast debug loop:** hPanel Node logs → fix first error → redeploy →
`curl https://yourdomain.com/api/health`.

---

## 8. Local development (sandbox)

```bash
./start-mariadb.sh     # local MariaDB on 127.0.0.1:3306 (same code path as prod)
./start-dev.sh         # next dev on :3000 (webpack mode — Turbopack OOMs on 4GB sandboxes)
```

Local dev needs no `.env` for the DB — `src/lib/db.ts` falls back to the
sandbox MariaDB defaults (user `grupos`, no password, database
`gruposwhatsapp` on 127.0.0.1:3306). The sandbox `.env` holds only
`PROXY_URL`. Data was migrated from the old SQLite file
(`db/legacy-sqlite.db`, 33 groups) via `bun scripts/migrate-sqlite-to-mysql.mjs`.

---

## 9. Architecture notes

- **One port, one process.** Next.js standalone server binds `process.env.PORT`
  (Hostinger assigns it). Never hardcoded.
- **API + pages in one app.** API routes live under `/api/*`; pages render
  server-side with `force-dynamic` (no build-time DB access).
- **Connection pool.** `mysql2/promise` `createPool` — 10 connections,
  keep-alive, 10s connect timeout, utf8mb4. One pool per process,
  global-cached to survive Next.js HMR.
- **bcryptjs, not bcrypt.** Pure JS — no native compilation on shared hosting.
- **Schema Guard, not migrations.** Idempotent, self-healing, runs once per
  process before the first query; retries on next request if the DB was
  briefly down.
- **Crons are plain Node scripts** (`.mjs`) — hPanel runs them directly.
